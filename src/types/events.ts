import { SearchFilters, SearchMeta } from './filters';

// SSE Event types
export type SSEEventType = 
  | 'heartbeat'
  | 'progress'
  | 'content'
  | 'filters'
  | 'done'
  | 'error';

// Base SSE event
export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}

// Heartbeat event
export interface HeartbeatEvent extends SSEEvent {
  type: 'heartbeat';
  data: {
    timestamp: number;
  };
}

// Progress event for tracking agent node execution
export interface ProgressEvent extends SSEEvent {
  type: 'progress';
  data: {
    node: string;
    status: 'started' | 'completed';
    message?: string;
  };
}

// Content streaming event
export interface ContentEvent extends SSEEvent {
  type: 'content';
  data: {
    chunk: string;
    isComplete: boolean;
  };
}

// Final filters event
export interface FiltersEvent extends SSEEvent {
  type: 'filters';
  data: {
    filters: SearchFilters;
    meta: SearchMeta;
  };
}

// Completion event
export interface DoneEvent extends SSEEvent {
  type: 'done';
  data: {
    success: boolean;
    sessionId?: string;
  };
}

// Error event
export interface ErrorEvent extends SSEEvent {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

// Type guards
export function isHeartbeatEvent(event: SSEEvent): event is HeartbeatEvent {
  return event.type === 'heartbeat';
}

export function isProgressEvent(event: SSEEvent): event is ProgressEvent {
  return event.type === 'progress';
}

export function isContentEvent(event: SSEEvent): event is ContentEvent {
  return event.type === 'content';
}

export function isFiltersEvent(event: SSEEvent): event is FiltersEvent {
  return event.type === 'filters';
}

export function isDoneEvent(event: SSEEvent): event is DoneEvent {
  return event.type === 'done';
}

export function isErrorEvent(event: SSEEvent): event is ErrorEvent {
  return event.type === 'error';
}
