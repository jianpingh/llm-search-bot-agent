import { SSEEvent } from '@/types';

/**
 * Parse Server-Sent Events from a streaming response
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const event = parseSSEData(buffer);
          if (event) yield event;
        }
        break;
      }
      
      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (SSE event separator)
      const parts = buffer.split('\n\n');
      
      // Keep the last part in buffer (might be incomplete)
      buffer = parts.pop() || '';
      
      // Process complete events
      for (const part of parts) {
        const event = parseSSEData(part);
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse a single SSE data line
 */
function parseSSEData(data: string): SSEEvent | null {
  const lines = data.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.slice(6); // Remove 'data: ' prefix
        return JSON.parse(jsonStr) as SSEEvent;
      } catch (e) {
        console.error('Failed to parse SSE data:', e, line);
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Create an SSE event string
 */
export function createSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create a ReadableStream for SSE
 */
export function createSSEStream(
  generator: AsyncGenerator<SSEEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          const sseData = createSSEEvent(event);
          controller.enqueue(encoder.encode(sseData));
        }
        controller.close();
      } catch (error) {
        console.error('SSE stream error:', error);
        const errorEvent: SSEEvent = {
          type: 'error',
          data: { message: (error as Error).message },
          timestamp: Date.now(),
        };
        controller.enqueue(encoder.encode(createSSEEvent(errorEvent)));
        controller.close();
      }
    },
  });
}

/**
 * SSE Response headers
 */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable nginx buffering
};
