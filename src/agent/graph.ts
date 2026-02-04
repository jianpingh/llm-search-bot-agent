import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { AgentState, AgentStateType } from './state';
import {
  classifyIntent,
  extractFilters,
  checkCompleteness,
  rewriteQuery,
  generateResponse,
  isAnyResponse,
} from './nodes';
import { SSEEvent } from '@/types';

// Create LLM instance
function createLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.1,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// Node names for progress tracking
export const NODE_NAMES = {
  CLASSIFY_INTENT: 'classify_intent',
  REWRITE_QUERY: 'rewrite_query',
  EXTRACT_FILTERS: 'extract_filters',
  CHECK_COMPLETENESS: 'check_completeness',
  GENERATE_RESPONSE: 'generate_response',
} as const;

// Router: decide next step based on intent
function routeByIntent(state: AgentStateType): string {
  const intent = state.intent;
  
  if (!intent) {
    return NODE_NAMES.REWRITE_QUERY;
  }
  
  switch (intent.type) {
    case 'confirm':
      // User confirmed, generate final response
      return NODE_NAMES.GENERATE_RESPONSE;
      
    case 'reject':
      // User rejected, generate response asking what to change
      return NODE_NAMES.GENERATE_RESPONSE;
      
    case 'new_search':
    case 'refine':
    case 'modify':
    case 'cross_domain':
    default:
      // Need to process the query
      return NODE_NAMES.REWRITE_QUERY;
  }
}

// Router: decide next step based on completeness
function routeByCompleteness(state: AgentStateType): string {
  // Always go to response generation
  return NODE_NAMES.GENERATE_RESPONSE;
}

// Create the search agent graph
export function createSearchAgent() {
  const llm = createLLM();
  
  // Create the graph
  const graph = new StateGraph(AgentState)
    // Add nodes
    .addNode(NODE_NAMES.CLASSIFY_INTENT, async (state) => {
      // Check if user is saying "any" or "doesn't matter"
      if (isAnyResponse(state.userInput)) {
        // Get the field that was being asked about
        const missingFields = state.meta.missingFields;
        if (missingFields.length > 0) {
          // Add the first missing field to skip list
          return {
            intent: { type: 'confirm' as const, confidence: 0.9 },
            skipFields: [missingFields[0]],
          };
        }
      }
      return classifyIntent(state, llm);
    })
    
    .addNode(NODE_NAMES.REWRITE_QUERY, async (state) => {
      return rewriteQuery(state, llm);
    })
    
    .addNode(NODE_NAMES.EXTRACT_FILTERS, async (state) => {
      return extractFilters(state, llm);
    })
    
    .addNode(NODE_NAMES.CHECK_COMPLETENESS, (state) => {
      return checkCompleteness(state);
    })
    
    .addNode(NODE_NAMES.GENERATE_RESPONSE, async (state) => {
      return generateResponse(state, llm);
    })
    
    // Add edges
    .addEdge(START, NODE_NAMES.CLASSIFY_INTENT)
    
    .addConditionalEdges(
      NODE_NAMES.CLASSIFY_INTENT,
      routeByIntent,
      {
        [NODE_NAMES.REWRITE_QUERY]: NODE_NAMES.REWRITE_QUERY,
        [NODE_NAMES.GENERATE_RESPONSE]: NODE_NAMES.GENERATE_RESPONSE,
      }
    )
    
    .addEdge(NODE_NAMES.REWRITE_QUERY, NODE_NAMES.EXTRACT_FILTERS)
    .addEdge(NODE_NAMES.EXTRACT_FILTERS, NODE_NAMES.CHECK_COMPLETENESS)
    
    .addConditionalEdges(
      NODE_NAMES.CHECK_COMPLETENESS,
      routeByCompleteness,
      {
        [NODE_NAMES.GENERATE_RESPONSE]: NODE_NAMES.GENERATE_RESPONSE,
      }
    )
    
    .addEdge(NODE_NAMES.GENERATE_RESPONSE, END);
  
  // Create checkpointer
  const checkpointer = new MemorySaver();
  
  // Compile the graph
  return graph.compile({ checkpointer });
}

// Run agent with streaming events
export async function* runAgentWithStreaming(
  sessionId: string,
  userInput: string,
  previousState?: {
    currentFilters?: AgentStateType['currentFilters'];
    meta?: Partial<AgentStateType['meta']>;
    previousContext?: AgentStateType['previousContext'];
    skipFields?: string[];
  }
): AsyncGenerator<SSEEvent> {
  const agent = createSearchAgent();
  
  const config = {
    configurable: {
      thread_id: sessionId,
    },
  };
  
  // Build initial state
  const initialState: Partial<AgentStateType> = {
    userInput,
    sessionId,
    currentFilters: previousState?.currentFilters || {},
    meta: {
      domain: previousState?.meta?.domain || 'person',
      isNewSearch: true,
      completenessScore: previousState?.meta?.completenessScore || 0,
      missingFields: previousState?.meta?.missingFields || [],
      clarificationNeeded: previousState?.meta?.clarificationNeeded || false,
      clarificationQuestion: previousState?.meta?.clarificationQuestion,
    },
    previousContext: previousState?.previousContext || null,
    skipFields: previousState?.skipFields || [],
  };
  
  // Send heartbeat
  yield {
    type: 'heartbeat',
    data: { timestamp: Date.now() },
    timestamp: Date.now(),
  };
  
  try {
    // Stream events from the graph
    const eventStream = agent.streamEvents(initialState, {
      ...config,
      version: 'v2',
    });
    
    let finalState: AgentStateType | null = null;
    let responseContent = '';
    
    for await (const event of eventStream) {
      // Track node execution
      if (event.event === 'on_chain_start' && event.name && Object.values(NODE_NAMES).includes(event.name as typeof NODE_NAMES[keyof typeof NODE_NAMES])) {
        yield {
          type: 'progress',
          data: {
            node: event.name,
            status: 'started',
            message: getNodeDescription(event.name),
          },
          timestamp: Date.now(),
        };
      }
      
      if (event.event === 'on_chain_end' && event.name && Object.values(NODE_NAMES).includes(event.name as typeof NODE_NAMES[keyof typeof NODE_NAMES])) {
        yield {
          type: 'progress',
          data: {
            node: event.name,
            status: 'completed',
          },
          timestamp: Date.now(),
        };
        
        // Capture final state from the last node
        if (event.data?.output && event.name === NODE_NAMES.GENERATE_RESPONSE) {
          if (event.data.output.response) {
            responseContent = event.data.output.response;
          }
        }
      }
      
      // Stream LLM content (for response generation)
      if (event.event === 'on_llm_stream' && event.data?.chunk?.content) {
        const content = event.data.chunk.content as string;
        if (content) {
          yield {
            type: 'content',
            data: {
              chunk: content,
              isComplete: false,
            },
            timestamp: Date.now(),
          };
        }
      }
      
      // Capture final output
      if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
        finalState = event.data?.output as AgentStateType;
      }
    }
    
    // Send final filters
    if (finalState) {
      yield {
        type: 'filters',
        data: {
          filters: finalState.currentFilters,
          meta: finalState.meta,
        },
        timestamp: Date.now(),
      };
    }
    
    // Send completion
    yield {
      type: 'done',
      data: {
        success: true,
        sessionId,
      },
      timestamp: Date.now(),
    };
    
  } catch (error) {
    console.error('Agent execution error:', error);
    yield {
      type: 'error',
      data: {
        message: (error as Error).message || 'An error occurred',
        code: 'AGENT_ERROR',
      },
      timestamp: Date.now(),
    };
  }
}

// Get human-readable description for node
function getNodeDescription(nodeName: string): string {
  const descriptions: Record<string, string> = {
    [NODE_NAMES.CLASSIFY_INTENT]: 'Understanding your intent...',
    [NODE_NAMES.REWRITE_QUERY]: 'Processing your query...',
    [NODE_NAMES.EXTRACT_FILTERS]: 'Extracting search filters...',
    [NODE_NAMES.CHECK_COMPLETENESS]: 'Checking filter completeness...',
    [NODE_NAMES.GENERATE_RESPONSE]: 'Generating response...',
  };
  
  return descriptions[nodeName] || 'Processing...';
}

// Export types
export type { AgentStateType };
