import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state';
import { RESPONSE_GENERATION_SYSTEM_PROMPT } from '@/prompts';
import { SearchFilters, ConfidenceType } from '@/types';
import { search, formatSearchResults, SimpleSearchFilters } from '@/lib/search-service';

// Convert agent filters to search service format
function convertFiltersForSearch(filters: SearchFilters): SimpleSearchFilters {
  const result: SimpleSearchFilters = {};
  
  if (filters.titles?.value) {
    result.jobTitle = Array.isArray(filters.titles.value) ? filters.titles.value : [filters.titles.value];
  }
  if (filters.locations?.value) {
    result.location = Array.isArray(filters.locations.value) ? filters.locations.value : [filters.locations.value];
  }
  if (filters.industries?.value) {
    result.industry = Array.isArray(filters.industries.value) ? filters.industries.value : [filters.industries.value];
  }
  if (filters.seniorities?.value) {
    result.seniority = Array.isArray(filters.seniorities.value) ? filters.seniorities.value : [filters.seniorities.value];
  }
  if (filters.companyHeadcount?.value) {
    result.companyHeadcount = filters.companyHeadcount.value;
  }
  if (filters.yearsOfExperience?.value) {
    const exp = filters.yearsOfExperience.value;
    if (typeof exp === 'object' && 'min' in exp) {
      result.yearsOfExperience = `${exp.min}+`;
    } else {
      result.yearsOfExperience = String(exp);
    }
  }
  if (filters.companies?.value) {
    result.companyName = Array.isArray(filters.companies.value) ? filters.companies.value[0] : filters.companies.value;
  }
  
  return result;
}

export async function generateResponse(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const filters = state.currentFilters;
  const meta = state.meta;
  const needsClarification = state.needsClarification;
  const intent = state.intent;
  const userInput = state.userInput;
  
  // Check if user is confirming to execute search
  // Execute search if:
  // 1. Intent is 'confirm' (user explicitly confirmed)
  // 2. OR user input contains confirmation words AND we have some filters
  const hasFilters = Object.keys(filters).some(k => filters[k as keyof SearchFilters]?.value);
  const isConfirm = intent?.type === 'confirm';
  const hasConfirmWords = ['yes', 'please', 'ok', 'sure', 'go', 'search', 'find', 'proceed', 
                           '是', '好', '可以', '搜索', '开始', '执行', '查找', '确认']
                          .some(word => userInput.toLowerCase().trim().includes(word));
  
  const shouldExecuteSearch = hasFilters && (isConfirm || (hasConfirmWords && !needsClarification));
  
  // If user confirms search, execute and return results directly
  if (shouldExecuteSearch) {
    const searchFilters = convertFiltersForSearch(filters);
    const searchDomain = meta.domain || 'person';
    console.log('[Search] Executing search with filters:', JSON.stringify(searchFilters), 'domain:', searchDomain);
    const results = search(searchFilters, searchDomain);
    const formattedResults = formatSearchResults(results);
    
    // Return formatted results directly without LLM
    return {
      response: formattedResults,
      searchExecuted: true,
    };
  }
  
  // Otherwise, build context for LLM response
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
  
  // Check if we should execute search
  const hasFilters = Object.keys(filters).some(k => filters[k as keyof SearchFilters]?.value);
  const isConfirm = intent?.type === 'confirm';
  const hasConfirmWords = ['yes', 'please', 'ok', 'sure', 'go', 'search', 'find', 'proceed', 
                           '是', '好', '可以', '搜索', '开始', '执行', '查找', '确认']
                          .some(word => userInput.toLowerCase().trim().includes(word));
  
  const shouldExecuteSearch = hasFilters && (isConfirm || (hasConfirmWords && !needsClarification));
  
  // If executing search, return results directly (no LLM)
  if (shouldExecuteSearch) {
    const searchFilters = convertFiltersForSearch(filters);
    const searchDomain = meta.domain || 'person';
    console.log('[Search Stream] Executing search with filters:', JSON.stringify(searchFilters), 'domain:', searchDomain);
    const results = search(searchFilters, searchDomain);
    const formattedResults = formatSearchResults(results);
    
    // Return formatted results directly without LLM
    yield formattedResults;
    return;
  }
  
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

// System prompt for presenting search results
const SEARCH_RESULT_SYSTEM_PROMPT = `You are a helpful recruiting assistant presenting search results to the user.

CRITICAL LANGUAGE RULE:
- If the user's input is in English, respond ENTIRELY in English
- If the user's input is in Chinese, respond ENTIRELY in Chinese
- Match the user's language exactly

Your task:
1. Present the search results in a friendly, professional manner
2. Highlight key information about the candidates/companies found
3. If no results found, explain possible reasons and suggest adjustments
4. Offer to refine the search or provide more details

Format guidelines:
- Use clear formatting with bullet points or numbered lists
- Highlight important details like name, title, company, and key skills
- Keep the response concise but informative
- Add relevant emojis to make it visually appealing
- If many results, summarize the top ones and mention total count
- Format candidate info nicely: **Name** - Title @ Company, then details below
`;

function buildSearchResultContext(
  filters: SearchFilters,
  results: { people: any[]; companies: any[]; totalPeople: number; totalCompanies: number },
  formattedResults: string,
  userInput: string
): string {
  const filterSummary = formatFiltersForContext(filters);
  
  return `
User's search request: "${userInput}"

Search filters applied:
${filterSummary || '(No specific filters)'}

Search Results:
Total people found: ${results.totalPeople}
Total companies found: ${results.totalCompanies}

Detailed results:
${formattedResults}

Please present these results to the user in a friendly, helpful manner.
If no results were found, suggest ways to broaden the search.
Respond in the same language as the user's input.
`;
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
