/**
 * @fileoverview Transport layer interface definitions for event communication
 */

import type { ElementEvent, ElementEventResult, BatchElementEventResult } from '../types/events';

/**
 * Transport connection states
 */
export type TransportConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

/**
 * Transport message types
 */
export type TransportMessageType =
  | 'event'           // Single element event
  | 'batch_event'     // Batch of element events
  | 'subscription'    // Event subscription request
  | 'unsubscription'  // Event unsubscription request
  | 'ping'           // Connection health check
  | 'pong'           // Ping response
  | 'error'          // Error message
  | 'ack';           // Acknowledgment

/**
 * Transport message structure
 */
export interface TransportMessage {
  /** Message type */
  type: TransportMessageType;
  /** Message ID for correlation */
  id: string;
  /** Message timestamp */
  timestamp: number;
  /** Message payload */
  payload: unknown;
  /** Optional correlation ID for request/response */
  correlationId?: string;
  /** Message metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transport event message payload
 */
export interface TransportEventPayload {
  event: ElementEvent;
}

/**
 * Transport batch event message payload
 */
export interface TransportBatchEventPayload {
  events: ElementEvent[];
}

/**
 * Transport subscription message payload
 */
export interface TransportSubscriptionPayload {
  /** Element ID to subscribe to (or '*' for all) */
  elementId: string;
  /** Event types to subscribe to (or '*' for all) */
  eventTypes: string[];
  /** Subscription options */
  options?: {
    includeHistory?: boolean;
    maxHistorySize?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

/**
 * Transport error message payload
 */
export interface TransportErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Transport connection options
 */
export interface TransportConnectionOptions {
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
  /** Authentication options */
  auth?: {
    token?: string;
    apiKey?: string;
    credentials?: Record<string, unknown>;
  };
  /** Custom headers */
  headers?: Record<string, string>;
  /** Connection metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transport event handler
 */
export interface TransportEventHandler {
  (event: ElementEvent): void | Promise<void>;
}

/**
 * Transport batch event handler
 */
export interface TransportBatchEventHandler {
  (events: ElementEvent[]): void | Promise<void>;
}

/**
 * Transport connection state handler
 */
export interface TransportConnectionStateHandler {
  (state: TransportConnectionState, error?: Error): void;
}

/**
 * Transport error handler
 */
export interface TransportErrorHandler {
  (error: Error, context?: Record<string, unknown>): void;
}

/**
 * Transport unsubscribe function
 */
export interface TransportUnsubscribeFunction {
  (): void;
}

/**
 * Base transport interface
 */
export interface Transport {
  /** Transport name/type */
  readonly name: string;
  
  /** Current connection state */
  readonly connectionState: TransportConnectionState;
  
  /** Whether the transport is connected */
  readonly isConnected: boolean;

  /**
   * Connect to the transport
   */
  connect(options?: TransportConnectionOptions): Promise<void>;

  /**
   * Disconnect from the transport
   */
  disconnect(): Promise<void>;

  /**
   * Send a single event
   */
  sendEvent(event: ElementEvent): Promise<ElementEventResult>;

  /**
   * Send multiple events as a batch
   */
  sendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult>;

  /**
   * Subscribe to events for a specific element
   */
  subscribeToElement(
    elementId: string,
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction>;

  /**
   * Subscribe to all events
   */
  subscribeToAll(
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction>;

  /**
   * Subscribe to batch events
   */
  subscribeToBatch(
    handler: TransportBatchEventHandler,
    options?: { batchSize?: number; flushInterval?: number }
  ): Promise<TransportUnsubscribeFunction>;

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: TransportConnectionStateHandler): TransportUnsubscribeFunction;

  /**
   * Subscribe to transport errors
   */
  onError(handler: TransportErrorHandler): TransportUnsubscribeFunction;

  /**
   * Get transport statistics
   */
  getStats(): TransportStats;

  /**
   * Destroy the transport and clean up resources
   */
  destroy(): Promise<void>;
}

/**
 * Transport statistics
 */
export interface TransportStats {
  /** Connection uptime in milliseconds */
  uptime: number;
  /** Number of events sent */
  eventsSent: number;
  /** Number of events received */
  eventsReceived: number;
  /** Number of batch events sent */
  batchEventsSent: number;
  /** Number of batch events received */
  batchEventsReceived: number;
  /** Number of connection errors */
  connectionErrors: number;
  /** Number of message errors */
  messageErrors: number;
  /** Average message latency in milliseconds */
  averageLatency: number;
  /** Current number of active subscriptions */
  activeSubscriptions: number;
  /** Transport-specific statistics */
  transportSpecific?: Record<string, unknown>;
}

/**
 * Transport factory interface
 */
export interface TransportFactory {
  /** Factory name */
  readonly name: string;
  
  /** Supported transport protocols */
  readonly supportedProtocols: string[];

  /**
   * Create a transport instance
   */
  create(url: string, options?: TransportConnectionOptions): Transport;

  /**
   * Check if a URL is supported by this factory
   */
  supports(url: string): boolean;
}

/**
 * Transport registry for managing multiple transport types
 */
export interface TransportRegistry {
  /**
   * Register a transport factory
   */
  register(factory: TransportFactory): void;

  /**
   * Unregister a transport factory
   */
  unregister(name: string): boolean;

  /**
   * Create a transport for a given URL
   */
  create(url: string, options?: TransportConnectionOptions): Transport | null;

  /**
   * Get all registered factory names
   */
  getRegisteredFactories(): string[];

  /**
   * Check if a URL is supported by any registered factory
   */
  supports(url: string): boolean;
}

/**
 * Default transport connection options
 */
export const DEFAULT_TRANSPORT_OPTIONS: Required<TransportConnectionOptions> = {
  timeout: 30000, // 30 seconds
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000
  },
  auth: {},
  headers: {},
  metadata: {}
};

/**
 * Transport message priorities
 */
export const TRANSPORT_MESSAGE_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  IMMEDIATE: 'immediate'
} as const;

/**
 * Transport protocol schemes
 */
export const TRANSPORT_PROTOCOLS = {
  WEBSOCKET: 'ws',
  WEBSOCKET_SECURE: 'wss',
  HTTP: 'http',
  HTTPS: 'https',
  GRAPHQL: 'graphql',
  GRAPHQL_WS: 'graphql-ws',
  MCP: 'mcp'
} as const;
