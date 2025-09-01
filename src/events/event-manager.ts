/**
 * @fileoverview Central event manager for element lifecycle and updates
 */

import type {
  ElementEvent,
  ElementEventResult,
  BatchElementEventResult,
  ElementEventHistoryEntry,
  ElementEventSubscriber,
  ElementEventCallback,
  BatchElementEventCallback,
  UnsubscribeFunction,
  EventManagerOptions,
} from '../types/events';
import { DEFAULT_EVENT_MANAGER_OPTIONS } from '../types/events';
import type { Element } from '../types/core';
import { EventQueue } from './event-queue';

/**
 * Central manager for element events and lifecycle
 */
export class EventManager {
  private readonly options: EventManagerOptions;
  private readonly eventQueue: EventQueue;
  private readonly eventHistory: ElementEventHistoryEntry[] = [];
  private readonly subscribers = new Map<string, Set<ElementEventSubscriber>>();
  private readonly elements = new Map<string, Element>();
  private readonly eventCallbacks = new Set<ElementEventCallback>();
  private readonly batchEventCallbacks = new Set<BatchElementEventCallback>();
  private isDestroyed = false;

  constructor(options: Partial<EventManagerOptions> = {}) {
    this.options = { ...DEFAULT_EVENT_MANAGER_OPTIONS, ...options };
    this.eventQueue = new EventQueue(this.options.queueOptions);

    // Start the event processing loop
    this.startEventProcessing();
  }

  /**
   * Register an element for event processing
   */
  registerElement(element: Element): void {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    this.elements.set(element.id, element);

    // Emit registration event
    this.emitEvent({
      elementId: element.id,
      elementType: element.kind,
      eventType: 'updateProps',
      data: { registered: true },
      metadata: {
        timestamp: Date.now(),
        source: 'system',
        priority: 'normal',
      },
    });
  }

  /**
   * Unregister an element
   */
  unregisterElement(elementId: string): boolean {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    const element = this.elements.get(elementId);
    if (!element) {
      return false;
    }

    this.elements.delete(elementId);

    // Clean up subscribers for this element
    this.subscribers.delete(elementId);

    // Emit unregistration event
    this.emitEvent({
      elementId,
      elementType: element.kind,
      eventType: 'updateProps',
      data: { registered: false },
      metadata: {
        timestamp: Date.now(),
        source: 'system',
        priority: 'normal',
      },
    });

    return true;
  }

  /**
   * Send an event to an element
   */
  async sendEvent(event: ElementEvent): Promise<ElementEventResult> {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    // Validate event if validator is provided
    if (this.options.validateEvent) {
      const validation = await this.options.validateEvent(event);
      if (!validation.isValid) {
        return {
          success: false,
          elementId: event.elementId,
          errors: validation.errors || ['Event validation failed'],
        };
      }
    }

    // Check if element exists
    const element = this.elements.get(event.elementId);
    if (!element) {
      return {
        success: false,
        elementId: event.elementId,
        errors: [`Element ${event.elementId} not found`],
      };
    }

    // Add to queue for processing
    const queued = this.eventQueue.enqueue(event);

    if (!queued) {
      return {
        success: false,
        elementId: event.elementId,
        errors: ['Failed to queue event - queue may be full'],
      };
    }

    // For immediate priority events, force flush
    if (event.metadata.priority === 'immediate') {
      this.eventQueue.forceFlush();
    }

    return {
      success: true,
      elementId: event.elementId,
      updatedAt: Date.now(),
    };
  }

  /**
   * Send multiple events as a batch
   */
  async sendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult> {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    const results: ElementEventResult[] = [];

    for (const event of events) {
      const result = await this.sendEvent(event);
      results.push(result);
    }

    const successful = results.filter((r) => r.success).map((r) => r.elementId);
    const failed = results
      .filter((r) => !r.success)
      .map((r) => ({
        elementId: r.elementId,
        error: r.errors?.[0] || 'Unknown error',
      }));

    return {
      successful,
      failed,
      queued: successful, // All successful events are queued
      metadata: {
        totalEvents: events.length,
        processingTime: 0, // Will be updated during actual processing
      },
    };
  }

  /**
   * Subscribe to events for a specific element
   */
  subscribe(elementId: string, callback: ElementEventSubscriber): UnsubscribeFunction {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    let subscribers = this.subscribers.get(elementId);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(elementId, subscribers);
    }

    subscribers.add(callback);

    return () => {
      const subs = this.subscribers.get(elementId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(elementId);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(callback: ElementEventCallback): UnsubscribeFunction {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    this.eventCallbacks.add(callback);

    return () => {
      this.eventCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to batch events
   */
  subscribeToBatch(callback: BatchElementEventCallback): UnsubscribeFunction {
    if (this.isDestroyed) {
      throw new Error('EventManager has been destroyed');
    }

    this.batchEventCallbacks.add(callback);

    return () => {
      this.batchEventCallbacks.delete(callback);
    };
  }

  /**
   * Get event history for an element
   */
  getEventHistory(elementId?: string): ElementEventHistoryEntry[] {
    if (elementId) {
      return this.eventHistory.filter((entry) => entry.elementId === elementId);
    }
    return [...this.eventHistory];
  }

  /**
   * Get registered elements
   */
  getRegisteredElements(): Element[] {
    return Array.from(this.elements.values());
  }

  /**
   * Get element by ID
   */
  getElement(elementId: string): Element | undefined {
    return this.elements.get(elementId);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { totalQueued: number; queueSizes: Record<string, number> } {
    return {
      totalQueued: this.eventQueue.getTotalQueueSize(),
      queueSizes: this.eventQueue.getQueueSizes(),
    };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Destroy the event manager and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.eventQueue.destroy();
    this.subscribers.clear();
    this.elements.clear();
    this.eventCallbacks.clear();
    this.batchEventCallbacks.clear();
    this.eventHistory.length = 0;
  }

  /**
   * Start the event processing loop
   */
  private startEventProcessing(): void {
    const processEvents = async () => {
      if (this.isDestroyed) {
        return;
      }

      try {
        const result = await this.eventQueue.flush(this.processBatchEvents.bind(this));

        // Notify batch subscribers
        if (result.metadata && result.metadata.totalEvents > 0) {
          for (const callback of this.batchEventCallbacks) {
            try {
              await callback([]); // Events are already processed
            } catch (error) {
              console.error('Error in batch event callback:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error processing events:', error);
      }

      // Schedule next processing cycle
      if (!this.isDestroyed) {
        setTimeout(processEvents, this.options.queueOptions?.flushInterval || 16);
      }
    };

    // Start the processing loop
    setTimeout(processEvents, this.options.queueOptions?.flushInterval || 16);
  }

  /**
   * Process a batch of events
   */
  private async processBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult> {
    const successful: string[] = [];
    const failed: { elementId: string; error: string }[] = [];

    for (const event of events) {
      try {
        const result = await this.processEvent(event);
        if (result.success) {
          successful.push(result.elementId);
        } else {
          failed.push({
            elementId: result.elementId,
            error: result.errors?.[0] || 'Unknown error',
          });
        }
      } catch (error) {
        failed.push({
          elementId: event.elementId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      queued: [],
      metadata: {
        totalEvents: events.length,
        processingTime: 0,
      },
    };
  }

  /**
   * Process a single event
   */
  private async processEvent(event: ElementEvent): Promise<ElementEventResult> {
    const element = this.elements.get(event.elementId);
    if (!element) {
      return {
        success: false,
        elementId: event.elementId,
        errors: [`Element ${event.elementId} not found`],
      };
    }

    // Add to history
    const historyEntry: ElementEventHistoryEntry = {
      ...event,
      timestamp: Date.now(),
    };

    // Process the event based on type
    let result: ElementEventResult;
    try {
      result = await this.executeEvent(element, event);
      historyEntry.result = result;
    } catch (error) {
      result = {
        success: false,
        elementId: event.elementId,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
      historyEntry.result = result;
    }

    // Add to history (with size limit)
    this.eventHistory.push(historyEntry);
    if (this.options.maxHistorySize && this.eventHistory.length > this.options.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify subscribers
    this.notifySubscribers(event);

    return result;
  }

  /**
   * Execute an event on an element
   */
  private async executeEvent(element: Element, event: ElementEvent): Promise<ElementEventResult> {
    // This is where the actual element update logic would go
    // For now, we'll simulate the update

    switch (event.eventType) {
      case 'updatePayload':
        if (event.data.payload) {
          // Update element content
          // In a real implementation, this would update the element's content
        }
        break;

      case 'updateProps':
        if (event.data.props) {
          // Update element properties
          Object.assign(element.metadata || {}, event.data.props);
        }
        break;

      case 'updateVariants':
        // Update element variants
        break;

      case 'updateStyle':
        // Update element styling
        break;

      case 'refreshTransforms':
        // Refresh element transforms
        break;

      case 'validateContent':
        // Validate element content
        break;

      default:
        return {
          success: false,
          elementId: event.elementId,
          errors: [`Unknown event type: ${event.eventType}`],
        };
    }

    return {
      success: true,
      elementId: event.elementId,
      updatedAt: Date.now(),
    };
  }

  /**
   * Notify subscribers of an event
   */
  private notifySubscribers(event: ElementEvent): void {
    // Notify element-specific subscribers
    const elementSubscribers = this.subscribers.get(event.elementId);
    if (elementSubscribers) {
      for (const callback of elementSubscribers) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event subscriber:', error);
        }
      }
    }

    // Notify global subscribers
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in global event callback:', error);
      }
    }
  }

  /**
   * Emit an event (internal use)
   */
  private emitEvent(event: ElementEvent): void {
    this.notifySubscribers(event);
  }
}
