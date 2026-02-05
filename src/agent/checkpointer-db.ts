import { SearchFilters, SearchMeta } from '@/types';
import { query, initDatabase } from '@/lib/database';

// Session data interface
export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastActiveAt: Date;
  title: string;
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

// Database initialization flag
let dbInitialized = false;

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// Generate unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Convert database row to SessionData
function rowToSession(row: any): SessionData {
  return {
    sessionId: row.session_id,
    createdAt: new Date(row.created_at),
    lastActiveAt: new Date(row.last_active_at),
    title: row.title || 'New conversation',
    filters: row.filters || {},
    meta: row.meta || {
      domain: 'person',
      isNewSearch: true,
      completenessScore: 0,
      missingFields: [],
      clarificationNeeded: false,
    },
    previousContext: row.previous_context,
    skipFields: row.skip_fields || [],
    messages: (row.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
}

// Create new session
export async function createSession(): Promise<SessionData> {
  await ensureDbInitialized();
  
  const sessionId = generateSessionId();
  const now = new Date();
  const defaultMeta = {
    domain: 'person',
    isNewSearch: true,
    completenessScore: 0,
    missingFields: [],
    clarificationNeeded: false,
  };
  
  const sql = `
    INSERT INTO chat_sessions (session_id, created_at, last_active_at, title, filters, meta, previous_context, skip_fields, messages)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const rows = await query(sql, [
    sessionId,
    now,
    now,
    'New conversation',
    JSON.stringify({}),
    JSON.stringify(defaultMeta),
    null,
    JSON.stringify([]),
    JSON.stringify([]),
  ]);
  
  return rowToSession(rows[0]);
}

// Get session by ID
export async function getSession(sessionId: string, updateLastActive: boolean = true): Promise<SessionData | undefined> {
  await ensureDbInitialized();
  
  const sql = `SELECT * FROM chat_sessions WHERE session_id = $1`;
  const rows = await query(sql, [sessionId]);
  
  if (rows.length === 0) {
    return undefined;
  }
  
  const session = rowToSession(rows[0]);
  
  // Update last active timestamp if needed (for actual usage, not just viewing)
  if (updateLastActive) {
    await query(
      `UPDATE chat_sessions SET last_active_at = NOW() WHERE session_id = $1`,
      [sessionId]
    );
    session.lastActiveAt = new Date();
  }
  
  return session;
}

// Save session (full update)
export async function saveSession(session: SessionData): Promise<void> {
  await ensureDbInitialized();
  
  const sql = `
    UPDATE chat_sessions SET
      last_active_at = NOW(),
      filters = $2,
      meta = $3,
      previous_context = $4,
      skip_fields = $5,
      messages = $6
    WHERE session_id = $1
  `;
  
  await query(sql, [
    session.sessionId,
    JSON.stringify(session.filters),
    JSON.stringify(session.meta),
    session.previousContext ? JSON.stringify(session.previousContext) : null,
    JSON.stringify(session.skipFields),
    JSON.stringify(session.messages),
  ]);
}

// Update session filters
export async function updateSessionFilters(
  sessionId: string,
  filters: SearchFilters,
  meta: SearchMeta
): Promise<void> {
  await ensureDbInitialized();
  
  const sql = `
    UPDATE chat_sessions SET
      filters = $2,
      meta = $3,
      last_active_at = NOW()
    WHERE session_id = $1
  `;
  
  await query(sql, [sessionId, JSON.stringify(filters), JSON.stringify(meta)]);
}

// Add message to session
export async function addMessageToSession(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await ensureDbInitialized();
  
  const message = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  
  // If this is a user message, check if we need to update the title
  if (role === 'user') {
    // Check if session title is still default
    const checkSql = `SELECT title, jsonb_array_length(messages) as msg_count FROM chat_sessions WHERE session_id = $1`;
    const checkRows = await query(checkSql, [sessionId]);
    
    if (checkRows.length > 0) {
      const currentTitle = checkRows[0].title;
      const msgCount = checkRows[0].msg_count || 0;
      
      // Update title if it's the first user message (title is default or messages is empty)
      if (currentTitle === 'New conversation' || msgCount === 0) {
        const newTitle = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        const updateTitleSql = `
          UPDATE chat_sessions SET
            title = $2,
            messages = messages || $3::jsonb,
            last_active_at = NOW()
          WHERE session_id = $1
        `;
        await query(updateTitleSql, [sessionId, newTitle, JSON.stringify([message])]);
        return;
      }
    }
  }
  
  // Default: just append message
  const sql = `
    UPDATE chat_sessions SET
      messages = messages || $2::jsonb,
      last_active_at = NOW()
    WHERE session_id = $1
  `;
  
  await query(sql, [sessionId, JSON.stringify([message])]);
}

// Clear session filters (for new search)
export async function clearSessionFilters(sessionId: string): Promise<void> {
  await ensureDbInitialized();
  
  // First get current session to save previous context
  const session = await getSession(sessionId, false);
  if (!session) return;
  
  let previousContext = null;
  if (Object.keys(session.filters).length > 0) {
    previousContext = {
      domain: session.meta.domain,
      filters: session.filters,
    };
  }
  
  const defaultMeta = {
    domain: 'person',
    isNewSearch: true,
    completenessScore: 0,
    missingFields: [],
    clarificationNeeded: false,
  };
  
  const sql = `
    UPDATE chat_sessions SET
      filters = '{}',
      meta = $2,
      previous_context = $3,
      skip_fields = '[]',
      last_active_at = NOW()
    WHERE session_id = $1
  `;
  
  await query(sql, [
    sessionId,
    JSON.stringify(defaultMeta),
    previousContext ? JSON.stringify(previousContext) : null,
  ]);
}

// Update skip fields
export async function addSkipField(sessionId: string, field: string): Promise<void> {
  await ensureDbInitialized();
  
  // PostgreSQL JSONB append if not exists
  const sql = `
    UPDATE chat_sessions SET
      skip_fields = CASE 
        WHEN NOT skip_fields ? $2 THEN skip_fields || to_jsonb($2::text)
        ELSE skip_fields
      END,
      last_active_at = NOW()
    WHERE session_id = $1
  `;
  
  await query(sql, [sessionId, field]);
}

// Delete old sessions (cleanup)
export async function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  await ensureDbInitialized();
  
  const cutoffTime = new Date(Date.now() - maxAgeMs);
  
  const sql = `
    DELETE FROM chat_sessions 
    WHERE last_active_at < $1
    RETURNING session_id
  `;
  
  const rows = await query(sql, [cutoffTime]);
  return rows.length;
}

// Get all active sessions (for debugging)
export async function getAllSessions(): Promise<SessionData[]> {
  await ensureDbInitialized();
  
  const sql = `SELECT * FROM chat_sessions ORDER BY last_active_at DESC`;
  const rows = await query(sql);
  
  return rows.map(rowToSession);
}

// Get session list with summary (for UI)
export async function getSessionList(): Promise<Array<{
  sessionId: string;
  createdAt: Date;
  lastActiveAt: Date;
  messageCount: number;
  preview: string;
  domain: 'person' | 'company';
}>> {
  await ensureDbInitialized();
  
  const sql = `
    SELECT 
      session_id,
      created_at,
      last_active_at,
      title,
      jsonb_array_length(messages) as message_count,
      meta
    FROM chat_sessions
    ORDER BY last_active_at DESC
  `;
  
  const rows = await query(sql);
  
  return rows.map(row => {
    return {
      sessionId: row.session_id,
      createdAt: new Date(row.created_at),
      lastActiveAt: new Date(row.last_active_at),
      messageCount: row.message_count || 0,
      preview: row.title || 'New conversation',
      domain: row.meta?.domain || 'person',
    };
  });
}

// Delete a specific session
export async function deleteSession(sessionId: string): Promise<boolean> {
  await ensureDbInitialized();
  
  const sql = `DELETE FROM chat_sessions WHERE session_id = $1 RETURNING session_id`;
  const rows = await query(sql, [sessionId]);
  
  return rows.length > 0;
}

// Get session title
export async function getSessionTitle(sessionId: string): Promise<string> {
  const session = await getSession(sessionId, false);
  if (!session) return 'Unknown';
  
  const firstUserMessage = session.messages.find(m => m.role === 'user');
  return firstUserMessage?.content.substring(0, 50) || 'New conversation';
}
