import { SearchFilters, SearchMeta } from '@/types';

// Simple in-memory storage (use Redis/DB in production)
const checkpointStore = new Map<string, {
  filters: SearchFilters;
  meta: SearchMeta;
  previousContext: { domain: 'person' | 'company'; filters: SearchFilters } | null;
  skipFields: string[];
  updatedAt: Date;
}>();

// Session data interface
export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastActiveAt: Date;
  filters: SearchFilters;
  meta: SearchMeta;
  previousContext: { domain: 'person' | 'company'; filters: SearchFilters } | null;
  skipFields: string[];
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

const sessionStore = new Map<string, SessionData>();

// Generate unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Create new session
export function createSession(): SessionData {
  const sessionId = generateSessionId();
  const now = new Date();
  
  const session: SessionData = {
    sessionId,
    createdAt: now,
    lastActiveAt: now,
    filters: {},
    meta: {
      domain: 'person',
      isNewSearch: true,
      completenessScore: 0,
      missingFields: [],
      clarificationNeeded: false,
    },
    previousContext: null,
    skipFields: [],
    messages: [],
  };
  
  sessionStore.set(sessionId, session);
  return session;
}

// Get session by ID
export function getSession(sessionId: string): SessionData | undefined {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.lastActiveAt = new Date();
    return session;
  }
  return undefined;
}

// Save session
export function saveSession(session: SessionData): void {
  session.lastActiveAt = new Date();
  sessionStore.set(session.sessionId, session);
}

// Update session filters
export function updateSessionFilters(
  sessionId: string,
  filters: SearchFilters,
  meta: SearchMeta
): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.filters = filters;
    session.meta = meta;
    session.lastActiveAt = new Date();
  }
}

// Add message to session
export function addMessageToSession(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
    session.lastActiveAt = new Date();
  }
}

// Clear session filters (for new search)
export function clearSessionFilters(sessionId: string): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    // Save current as previous context before clearing
    if (Object.keys(session.filters).length > 0) {
      session.previousContext = {
        domain: session.meta.domain,
        filters: session.filters,
      };
    }
    
    session.filters = {};
    session.meta = {
      domain: 'person',
      isNewSearch: true,
      completenessScore: 0,
      missingFields: [],
      clarificationNeeded: false,
    };
    session.skipFields = [];
    session.lastActiveAt = new Date();
  }
}

// Update skip fields
export function addSkipField(sessionId: string, field: string): void {
  const session = sessionStore.get(sessionId);
  if (session && !session.skipFields.includes(field)) {
    session.skipFields.push(field);
    session.lastActiveAt = new Date();
  }
}

// Delete old sessions (cleanup)
export function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;
  
  const entries = Array.from(sessionStore.entries());
  for (const [sessionId, session] of entries) {
    if (now - session.lastActiveAt.getTime() > maxAgeMs) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  return cleaned;
}

// Get all active sessions (for debugging)
export function getAllSessions(): SessionData[] {
  return Array.from(sessionStore.values());
}
