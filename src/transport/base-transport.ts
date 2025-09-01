/**
 * @fileoverview Base transport implementation with common functionality
 */

import type {
  Transport,
  TransportConnectionState,
  TransportConnectionOptions,
  TransportEventHandler,
  TransportBatchEventHandler,
  TransportConnectionStateHandler,
  TransportErrorHandler,
  TransportUnsubscribeFunction,
  TransportStats,
} from './transport-interface';
import { DEFAULT_TRANSPORT_OPTIONS } from './transport-interface';
import type { ElementEvent, ElementEventResult, BatchElementEventResult } from '../types/events';

/**
 * Base transport implementation with common functionality
 */
export abstract class BaseTransport implements Transport {
  public abstract readonly name: string;
  
  protected _connectionState: TransportConnectionState = 'disconnected';
  protected connectionOptions: Required<TransportConnectionOptions> = DEFAULT_TRANSPORT_OPTIONS;
  protected connectionStateHandlers = new Set<TransportConnectionStateHandler>();
  protected errorHandlers = new Set<TransportErrorHandler>();
  protected stats: TransportStats;
  protected connectionStartTime = 0;
  protected isDestroyed = false;

  constructor() {
    this.stats = this.createInitialStats();
  }

  /**
   * Get current connection state
   */
  get connectionState(): TransportConnectionState {
    return this._connectionState;
  }

  /**
   * Check if transport is connected
   */
  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Connect to the transport
   */
  async connect(options?: TransportConnectionOptions): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Transport has been destroyed');
    }

    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.connectionOptions = { ...DEFAULT_TRANSPORT_OPTIONS, ...options };
    this.updateConnectionState('connecting');
    this.connectionStartTime = Date.now();

    try {
      await this.performConnect();
      this.updateConnectionState('connected');
    } catch (error) {
      this.updateConnectionState('error');
      this.handleError(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  /**
   * Disconnect from the transport
   */
  async disconnect(): Promise<void> {
    if (this.connectionState === 'disconnected' || this.connectionState === 'closed') {
      return;
    }

    try {
      await this.performDisconnect();
    } finally {
      this.updateConnectionState('disconnected');
    }
  }

  /**
   * Send a single event
   */
  async sendEvent(event: ElementEvent): Promise<ElementEventResult> {
    if (!this.isConnected) {
      throw new Error('Transport is not connected');
    }

    try {
      const result = await this.performSendEvent(event);
      this.stats.eventsSent++;
      return result;
    } catch (error) {
      this.stats.messageErrors++;
      this.handleError(error instanceof Error ? error : new Error('Failed to send event'));
      throw error;
    }
  }

  /**
   * Send multiple events as a batch
   */
  async sendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult> {
    if (!this.isConnected) {
      throw new Error('Transport is not connected');
    }

    try {
      const result = await this.performSendBatchEvents(events);
      this.stats.batchEventsSent++;
      return result;
    } catch (error) {
      this.stats.messageErrors++;
      this.handleError(error instanceof Error ? error : new Error('Failed to send batch events'));
      throw error;
    }
  }

  /**
   * Subscribe to events for a specific element
   */
  async subscribeToElement(
    elementId: string,
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction> {
    if (!this.isConnected) {
      throw new Error('Transport is not connected');
    }

    const unsubscribe = await this.performSubscribeToElement(elementId, handler, options);
    this.stats.activeSubscriptions++;

    return () => {
      unsubscribe();
      this.stats.activeSubscriptions = Math.max(0, this.stats.activeSubscriptions - 1);
    };
  }

  /**
   * Subscribe to all events
   */
  async subscribeToAll(
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction> {
    if (!this.isConnected) {
      throw new Error('Transport is not connected');
    }

    const unsubscribe = await this.performSubscribeToAll(handler, options);
    this.stats.activeSubscriptions++;

    return () => {
      unsubscribe();
      this.stats.activeSubscriptions = Math.max(0, this.stats.activeSubscriptions - 1);
    };
  }

  /**
   * Subscribe to batch events
   */
  async subscribeToBatch(
    handler: TransportBatchEventHandler,
    options?: { batchSize?: number; flushInterval?: number }
  ): Promise<TransportUnsubscribeFunction> {
    if (!this.isConnected) {
      throw new Error('Transport is not connected');
    }

    const unsubscribe = await this.performSubscribeToBatch(handler, options);
    this.stats.activeSubscriptions++;

    return () => {
      unsubscribe();
      this.stats.activeSubscriptions = Math.max(0, this.stats.activeSubscriptions - 1);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: TransportConnectionStateHandler): TransportUnsubscribeFunction {
    this.connectionStateHandlers.add(handler);

    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to transport errors
   */
  onError(handler: TransportErrorHandler): TransportUnsubscribeFunction {
    this.errorHandlers.add(handler);

    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Get transport statistics
   */
  getStats(): TransportStats {
    return {
      ...this.stats,
      uptime: this.connectionStartTime > 0 ? Date.now() - this.connectionStartTime : 0
    };
  }

  /**
   * Destroy the transport and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    try {
      await this.disconnect();
    } catch (error) {
      // Ignore disconnect errors during destruction
    }

    this.connectionStateHandlers.clear();
    this.errorHandlers.clear();
    this.stats = this.createInitialStats();
  }

  /**
   * Abstract methods to be implemented by concrete transport classes
   */
  protected abstract performConnect(): Promise<void>;
  protected abstract performDisconnect(): Promise<void>;
  protected abstract performSendEvent(event: ElementEvent): Promise<ElementEventResult>;
  protected abstract performSendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult>;
  protected abstract performSubscribeToElement(
    elementId: string,
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction>;
  protected abstract performSubscribeToAll(
    handler: TransportEventHandler,
    options?: { eventTypes?: string[] }
  ): Promise<TransportUnsubscribeFunction>;
  protected abstract performSubscribeToBatch(
    handler: TransportBatchEventHandler,
    options?: { batchSize?: number; flushInterval?: number }
  ): Promise<TransportUnsubscribeFunction>;

  /**
   * Update connection state and notify handlers
   */
  protected updateConnectionState(newState: TransportConnectionState, error?: Error): void {
    this._connectionState = newState;

    if (newState === 'error') {
      this.stats.connectionErrors++;
    }

    // Notify handlers
    for (const handler of this.connectionStateHandlers) {
      try {
        handler(newState, error);
      } catch (handlerError) {
        console.error('Error in connection state handler:', handlerError);
      }
    }
  }

  /**
   * Handle transport errors
   */
  protected handleError(error: Error, context?: Record<string, unknown>): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error, context);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }
  }

  /**
   * Handle received events
   */
  protected handleReceivedEvent(_event: ElementEvent): void {
    this.stats.eventsReceived++;
  }

  /**
   * Handle received batch events
   */
  protected handleReceivedBatchEvents(_events: ElementEvent[]): void {
    this.stats.batchEventsReceived++;
  }

  /**
   * Update message latency statistics
   */
  protected updateLatencyStats(latencyMs: number): void {
    // Simple moving average for latency
    const alpha = 0.1; // Smoothing factor
    this.stats.averageLatency = this.stats.averageLatency * (1 - alpha) + latencyMs * alpha;
  }

  /**
   * Create initial statistics object
   */
  private createInitialStats(): TransportStats {
    return {
      uptime: 0,
      eventsSent: 0,
      eventsReceived: 0,
      batchEventsSent: 0,
      batchEventsReceived: 0,
      connectionErrors: 0,
      messageErrors: 0,
      averageLatency: 0,
      activeSubscriptions: 0
    };
  }
}
