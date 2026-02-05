'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { parseSSEStream } from '@/lib/stream';
import { SearchFilters, SearchMeta, SSEEvent } from '@/types';
import MessageBubble from './MessageBubble';
import FilterDisplay from './FilterDisplay';
import SessionSidebar from './SessionSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filters?: SearchFilters;
  meta?: SearchMeta;
  isStreaming?: boolean;
}

interface ProgressItem {
  node: string;
  status: 'started' | 'completed';
  message?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  const [currentMeta, setCurrentMeta] = useState<SearchMeta | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Focus input after loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
    };
    
    // Add user message and create placeholder for assistant
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      },
    ]);
    
    setInput('');
    setIsLoading(true);
    setProgress([]);
    
    try {
      // Send request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          sessionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      // Get session ID from header
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId) {
        setSessionId(newSessionId);
      }
      
      // Process SSE stream
      let fullContent = '';
      
      for await (const event of parseSSEStream(response)) {
        switch (event.type) {
          case 'heartbeat':
            // Heartbeat received, connection is alive
            break;
            
          case 'progress':
            const progressData = event.data as ProgressItem;
            setProgress(prev => {
              // Update or add progress item
              const existing = prev.findIndex(p => p.node === progressData.node);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = progressData;
                return updated;
              }
              return [...prev, progressData];
            });
            break;
            
          case 'content':
            const contentData = event.data as { chunk: string; isComplete: boolean };
            fullContent += contentData.chunk;
            setMessages(prev => 
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
            break;
            
          case 'filters':
            const filtersData = event.data as { filters: SearchFilters; meta: SearchMeta };
            setCurrentFilters(filtersData.filters);
            setCurrentMeta(filtersData.meta);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      filters: filtersData.filters,
                      meta: filtersData.meta,
                    }
                  : msg
              )
            );
            break;
            
          case 'done':
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            break;
            
          case 'error':
            const errorData = event.data as { message: string };
            console.error('Stream error:', errorData.message);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: `Sorry, an error occurred: ${errorData.message}`,
                      isStreaming: false,
                    }
                  : msg
              )
            );
            break;
        }
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, something went wrong. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setProgress([]);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Clear conversation
  const handleClear = () => {
    setMessages([]);
    setSessionId(null);
    setCurrentFilters(null);
    setCurrentMeta(null);
    setProgress([]);
  };

  // Start a new session
  const handleNewSession = () => {
    handleClear();
  };

  // Load a previous session
  const handleSelectSession = async (selectedSessionId: string, refreshSessions?: () => void) => {
    if (selectedSessionId === sessionId) {
      return;
    }

    setLoadingSession(true);
    try {
      const response = await fetch(`/api/sessions/${selectedSessionId}`);
      const data = await response.json();

      if (data.success && data.session) {
        // Convert session messages to our Message format
        const loadedMessages: Message[] = data.session.messages.map((msg: { role: string; content: string }, index: number) => ({
          id: `${msg.role}-${index}-${Date.now()}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          isStreaming: false,
        }));

        setMessages(loadedMessages);
        setSessionId(selectedSessionId);
        setCurrentFilters(null);
        setCurrentMeta(null);
      } else if (data.error === 'Session not found') {
        // Session was lost (e.g., server restart), refresh the session list
        console.warn('Session not found, refreshing session list...');
        if (refreshSessions) {
          refreshSessions();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoadingSession(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-white">
      {/* Session Sidebar */}
      <SessionSidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content - shifts when sidebar is open */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Header - simplified */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between w-full max-w-3xl px-4 py-3 mx-auto">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? 'ml-10' : ''}`}>
              <span className="text-2xl">🔍</span>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">LLM Search Bot Agent</h1>
                {sessionId && (
                  <p className="text-xs text-gray-400">
                    Session: {sessionId}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100"
            >
              New Chat
            </button>
          </div>
        </header>

        {/* Loading Session Overlay */}
        {loadingSession && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-gray-300 rounded-full border-3 border-t-gray-600 animate-spin"></div>
              <p className="text-gray-600">Loading conversation...</p>
            </div>
          </div>
        )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl px-4 py-6 mx-auto">
          {messages.length === 0 && (
            <div className="mt-16 space-y-6 text-center text-gray-500">
              <div className="text-6xl">👋</div>
              <div>
                <h2 className="mb-2 text-2xl font-semibold text-gray-800">Hi! I can help you search for people and companies.</h2>
                <p className="text-gray-500">Try these examples:</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[
                  'Find CTOs in Singapore',
                  'Find AI startups',
                  'Find senior engineers at tech companies',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(example)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreamingAssistant = message.role === 'assistant' && message.isStreaming;
              
              return (
                <div key={message.id}>
                  {/* Show progress indicators BEFORE the streaming assistant message */}
                  {isLastMessage && isStreamingAssistant && isLoading && progress.length > 0 && (
                    <div className="flex justify-start mb-4">
                      <div className="flex gap-3 max-w-[85%]">
                        {/* Avatar - same style as MessageBubble */}
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full">
                          <span className="animate-spin">⚙️</span>
                        </div>
                        {/* Progress content */}
                        <div className="px-4 py-3 border border-gray-100 rounded-tl-sm bg-gray-50 rounded-2xl">
                          <div className="space-y-1 text-sm text-gray-600">
                            {progress.map((p, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {p.status === 'started' ? (
                                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                ) : (
                                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                                )}
                                <span>{p.message || p.node}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <MessageBubble message={message} />
                </div>
              );
            })}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input - ChatGPT style */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl px-4 py-4 mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your search query... (e.g., 'Find CTOs in Singapore')"
                className="w-full px-4 py-3 pr-24 border border-gray-300 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-gray-900 rounded-lg right-2 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="mt-3 text-xs text-center text-gray-400">
            Search for people by job title, company, location, or industry
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
