/**
 * @fileoverview Mock transport implementation for testing and development
 */

import { BaseTransport } from './base-transport';
import type {
  TransportEventHandler,
  TransportBatchEventHandler,
  TransportUnsubscribeFunction,
} from './transport-interface';
import type { ElementEvent, ElementEventResult, BatchElementEventResult } from '../types/events';

/**
 * Mock transport for testing and development
 */
export class MockTransport extends BaseTransport {
  public readonly name = 'mock';

  private eventHandlers = new Set<TransportEventHandler>();
  private batchEventHandlers = new Set<TransportBatchEventHandler>();
  private elementSubscriptions = new Map<string, Set<TransportEventHandler>>();

  /**
   * Mock connection - always succeeds immediately
   */
  protected async performConnect(): Promise<void> {
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Mock disconnection - always succeeds immediately
   */
  protected async performDisconnect(): Promise<void> {
    this.eventHandlers.clear();
    this.batchEventHandlers.clear();
    this.elementSubscriptions.clear();
  }

  /**
   * Mock send event - always succeeds
   */
  protected async performSendEvent(event: ElementEvent): Promise<ElementEventResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 5));

    return {
      success: true,
      elementId: event.elementId,
      updatedAt: Date.now(),
    };
  }

  /**
   * Mock send batch events - always succeeds
   */
  protected async performSendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      successful: events.map((e) => e.elementId),
      failed: [],
      queued: [],
      metadata: {
        totalEvents: events.length,
        processingTime: 10,
      },
    };
  }

  /**
   * Mock element subscription
   */
  protected async performSubscribeToElement(
    elementId: string,
    handler: TransportEventHandler,
    _options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction> {
    let handlers = this.elementSubscriptions.get(elementId);
    if (!handlers) {
      handlers = new Set();
      this.elementSubscriptions.set(elementId, handlers);
    }

    handlers.add(handler);

    return () => {
      const subs = this.elementSubscriptions.get(elementId);
      if (subs) {
        subs.delete(handler);
        if (subs.size === 0) {
          this.elementSubscriptions.delete(elementId);
        }
      }
    };
  }

  /**
   * Mock global subscription
   */
  protected async performSubscribeToAll(
    handler: TransportEventHandler,
    _options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction> {
    this.eventHandlers.add(handler);

    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Mock batch subscription
   */
  protected async performSubscribeToBatch(
    handler: TransportBatchEventHandler,
    _options?: { batchSize?: number; flushInterval?: number }
  ): Promise<TransportUnsubscribeFunction> {
    this.batchEventHandlers.add(handler);

    return () => {
      this.batchEventHandlers.delete(handler);
    };
  }

  /**
   * Simulate receiving an event (for testing)
   */
  simulateEvent(event: ElementEvent): void {
    this.handleReceivedEvent(event);

    // Notify element-specific subscribers
    const elementHandlers = this.elementSubscriptions.get(event.elementId);
    if (elementHandlers) {
      for (const handler of elementHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in mock event handler:', error);
        }
      }
    }

    // Notify global subscribers
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in mock global event handler:', error);
      }
    }
  }

  /**
   * Simulate receiving batch events (for testing)
   */
  simulateBatchEvents(events: ElementEvent[]): void {
    this.handleReceivedBatchEvents(events);

    // Notify batch subscribers
    for (const handler of this.batchEventHandlers) {
      try {
        handler(events);
      } catch (error) {
        console.error('Error in mock batch event handler:', error);
      }
    }
  }

  /**
   * Simulate connection error (for testing)
   */
  simulateConnectionError(error: Error): void {
    this.updateConnectionState('error', error);
    this.handleError(error);
  }

  /**
   * Simulate reconnection (for testing)
   */
  simulateReconnection(): void {
    this.updateConnectionState('reconnecting');
    setTimeout(() => {
      this.updateConnectionState('connected');
    }, 100);
  }
}
