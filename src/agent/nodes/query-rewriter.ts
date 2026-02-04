import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state';
import { QUERY_REWRITE_SYSTEM_PROMPT } from '@/prompts';

export async function rewriteQuery(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const userInput = state.userInput;
  
  // Check if query contains potentially ambiguous terms
  const ambiguousTerms = [
    'tech leaders', 'tech bros', 'engineers', 'developers',
    'product people', 'designers', 'big tech', 'faang',
    'startups', 'enterprise', 'europe', 'asia', 'bay area',
    'senior', 'junior', 'management', '技术大佬', '技术人员'
  ];
  
  const hasAmbiguousTerm = ambiguousTerms.some(term => 
    userInput.toLowerCase().includes(term.toLowerCase())
  );
  
  // If no ambiguous terms, skip rewriting
  if (!hasAmbiguousTerm) {
    return {
      rewrittenQuery: userInput
    };
  }
  
  try {
    const response = await llm.invoke([
      new SystemMessage(QUERY_REWRITE_SYSTEM_PROMPT),
      new HumanMessage(`Query: "${userInput}"`)
    ]);
    
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        rewrittenQuery: parsed.rewrittenQuery || userInput
      };
    }
  } catch (e) {
    console.error('Failed to rewrite query:', e);
  }
  
  return {
    rewrittenQuery: userInput
  };
}
