import { NextRequest, NextResponse } from 'next/server';
import { 
  getSessionList, 
  getSession, 
  deleteSession,
  createSession 
} from '@/agent/checkpointer-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions
 * Get list of all sessions
 */
export async function GET(request: NextRequest) {
  try {
    const sessions = await getSessionList();
    
    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length,
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await createSession();
    
    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      session: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        messageCount: 0,
        preview: 'New conversation',
        domain: session.meta.domain,
      },
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
