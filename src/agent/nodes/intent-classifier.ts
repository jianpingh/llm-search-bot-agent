import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state';
import { INTENT_CLASSIFICATION_SYSTEM_PROMPT } from '@/prompts';
import { IntentType } from '@/types';

export async function classifyIntent(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const userInput = state.userInput;
  const currentFilters = state.currentFilters;
  const previousContext = state.previousContext;
  
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
