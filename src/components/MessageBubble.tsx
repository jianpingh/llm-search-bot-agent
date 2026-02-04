'use client';

import { SearchFilters, SearchMeta } from '@/types';
import FilterDisplay from './FilterDisplay';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filters?: SearchFilters;
  meta?: SearchMeta;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>
        
        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
          }`}
        >
          {/* Text content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.isStreaming && !message.content && (
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
            {message.isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />
            )}
          </div>
          
          {/* Filters are displayed in the fixed bottom panel, not in each message */}
        </div>
      </div>
    </div>
  );
}
