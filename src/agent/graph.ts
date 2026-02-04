import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
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
import { getCheckpointer } from '@/lib/checkpointer';

// Initialize global proxy (must be done before any HTTP requests)
import '@/lib/proxy';

// Create LLM instance
function createLLM(): ChatOpenAI {
  const config: {
    modelName: string;
    temperature: number;
    streaming: boolean;
    openAIApiKey?: string;
    configuration?: {
      baseURL?: string;
    };
  } = {
    modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.1,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
  };

  // Support custom base URL (for proxy services in China)
  if (process.env.OPENAI_BASE_URL) {
    config.configuration = {
      baseURL: process.env.OPENAI_BASE_URL,
    };
  }

  return new ChatOpenAI(config);
}

// Singleton LLM instance
let llmInstance: ChatOpenAI | null = null;
function getLLM(): ChatOpenAI {
  if (!llmInstance) {
    llmInstance = createLLM();
  }
  return llmInstance;
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
  const llm = getLLM();
  
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
  
  // Compile the graph (checkpointer will be added in runAgentWithStreaming)
  return graph;
}

// Compiled agent cache
let compiledAgent: ReturnType<typeof StateGraph.prototype.compile> | null = null;

// Get or create compiled agent with checkpointer
async function getCompiledAgent() {
  if (!compiledAgent) {
    const graph = createSearchAgent();
    const checkpointer = await getCheckpointer();
    compiledAgent = graph.compile({ checkpointer });
    console.log('[Agent] Graph compiled with PostgreSQL checkpointer');
  }
  return compiledAgent;
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
  const agent = await getCompiledAgent();
  
  const config = {
    configurable: {
      thread_id: sessionId,
    },
  };
  
  // Build initial state - with PostgreSQL checkpointer, the state is automatically
  // loaded from the database based on thread_id, so we only need to provide new input
  const initialState: Partial<AgentStateType> = {
    userInput,
    sessionId,
    // Previous state is now managed by the checkpointer
    // but we still support manual override if provided
    ...(previousState?.currentFilters && { currentFilters: previousState.currentFilters }),
    ...(previousState?.meta && {
      meta: {
        domain: previousState.meta.domain || 'person',
        isNewSearch: previousState.meta.isNewSearch ?? true,
        completenessScore: previousState.meta.completenessScore || 0,
        missingFields: previousState.meta.missingFields || [],
        clarificationNeeded: previousState.meta.clarificationNeeded || false,
        clarificationQuestion: previousState.meta.clarificationQuestion,
      },
    }),
    ...(previousState?.previousContext && { previousContext: previousState.previousContext }),
    ...(previousState?.skipFields && { skipFields: previousState.skipFields }),
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
    let currentNode: string | null = null;  // Track current executing node
    
    for await (const event of eventStream) {
      // Track node execution
      if (event.event === 'on_chain_start' && event.name && Object.values(NODE_NAMES).includes(event.name as typeof NODE_NAMES[keyof typeof NODE_NAMES])) {
        currentNode = event.name;
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
        currentNode = null;
      }
      
      // Stream LLM content ONLY from generate_response node
      // Note: LangGraph v2 uses on_chat_model_stream instead of on_llm_stream
      if (event.event === 'on_chat_model_stream' && 
          currentNode === NODE_NAMES.GENERATE_RESPONSE &&
          event.data?.chunk?.content) {
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
