import { SearchFilters, SearchMeta } from './filters';

// Message structure
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  filters?: SearchFilters;
  meta?: SearchMeta;
  isStreaming?: boolean;
}

// Conversation state
export interface ConversationState {
  messages: Message[];
  currentFilters: SearchFilters;
  currentDomain: 'person' | 'company';
  previousContext?: {
    domain: 'person' | 'company';
    filters: SearchFilters;
  };
  sessionId: string;
}

// Intent types
export type IntentType = 
  | 'new_search'      // Start a completely new search
  | 'refine'          // Add more conditions to current search
  | 'modify'          // Change a specific condition
  | 'confirm'         // Confirm the search filters
  | 'reject'          // Reject/restart
  | 'cross_domain';   // Switch from company to person search or vice versa

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  reasoning?: string;
}
