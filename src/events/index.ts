/**
 * @fileoverview Event system exports for Element-based architecture
 */

// Core event system
export { EventQueue } from './event-queue';
export { EventManager } from './event-manager';
export { ElementLifecycleManager } from './element-lifecycle';

// Import for internal use
import { EventManager } from './event-manager';
import { ElementLifecycleManager } from './element-lifecycle';

// Event system types
export type {
  ElementEvent,
  ElementEventType,
  ElementEventData,
  ElementEventMetadata,
  ElementEventResult,
  BatchElementEventResult,
  ElementEventHistoryEntry,
  ElementEventSubscriber,
  ElementEventCallback,
  BatchElementEventCallback,
  UnsubscribeFunction,
  EventQueueOptions,
  EventManagerOptions,
} from '../types/events';

// Lifecycle types
export type {
  ElementLifecycleState,
  ElementLifecycleEventType,
  ElementLifecycleEvent,
  ElementLifecycleCallback,
  ElementUpdateOptions,
} from './element-lifecycle';

// Default configurations
export { DEFAULT_EVENT_QUEUE_OPTIONS, DEFAULT_EVENT_MANAGER_OPTIONS } from '../types/events';

/**
 * Create a new event manager with default configuration
 */
export function createEventManager(
  options?: Partial<import('../types/events').EventManagerOptions>
) {
  return new EventManager(options);
}

/**
 * Create a new element lifecycle manager
 */
export function createElementLifecycleManager(eventManager: EventManager) {
  return new ElementLifecycleManager(eventManager);
}

/**
 * Create a complete event system with manager and lifecycle
 */
export function createEventSystem(
  options?: Partial<import('../types/events').EventManagerOptions>
) {
  const eventManager = createEventManager(options);
  const lifecycleManager = createElementLifecycleManager(eventManager);

  return {
    eventManager,
    lifecycleManager,
  };
}
