import { NextRequest } from 'next/server';
import { runAgentWithStreaming } from '@/agent';
import { 
  getSession, 
  createSession, 
  saveSession,
  addMessageToSession,
} from '@/agent/checkpointer-db';
import { createSSEStream, SSE_HEADERS } from '@/lib/stream';
import { SearchFilters, SearchMeta } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * Handle chat messages and return streaming response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: requestSessionId } = body;
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get or create session
    let session = requestSessionId ? await getSession(requestSessionId) : null;
    if (!session) {
      session = await createSession();
    }
    
    // Add user message to session
    await addMessageToSession(session.sessionId, 'user', message.trim());
    
    // Prepare previous state for agent
    const previousState = {
      currentFilters: session.filters,
      meta: session.meta,
      previousContext: session.previousContext,
      skipFields: session.skipFields,
    };
    
    // Create SSE stream from agent
    const eventGenerator = runAgentWithStreaming(
      session.sessionId,
      message.trim(),
      previousState
    );
    
    // Store session reference for closure
    const currentSession = session;
    
    // Wrap generator to save session on completion
    async function* wrappedGenerator() {
      let responseContent = '';
      
      for await (const event of eventGenerator) {
        // Capture response content
        if (event.type === 'content' && event.data) {
          responseContent += (event.data as { chunk: string }).chunk || '';
        }
        
        // Update session on filters event
        if (event.type === 'filters' && event.data) {
          const filtersData = event.data as { filters: SearchFilters; meta: SearchMeta };
          currentSession.filters = filtersData.filters;
          currentSession.meta = filtersData.meta;
          await saveSession(currentSession);
        }
        
        yield event;
      }
      
      // Save assistant response to session
      if (responseContent) {
        await addMessageToSession(currentSession.sessionId, 'assistant', responseContent);
      }
    }
    
    const stream = createSSEStream(wrappedGenerator());
    
    return new Response(stream, {
      headers: {
        ...SSE_HEADERS,
        'X-Session-Id': session.sessionId,
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: (error as Error).message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /api/chat?sessionId=xxx
 * Get session state
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        sessionId: session.sessionId,
        filters: session.filters,
        meta: session.meta,
        messages: session.messages,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Get session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
