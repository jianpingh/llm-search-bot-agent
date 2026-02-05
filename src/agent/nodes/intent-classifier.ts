import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state';
import { INTENT_CLASSIFICATION_SYSTEM_PROMPT } from '@/prompts';
import { IntentType } from '@/types';

// Simple confirmation words that should trigger search execution
const CONFIRM_WORDS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please', 'go', 'proceed', 'search', 'find',
                       '是', '好', '好的', '可以', '行', '确认', '搜索', '开始', '执行', '查找'];

// Common industry values that should be treated as refine when we have existing filters
const INDUSTRY_VALUES = ['technology', 'tech', 'finance', 'financial', 'healthcare', 'health', 'medical',
                         'education', 'retail', 'manufacturing', 'consulting', 'real estate', 'media',
                         'entertainment', 'telecom', 'telecommunications', 'automotive', 'energy', 'banking',
                         '科技', '金融', '医疗', '教育', '零售', '制造', '咨询', '房地产', '媒体', '娱乐',
                         'software', 'internet', 'it', 'fintech', 'biotech', 'saas', 'ecommerce', 'e-commerce'];

// Common location values
const LOCATION_VALUES = ['singapore', 'new york', 'london', 'san francisco', 'tokyo', 'hong kong', 'shanghai',
                         'beijing', 'sydney', 'berlin', 'paris', 'toronto', 'boston', 'seattle', 'austin',
                         '新加坡', '纽约', '伦敦', '旧金山', '东京', '香港', '上海', '北京', 'us', 'usa', 'uk', 'china'];

// Common company size values
const SIZE_VALUES = ['startup', 'startups', 'enterprise', 'mid-size', 'midsize', 'small', 'large', 'any',
                     '初创', '创业', '大型', '中型', '小型'];

// Check if user input is a simple confirmation
function isSimpleConfirmation(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  // Check if input is just a confirmation word (with possible punctuation)
  return CONFIRM_WORDS.some(word => {
    const pattern = new RegExp(`^${word}[!.?]*$`, 'i');
    return pattern.test(normalized) || normalized === word;
  });
}

// Check if input is a simple value that should be treated as refine
function isSimpleRefineValue(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  
  // Check if it's a simple industry value
  if (INDUSTRY_VALUES.some(v => normalized === v || normalized === v + 's')) {
    return true;
  }
  
  // Check if it's a simple location value
  if (LOCATION_VALUES.some(v => normalized === v)) {
    return true;
  }
  
  // Check if it's a company size value
  if (SIZE_VALUES.some(v => normalized === v || normalized.includes(v))) {
    return true;
  }
  
  return false;
}

// Check if user explicitly wants to search for companies (cross_domain from person search)
function isExplicitCompanySearch(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  const companyPatterns = [
    /find\s+(company|companies)/i,
    /search\s+(company|companies)/i,
    /look\s+for\s+(company|companies)/i,
    /找公司/,
    /搜索公司/,
    /查找公司/,
  ];
  return companyPatterns.some(pattern => pattern.test(normalized));
}

// Check if user explicitly wants to search for people (cross_domain from company search)
function isExplicitPersonSearch(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  const personPatterns = [
    /find\s+(people|person|candidates|employees)/i,
    /search\s+(people|person|candidates|employees)/i,
    /look\s+for\s+(people|person|candidates|employees)/i,
    /找人/,
    /搜索人/,
    /查找人才/,
    /查找候选人/,
  ];
  return personPatterns.some(pattern => pattern.test(normalized));
}

export async function classifyIntent(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const userInput = state.userInput;
  const currentFilters = state.currentFilters;
  const previousContext = state.previousContext;
  const currentDomain = state.meta.domain;
  
  // Quick check: if user input is a simple confirmation and we have filters, return confirm intent directly
  const hasFilters = Object.keys(currentFilters).some(k => currentFilters[k as keyof typeof currentFilters]?.value);
  if (hasFilters && isSimpleConfirmation(userInput)) {
    console.log('[Intent] Detected simple confirmation, returning confirm intent');
    return {
      intent: {
        type: 'confirm' as IntentType,
        confidence: 0.95,
        reasoning: 'User provided a simple confirmation word',
      },
    };
  }
  
  // Quick check: detect cross_domain when user explicitly wants to switch search type
  if (hasFilters) {
    // If currently searching people and user wants to find companies
    if (currentDomain === 'person' && isExplicitCompanySearch(userInput)) {
      console.log('[Intent] Detected explicit company search, returning cross_domain intent');
      return {
        intent: {
          type: 'cross_domain' as IntentType,
          confidence: 0.95,
          reasoning: 'User explicitly wants to search for companies instead of people',
        },
      };
    }
    // If currently searching companies and user wants to find people
    if (currentDomain === 'company' && isExplicitPersonSearch(userInput)) {
      console.log('[Intent] Detected explicit person search, returning cross_domain intent');
      return {
        intent: {
          type: 'cross_domain' as IntentType,
          confidence: 0.95,
          reasoning: 'User explicitly wants to search for people instead of companies',
        },
      };
    }
  }
  
  // Quick check: if user input is a simple value (industry, location, size) and we have filters, it's a refine
  if (hasFilters && isSimpleRefineValue(userInput)) {
    console.log('[Intent] Detected simple refine value, returning refine intent');
    return {
      intent: {
        type: 'refine' as IntentType,
        confidence: 0.95,
        reasoning: 'User provided a simple value to add to existing search filters',
      },
    };
  }
  
  // Build context string
  let contextStr = '';
  
  if (Object.keys(currentFilters).length > 0) {
    const filterSummary = Object.entries(currentFilters)
      .filter(([_, v]) => v?.value)
      .map(([k, v]) => `${k}: ${JSON.stringify(v?.value)}`)
      .join(', ');
    contextStr = `Current search filters: ${filterSummary}`;
  } else if (previousContext && Object.keys(previousContext.filters).length > 0) {
    const filterSummary = Object.entries(previousContext.filters)
      .filter(([_, v]) => v?.value)
      .map(([k, v]) => `${k}: ${JSON.stringify(v?.value)}`)
      .join(', ');
    contextStr = `Previous ${previousContext.domain} search: ${filterSummary}`;
  } else {
    contextStr = 'No previous search context';
  }
  
  const prompt = `Context: ${contextStr}\n\nUser input: "${userInput}"`;
  
  try {
    const response = await llm.invoke([
      new SystemMessage(INTENT_CLASSIFICATION_SYSTEM_PROMPT),
      new HumanMessage(prompt)
    ]);
    
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const intentType = parsed.type as IntentType;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
      
      // Prepare state updates
      const updates: Partial<AgentStateType> = {
        intent: {
          type: intentType,
          confidence,
          reasoning: parsed.reasoning,
        },
      };
      
      // If new search and we have current filters, save as previous context
      if (intentType === 'new_search' && Object.keys(currentFilters).length > 0) {
        updates.previousContext = {
          domain: state.meta.domain,
          filters: currentFilters,
        };
        // Clear current filters
        updates.currentFilters = {};
        updates.meta = {
          ...state.meta,
          isNewSearch: true,
        };
      }
      
      return updates;
    }
  } catch (e) {
    console.error('Failed to classify intent:', e);
  }
  
  // Default to new_search if classification fails
  return {
    intent: {
      type: 'new_search',
      confidence: 0.5,
      reasoning: 'Default classification due to parsing error',
    },
  };
}

// Check if user is saying "any" or "doesn't matter" for a field
export function detectAnyResponse(userInput: string): { isAny: boolean; field?: string } {
  const anyPatterns = [
    /any\s*(location|place|city|country)?/i,
    /doesn'?t?\s*matter/i,
    /don'?t\s*care/i,
    /no\s*preference/i,
    /anywhere/i,
    /whatever/i,
    /都行/,
    /无所谓/,
    /随便/,
    /没关系/,
    /都可以/,
  ];
  
  for (const pattern of anyPatterns) {
    if (pattern.test(userInput)) {
      // Try to detect which field user is referring to
      if (/location|place|city|country|where|地点|地方|城市/i.test(userInput)) {
        return { isAny: true, field: 'locations' };
      }
      if (/industry|sector|行业/i.test(userInput)) {
        return { isAny: true, field: 'industries' };
      }
      if (/seniority|level|级别/i.test(userInput)) {
        return { isAny: true, field: 'seniorities' };
      }
      if (/company\s*size|公司规模/i.test(userInput)) {
        return { isAny: true, field: 'companyHeadcount' };
      }
      // General "any" without specific field
      return { isAny: true };
    }
  }
  
  return { isAny: false };
}
