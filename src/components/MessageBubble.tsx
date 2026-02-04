'use client';

import { SearchFilters, SearchMeta } from '@/types';
import FilterDisplay from './FilterDisplay';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

// Preprocess content to fix common markdown issues
function preprocessMarkdown(content: string): string {
  let processed = content;
  
  // Convert bullet points: • · to - (handle various bullet characters)
  processed = processed.replace(/^[\s]*[•·●○◦▪▫]\s*/gm, '- ');
  processed = processed.replace(/\n[\s]*[•·●○◦▪▫]\s*/g, '\n- ');
  
  // Ensure list items have proper spacing after dash
  processed = processed.replace(/^-([^\s-])/gm, '- $1');
  processed = processed.replace(/\n-([^\s-])/g, '\n- $1');
  
  // Ensure blank line before lists for proper parsing
  processed = processed.replace(/([^\n])\n(- )/g, '$1\n\n$2');
  
  // Fix bold text that might have issues - ensure **text** format is correct
  // Remove any zero-width spaces or special characters between ** markers
  processed = processed.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
    return `**${text.trim()}**`;
  });
  
  return processed;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const processedContent = isUser ? message.content : preprocessMarkdown(message.content);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>
        
        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gray-800 text-white rounded-tr-sm'
              : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-sm'
          }`}
        >
          {/* Text content with Markdown rendering */}
          <div className="break-words">
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom styling for markdown elements
                    h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>,
                    strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-outside ml-5 my-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside ml-5 my-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            )}
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
