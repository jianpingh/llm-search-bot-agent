import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state';
import { RESPONSE_GENERATION_SYSTEM_PROMPT } from '@/prompts';
import { SearchFilters, ConfidenceType } from '@/types';

export async function generateResponse(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const filters = state.currentFilters;
  const meta = state.meta;
  const needsClarification = state.needsClarification;
  const intent = state.intent;
  const userInput = state.userInput;
  
  // Build context for response generation
  const context = buildResponseContext(filters, meta, needsClarification, intent, userInput);
  
  try {
    const response = await llm.invoke([
      new SystemMessage(RESPONSE_GENERATION_SYSTEM_PROMPT),
      new HumanMessage(context)
    ]);
    
    return {
      response: response.content as string
    };
  } catch (e) {
    console.error('Failed to generate response:', e);
    return {
      response: generateFallbackResponse(filters, meta, needsClarification)
    };
  }
}

// Streaming version of response generation
export async function* generateResponseStream(
  state: AgentStateType,
  llm: ChatOpenAI
): AsyncGenerator<string> {
  const filters = state.currentFilters;
  const meta = state.meta;
  const needsClarification = state.needsClarification;
  const intent = state.intent;
  const userInput = state.userInput;
  
  const context = buildResponseContext(filters, meta, needsClarification, intent, userInput);
  
  try {
    const stream = await llm.stream([
      new SystemMessage(RESPONSE_GENERATION_SYSTEM_PROMPT),
      new HumanMessage(context)
    ]);
    
    for await (const chunk of stream) {
      if (typeof chunk.content === 'string') {
        yield chunk.content;
      }
    }
  } catch (e) {
    console.error('Failed to stream response:', e);
    yield generateFallbackResponse(filters, meta, needsClarification);
  }
}

function buildResponseContext(
  filters: SearchFilters,
  meta: {
    domain: 'person' | 'company';
    isNewSearch: boolean;
    completenessScore: number;
    missingFields: string[];
    clarificationNeeded: boolean;
    clarificationQuestion?: string;
  },
  needsClarification: boolean,
  intent: { type: string; confidence: number; reasoning?: string } | null,
  userInput: string
): string {
  // Format filters for display
  const formattedFilters = formatFiltersForContext(filters);
  
  return `
User's original input: "${userInput}"
Intent detected: ${intent?.type || 'unknown'} (confidence: ${intent?.confidence || 0})

Current search filters:
${formattedFilters || '(No filters extracted yet)'}

Search domain: ${meta.domain}
Completeness score: ${meta.completenessScore}%
Is new search: ${meta.isNewSearch}
Needs clarification: ${needsClarification}
Missing fields: ${meta.missingFields.join(', ') || 'None'}
${meta.clarificationQuestion ? `Suggested clarification question: ${meta.clarificationQuestion}` : ''}

INSTRUCTIONS:
${needsClarification 
  ? '- Ask the user to provide more details, specifically about: ' + meta.missingFields[0]
  : '- Summarize the filters and ask for confirmation to search'
}
- Be friendly and conversational
- Format filters as bullet points
- Mention any GUESS confidence items as assumptions
- Respond in the same language as the user's input
`;
}

function formatFiltersForContext(filters: SearchFilters): string {
  const lines: string[] = [];
  
  const fieldNames: Record<keyof SearchFilters, string> = {
    titles: 'Job Titles',
    locations: 'Locations',
    industries: 'Industries',
    seniorities: 'Seniority Levels',
    companyHeadcount: 'Company Size',
    yearsOfExperience: 'Experience',
    skills: 'Skills',
    companies: 'Companies'
  };
  
  for (const [key, field] of Object.entries(filters)) {
    if (!field?.value) continue;
    
    const name = fieldNames[key as keyof SearchFilters] || key;
    let valueStr: string;
    
    if (Array.isArray(field.value)) {
      valueStr = field.value.join(', ');
    } else if (typeof field.value === 'object') {
      const exp = field.value as { min?: number; max?: number };
      valueStr = `${exp.min || 0}${exp.max ? `-${exp.max}` : '+'} years`;
    } else {
      valueStr = String(field.value);
    }
    
    const confidenceNote = field.confidence === 'GUESS' ? ' (inferred)' : '';
    lines.push(`- ${name}: ${valueStr}${confidenceNote}`);
  }
  
  return lines.join('\n');
}

function generateFallbackResponse(
  filters: SearchFilters,
  meta: {
    domain: 'person' | 'company';
    completenessScore: number;
    missingFields: string[];
    clarificationNeeded: boolean;
    clarificationQuestion?: string;
  },
  needsClarification: boolean
): string {
  const filterCount = Object.keys(filters).filter(k => filters[k as keyof SearchFilters]?.value).length;
  
  if (filterCount === 0) {
    return "I'd be happy to help you search! Could you tell me what you're looking for? For example, you could say 'Find CTOs in Singapore' or 'Find AI startups'.";
  }
  
  if (needsClarification && meta.clarificationQuestion) {
    return `I found some search criteria. ${meta.clarificationQuestion}`;
  }
  
  // Build filter summary
  const filterLines: string[] = [];
  const fieldLabels: Record<string, string> = {
    titles: 'Job Titles',
    locations: 'Locations',
    industries: 'Industries',
    seniorities: 'Seniority',
    companyHeadcount: 'Company Size',
    yearsOfExperience: 'Experience',
    skills: 'Skills',
    companies: 'Companies'
  };
  
  for (const [key, field] of Object.entries(filters)) {
    if (!field?.value) continue;
    const label = fieldLabels[key] || key;
    const value = Array.isArray(field.value) ? field.value.join(', ') : JSON.stringify(field.value);
    filterLines.push(`• ${label}: ${value}`);
  }
  
  return `Here's what I found:\n\n${filterLines.join('\n')}\n\nShall I search with these filters? 🔍`;
}
