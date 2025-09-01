/**
 * @fileoverview Event system type definitions for Element-based architecture
 */

/**
 * Core element event interface
 */
export interface ElementEvent {
  /** Target element ID (dynamic UUID) */
  elementId: string;
  /** Element type being targeted */
  elementType: 'markdown' | 'image' | 'mermaid' | 'video' | 'document';
  /** Type of event/operation to perform */
  eventType: ElementEventType;
  /** Event payload data */
  data: ElementEventData;
  /** Event metadata */
  metadata: ElementEventMetadata;
  /** Whether to persist this change to storage */
  persistChange?: boolean;
  /** Whether to trigger transform pipeline */
  triggerTransforms?: boolean;
  /** Whether to validate content before applying */
  validateFirst?: boolean;
}

/**
 * Types of events that can be sent to elements
 */
export type ElementEventType =
  | 'updatePayload' // Change PayloadSource content
  | 'updateProps' // Change element properties
  | 'updateVariants' // Modify available variants
  | 'updateStyle' // Change visual styling
  | 'refreshTransforms' // Regenerate variants
  | 'validateContent'; // Validate element data

/**
 * Event data payload (varies by event type)
 */
export interface ElementEventData {
  /** For updatePayload events */
  payload?: {
    type: 'inline' | 'external';
    mediaType: string;
    source?: string;
    uri?: string;
    [key: string]: unknown;
  };
  /** For updateProps events */
  props?: Record<string, unknown>;
  /** For updateVariants events */
  variants?: ElementVariant[];
  /** For updateStyle events */
  style?: Record<string, unknown>;
  /** For refreshTransforms events */
  transformConfig?: TransformConfig;
  /** Generic data for custom event types */
  [key: string]: unknown;
}

/**
 * Event metadata for tracking and debugging
 */
export interface ElementEventMetadata {
  /** Event timestamp */
  timestamp: number;
  /** Source of the event */
  source: string;
  /** Event priority level */
  priority: 'low' | 'normal' | 'high' | 'immediate';
  /** Correlation ID for tracking related events */
  correlationId?: string;
  /** User ID who triggered the event */
  userId?: string;
  /** Session ID for the event */
  sessionId?: string;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Result of processing an element event
 */
export interface ElementEventResult {
  /** Whether the event was processed successfully */
  success: boolean;
  /** Target element ID */
  elementId: string;
  /** Timestamp when processing completed */
  updatedAt?: number;
  /** Any errors that occurred */
  errors?: string[];
  /** Additional result data */
  data?: Record<string, unknown>;
}

/**
 * Result of processing multiple element events
 */
export interface BatchElementEventResult {
  /** Successfully processed element IDs */
  successful: string[];
  /** Failed events with error details */
  failed: { elementId: string; error: string }[];
  /** Events that were queued for later processing */
  queued: string[];
  /** Overall batch processing metadata */
  metadata?: {
    totalEvents: number;
    processingTime: number;
    [key: string]: unknown;
  };
}

/**
 * Function signature for element update handlers
 */
export interface ElementUpdateFunction {
  (eventType: ElementEventType, data: ElementEventData): Promise<void>;
}

/**
 * Event history entry for debugging and replay
 */
export interface ElementEventHistoryEntry extends ElementEvent {
  /** Guaranteed timestamp for history entries */
  timestamp: number;
  /** Processing result */
  result?: ElementEventResult;
}

/**
 * Event subscriber callback function
 */
export interface ElementEventSubscriber {
  (event: ElementEvent): void;
}

/**
 * Event callback for single events
 */
export interface ElementEventCallback {
  (event: ElementEvent): void | Promise<void>;
}

/**
 * Event callback for batch events
 */
export interface BatchElementEventCallback {
  (events: ElementEvent[]): void | Promise<void>;
}

/**
 * Unsubscribe function returned by event subscriptions
 */
export interface UnsubscribeFunction {
  (): void;
}

/**
 * Element variant definition for updateVariants events
 */
export interface ElementVariant {
  /** Variant identifier */
  id: string;
  /** Variant name/label */
  name: string;
  /** Variant payload source */
  payloadSource: {
    type: 'inline' | 'external';
    mediaType: string;
    source?: string;
    uri?: string;
    [key: string]: unknown;
  };
  /** Variant metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transform configuration for refreshTransforms events
 */
export interface TransformConfig {
  /** Transform type/pipeline to run */
  type: string;
  /** Transform parameters */
  params?: Record<string, unknown>;
  /** Target output formats */
  outputFormats?: string[];
}

/**
 * Event queue configuration options
 */
export interface EventQueueOptions {
  /** Maximum number of events to queue */
  maxQueueSize: number;
  /** How often to flush the queue (milliseconds) */
  flushInterval: number;
  /** Priority levels for event ordering */
  priorityLevels: string[];
  /** Whether to deduplicate similar events */
  deduplicateEvents: boolean;
}

/**
 * Event manager configuration options
 */
export interface EventManagerOptions {
  /** Event queue configuration */
  queueOptions?: EventQueueOptions;
  /** Maximum event history size */
  maxHistorySize?: number;
  /** Whether to enable event persistence */
  enablePersistence?: boolean;
  /** Custom event validation function */
  validateEvent?: (event: ElementEvent) => Promise<{ isValid: boolean; errors?: string[] }>;
}

/**
 * Default event queue configuration
 */
export const DEFAULT_EVENT_QUEUE_OPTIONS: EventQueueOptions = {
  maxQueueSize: 1000,
  flushInterval: 16, // ~60fps for smooth updates
  priorityLevels: ['low', 'normal', 'high', 'immediate'],
  deduplicateEvents: true,
};

/**
 * Default event manager configuration
 */
export const DEFAULT_EVENT_MANAGER_OPTIONS: EventManagerOptions = {
  queueOptions: DEFAULT_EVENT_QUEUE_OPTIONS,
  maxHistorySize: 1000,
  enablePersistence: false,
};
