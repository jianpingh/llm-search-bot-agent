'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { parseSSEStream } from '@/lib/stream';
import { SearchFilters, SearchMeta, SSEEvent } from '@/types';
import MessageBubble from './MessageBubble';
import FilterDisplay from './FilterDisplay';

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
  
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              🔍 LLM Search Bot
            </h1>
            {sessionId && (
              <p className="text-xs opacity-75 mt-1">
                Session: {sessionId.slice(0, 20)}...
              </p>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8 space-y-4">
            <div className="text-5xl">👋</div>
            <p className="text-lg font-medium">Hi! I can help you search for people and companies.</p>
            <div className="text-sm space-y-2">
              <p>Try these examples:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Find CTOs in Singapore',
                  'Find AI startups',
                  'Find senior engineers at tech companies',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(example)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {/* Progress indicators */}
        {isLoading && progress.length > 0 && (
          <div className="flex items-start gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 animate-spin">⚙️</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1 pt-2">
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
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Current Filters Summary */}
      {currentFilters && Object.keys(currentFilters).length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <FilterDisplay 
            filters={currentFilters} 
            meta={currentMeta || undefined}
            compact 
          />
        </div>
      )}
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your search query... (e.g., 'Find CTOs in Singapore')"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
