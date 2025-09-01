/**
 * @fileoverview Test helper factories for creating test data
 */

import type { Element, PayloadSource, ElementContent } from '../../src/types/core';
import type { ElementEvent, EventQueueOptions, EventManagerOptions } from '../../src/types/events';

/**
 * Create a test PayloadSource
 */
export function createTestPayloadSource(overrides: Partial<PayloadSource> = {}): PayloadSource {
  return {
    type: 'inline',
    mediaType: 'text/plain',
    source: 'Test content',
    ...overrides
  };
}

/**
 * Create test ElementContent
 */
export function createTestElementContent(overrides: Partial<ElementContent> = {}): ElementContent {
  return {
    primary: createTestPayloadSource(),
    ...overrides
  };
}

/**
 * Create a test Element
 */
export function createTestElement(overrides: Partial<Element> = {}): Element {
  return {
    id: 'test-element',
    kind: 'markdown',
    content: createTestElementContent(),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    ...overrides
  };
}

/**
 * Create a test ElementEvent
 */
export function createTestElementEvent(overrides: Partial<ElementEvent> = {}): ElementEvent {
  return {
    elementId: 'test-element',
    elementType: 'markdown',
    eventType: 'updatePayload',
    data: {},
    metadata: {
      timestamp: Date.now(),
      source: 'api',
      priority: 'normal'
    },
    ...overrides
  };
}

/**
 * Create a test ElementEvent with proper payload
 */
export function createTestElementEventWithPayload(source: string = 'Test content', overrides: Partial<ElementEvent> = {}): ElementEvent {
  return createTestElementEvent({
    data: {
      payload: {
        type: 'inline',
        mediaType: 'text/plain',
        source
      }
    },
    ...overrides
  });
}

/**
 * Create test EventQueueOptions
 */
export function createTestEventQueueOptions(overrides: Partial<EventQueueOptions> = {}): EventQueueOptions {
  return {
    maxQueueSize: 1000,
    flushInterval: 16,
    priorityLevels: ['immediate', 'high', 'normal', 'low'],
    deduplicateEvents: true,
    ...overrides
  };
}

/**
 * Create test EventManagerOptions
 */
export function createTestEventManagerOptions(overrides: Partial<EventManagerOptions> = {}): EventManagerOptions {
  return {
    queueOptions: createTestEventQueueOptions(),
    maxHistorySize: 1000,
    ...overrides
  };
}
