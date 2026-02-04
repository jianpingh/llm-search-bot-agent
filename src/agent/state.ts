import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { SearchFilters, SearchMeta, IntentType } from '@/types';

// Agent state annotation
export const AgentState = Annotation.Root({
  // Conversation message history
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  
  // Current user input
  userInput: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  
  // Intent classification result
  intent: Annotation<{
    type: IntentType;
    confidence: number;
    reasoning?: string;
  } | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  
  // Current extracted filters
  currentFilters: Annotation<SearchFilters>({
    reducer: (current, update) => {
      if (!update || Object.keys(update).length === 0) return current;
      return mergeFilters(current, update);
    },
    default: () => ({}),
  }),
  
  // Search metadata
  meta: Annotation<SearchMeta>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({
      domain: 'person',
      isNewSearch: true,
      completenessScore: 0,
      missingFields: [],
      clarificationNeeded: false,
    }),
  }),
  
  // Previous search context (for cross-domain pivots)
  previousContext: Annotation<{
    domain: 'person' | 'company';
    filters: SearchFilters;
  } | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  
  // Rewritten query
  rewrittenQuery: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  
  // Generated response
  response: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  
  // Whether clarification is needed
  needsClarification: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  
  // Session ID
  sessionId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  
  // Skip fields - fields user said "any" or "doesn't matter" for
  skipFields: Annotation<string[]>({
    reducer: (current, update) => {
      if (!update) return current;
      return [...new Set([...current, ...update])];
    },
    default: () => [],
  }),
});

// Helper function to merge filters
function mergeFilters(current: SearchFilters, update: SearchFilters): SearchFilters {
  const merged: SearchFilters = { ...current };
  
  // Explicitly handle each field to avoid TypeScript union type issues
  if (update.titles) merged.titles = update.titles;
  if (update.locations) merged.locations = update.locations;
  if (update.industries) merged.industries = update.industries;
  if (update.seniorities) merged.seniorities = update.seniorities;
  if (update.companyHeadcount) merged.companyHeadcount = update.companyHeadcount;
  if (update.yearsOfExperience) merged.yearsOfExperience = update.yearsOfExperience;
  if (update.skills) merged.skills = update.skills;
  if (update.companies) merged.companies = update.companies;
  
  return merged;
}

// Helper function to clear filters (for new search)
export function clearFilters(): SearchFilters {
  return {};
}

// Helper function to inherit relevant filters for cross-domain
export function inheritFiltersForCrossDomain(
  previousFilters: SearchFilters,
  newDomain: 'person' | 'company'
): SearchFilters {
  // Fields that can be inherited between person and company searches
  const inherited: SearchFilters = {};
  
  // Inherit locations and industries
  if (previousFilters.locations) {
    inherited.locations = previousFilters.locations;
  }
  if (previousFilters.industries) {
    inherited.industries = previousFilters.industries;
  }
  
  return inherited;
}

// Type export
export type AgentStateType = typeof AgentState.State;
