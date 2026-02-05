'use client';

import { useState, useEffect } from 'react';

interface SessionItem {
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
  preview: string;
  domain: 'person' | 'company';
}

interface SessionSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string, refreshSessions?: () => void) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function SessionSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  onToggle,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  // Refresh sessions when current session changes
  useEffect(() => {
    if (currentSessionId && isOpen) {
      fetchSessions();
    }
  }, [currentSessionId]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
      setDeleteConfirm(null);
      
      // If deleted current session, create new one
      if (sessionId === currentSessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Group sessions by time
  const groupSessions = () => {
    const now = new Date();
    const today: SessionItem[] = [];
    const yesterday: SessionItem[] = [];
    const week: SessionItem[] = [];
    const older: SessionItem[] = [];

    sessions.forEach(session => {
      const date = new Date(session.lastActiveAt);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      
      if (diffDays === 0) today.push(session);
      else if (diffDays === 1) yesterday.push(session);
      else if (diffDays < 7) week.push(session);
      else older.push(session);
    });

    return { today, yesterday, week, older };
  };

  const grouped = groupSessions();

  const renderSessionItem = (session: SessionItem) => (
    <div
      key={session.sessionId}
      onClick={() => onSelectSession(session.sessionId, fetchSessions)}
      onMouseEnter={() => setHoveredSession(session.sessionId)}
      onMouseLeave={() => setHoveredSession(null)}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        session.sessionId === currentSessionId
          ? 'bg-gray-700/70'
          : 'hover:bg-gray-700/50'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {session.domain === 'person' ? (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span className="flex-1 text-sm text-gray-200 truncate pr-8">
        {session.preview}
      </span>

      {/* Actions - show on hover */}
      {(hoveredSession === session.sessionId || session.sessionId === currentSessionId) && (
        <div className="absolute right-2 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(session.sessionId);
            }}
            className="p-1.5 hover:bg-gray-600 rounded-md transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  const renderGroup = (title: string, items: SessionItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-0.5">
          {items.map(renderSessionItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 flex flex-col transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className={`flex flex-col h-full ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          {/* Header with New Chat and Toggle */}
          <div className="flex-shrink-0 p-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onNewSession}
                className="flex-1 flex items-center gap-3 px-3 py-3 text-sm text-gray-200 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New chat</span>
              </button>
              {/* Toggle Button inside header */}
              <button
                onClick={onToggle}
                className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all border border-gray-700"
                title="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-gray-300"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-gray-500">No history yet</p>
              </div>
            ) : (
              <>
                {renderGroup('Today', grouped.today)}
                {renderGroup('Yesterday', grouped.yesterday)}
                {renderGroup('Previous 7 Days', grouped.week)}
                {renderGroup('Older', grouped.older)}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-2 border-t border-gray-700/50">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-300">User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-50 p-2.5 bg-white text-gray-600 hover:bg-gray-100 rounded-lg transition-all shadow-md border border-gray-200"
          title="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Delete conversation?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will delete the conversation and all its messages. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
