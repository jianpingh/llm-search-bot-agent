import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/agent/checkpointer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions/[sessionId]
 * Get a specific session with all messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        messages: session.messages,
        filters: session.filters,
        meta: session.meta,
      },
    });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]
 * Delete a specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const deleted = deleteSession(sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
