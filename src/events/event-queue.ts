/**
 * @fileoverview Event queue implementation for batching and prioritizing element events
 */

import type {
  ElementEvent,
  BatchElementEventResult,
  EventQueueOptions,
} from '../types/events';
import { DEFAULT_EVENT_QUEUE_OPTIONS } from '../types/events';

/**
 * Priority-based event queue for efficient event processing
 */
export class EventQueue {
  private readonly options: EventQueueOptions;
  private readonly queues: Map<string, ElementEvent[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly eventDeduplicationMap = new Map<string, ElementEvent>();

  constructor(options: Partial<EventQueueOptions> = {}) {
    this.options = { ...DEFAULT_EVENT_QUEUE_OPTIONS, ...options };
    
    // Initialize priority queues
    this.options.priorityLevels.forEach(priority => {
      this.queues.set(priority, []);
    });
  }

  /**
   * Add an event to the queue
   */
  enqueue(event: ElementEvent): boolean {
    const priority = event.metadata.priority;
    const queue = this.queues.get(priority);
    
    if (!queue) {
      console.warn(`Unknown priority level: ${priority}`);
      return false;
    }

    // Check queue size limits
    const totalQueueSize = this.getTotalQueueSize();
    if (totalQueueSize >= this.options.maxQueueSize) {
      console.warn('Event queue is full, dropping event');
      return false;
    }

    // Handle event deduplication
    if (this.options.deduplicateEvents) {
      const dedupeKey = this.getDeduplicationKey(event);
      const existingEvent = this.eventDeduplicationMap.get(dedupeKey);
      
      if (existingEvent) {
        // Update existing event with newer data
        Object.assign(existingEvent.data, event.data);
        existingEvent.metadata.timestamp = event.metadata.timestamp;
        return true;
      }
      
      this.eventDeduplicationMap.set(dedupeKey, event);
    }

    // Add to appropriate priority queue
    queue.push(event);

    // Schedule flush if not already scheduled
    this.scheduleFlush();
    
    return true;
  }

  /**
   * Process all queued events in priority order
   */
  async flush(processor: (events: ElementEvent[]) => Promise<BatchElementEventResult>): Promise<BatchElementEventResult> {
    if (this.isProcessing) {
      return {
        successful: [],
        failed: [],
        queued: [],
        metadata: { totalEvents: 0, processingTime: 0 }
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Clear flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      // Collect events in priority order
      const eventsToProcess: ElementEvent[] = [];
      
      for (const priority of this.options.priorityLevels.reverse()) { // Process high priority first
        const queue = this.queues.get(priority);
        if (queue && queue.length > 0) {
          eventsToProcess.push(...queue);
          queue.length = 0; // Clear the queue
        }
      }

      // Clear deduplication map
      this.eventDeduplicationMap.clear();

      if (eventsToProcess.length === 0) {
        return {
          successful: [],
          failed: [],
          queued: [],
          metadata: { totalEvents: 0, processingTime: Date.now() - startTime }
        };
      }

      // Process events
      const result = await processor(eventsToProcess);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          totalEvents: eventsToProcess.length,
          processingTime: Date.now() - startTime
        }
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the total number of queued events
   */
  getTotalQueueSize(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Get queue sizes by priority
   */
  getQueueSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [priority, queue] of this.queues.entries()) {
      sizes[priority] = queue.length;
    }
    return sizes;
  }

  /**
   * Clear all queued events
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.eventDeduplicationMap.clear();
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Destroy the queue and clean up resources
   */
  destroy(): void {
    this.clear();
    this.isProcessing = false;
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    if (this.flushTimer || this.isProcessing) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      // The actual flush will be triggered by the EventManager
    }, this.options.flushInterval);
  }

  /**
   * Generate deduplication key for an event
   */
  private getDeduplicationKey(event: ElementEvent): string {
    return `${event.elementId}:${event.eventType}`;
  }

  /**
   * Check if flush is scheduled
   */
  isFlushScheduled(): boolean {
    return this.flushTimer !== null;
  }

  /**
   * Force immediate flush scheduling
   */
  forceFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
    }, 0);
  }
}
