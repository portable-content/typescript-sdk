/**
 * @fileoverview Tests for EventQueue implementation
 */

import { EventQueue } from '../../../src/events/event-queue';
import type { ElementEvent, BatchElementEventResult } from '../../../src/types/events';
import { createTestElementEvent, createTestEventQueueOptions } from '../../__helpers__/test-factories';

describe('EventQueue', () => {
  let eventQueue: EventQueue;

  beforeEach(() => {
    eventQueue = new EventQueue();
  });

  afterEach(() => {
    eventQueue.destroy();
  });

  describe('constructor', () => {
    it('should create queue with default options', () => {
      expect(eventQueue.getTotalQueueSize()).toBe(0);
      expect(eventQueue.getQueueSizes()).toEqual({
        immediate: 0,
        high: 0,
        normal: 0,
        low: 0
      });
    });

    it('should create queue with custom options', () => {
      const customQueue = new EventQueue(createTestEventQueueOptions({
        maxQueueSize: 50,
        flushInterval: 32,
        deduplicateEvents: false
      }));

      expect(customQueue.getTotalQueueSize()).toBe(0);
      customQueue.destroy();
    });
  });

  describe('enqueue', () => {
    it('should enqueue events successfully', () => {
      const event = createTestElementEvent({
        data: {
          payload: {
            type: 'inline',
            mediaType: 'text/plain',
            source: 'test'
          }
        }
      });

      const result = eventQueue.enqueue(event);
      expect(result).toBe(true);
      expect(eventQueue.getTotalQueueSize()).toBe(1);
      expect(eventQueue.getQueueSizes().normal).toBe(1);
    });

    it('should handle different priority levels', () => {
      const events: ElementEvent[] = [
        {
          elementId: 'test-1',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'immediate' }
        },
        {
          elementId: 'test-2',
          elementType: 'image',
          eventType: 'updateProps',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'high' }
        },
        {
          elementId: 'test-3',
          elementType: 'mermaid',
          eventType: 'updateVariants',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'low' }
        }
      ];

      events.forEach(event => {
        expect(eventQueue.enqueue(event)).toBe(true);
      });

      expect(eventQueue.getTotalQueueSize()).toBe(3);
      expect(eventQueue.getQueueSizes()).toEqual({
        immediate: 1,
        high: 1,
        normal: 0,
        low: 1
      });
    });

    it('should reject events when queue is full', () => {
      const smallQueue = new EventQueue({ maxQueueSize: 2 });

      const event1: ElementEvent = {
        elementId: 'test-1',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      const event2: ElementEvent = {
        elementId: 'test-2',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      const event3: ElementEvent = {
        elementId: 'test-3',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      expect(smallQueue.enqueue(event1)).toBe(true);
      expect(smallQueue.enqueue(event2)).toBe(true);
      expect(smallQueue.enqueue(event3)).toBe(false);

      smallQueue.destroy();
    });

    it('should deduplicate events when enabled', () => {
      const dedupeQueue = new EventQueue({ deduplicateEvents: true });

      const event1: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: { payload: { source: 'original' } },
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      const event2: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: { payload: { source: 'updated' } },
        metadata: { timestamp: Date.now() + 100, source: 'test', priority: 'normal' }
      };

      expect(dedupeQueue.enqueue(event1)).toBe(true);
      expect(dedupeQueue.enqueue(event2)).toBe(true);
      expect(dedupeQueue.getTotalQueueSize()).toBe(1);

      dedupeQueue.destroy();
    });

    it('should reject events with unknown priority', () => {
      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'unknown' as any }
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = eventQueue.enqueue(event);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown priority level: unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('flush', () => {
    it('should process events in priority order', async () => {
      const events: ElementEvent[] = [
        {
          elementId: 'low-priority',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'low' }
        },
        {
          elementId: 'immediate-priority',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'immediate' }
        },
        {
          elementId: 'normal-priority',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }
      ];

      events.forEach(event => eventQueue.enqueue(event));

      const processedEvents: ElementEvent[] = [];
      const processor = async (events: ElementEvent[]): Promise<BatchElementEventResult> => {
        processedEvents.push(...events);
        return {
          successful: events.map(e => e.elementId),
          failed: [],
          queued: [],
          metadata: { totalEvents: events.length, processingTime: 0 }
        };
      };

      const result = await eventQueue.flush(processor);

      expect(result.successful).toEqual(['immediate-priority', 'normal-priority', 'low-priority']);
      expect(processedEvents[0].elementId).toBe('immediate-priority');
      expect(processedEvents[1].elementId).toBe('normal-priority');
      expect(processedEvents[2].elementId).toBe('low-priority');
    });

    it('should clear queues after processing', async () => {
      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      eventQueue.enqueue(event);
      expect(eventQueue.getTotalQueueSize()).toBe(1);

      const processor = async (events: ElementEvent[]): Promise<BatchElementEventResult> => {
        return {
          successful: events.map(e => e.elementId),
          failed: [],
          queued: [],
          metadata: { totalEvents: events.length, processingTime: 0 }
        };
      };

      await eventQueue.flush(processor);
      expect(eventQueue.getTotalQueueSize()).toBe(0);
    });

    it('should handle empty queue', async () => {
      const processor = jest.fn().mockResolvedValue({
        successful: [],
        failed: [],
        queued: [],
        metadata: { totalEvents: 0, processingTime: 0 }
      });

      const result = await eventQueue.flush(processor);

      expect(processor).not.toHaveBeenCalled();
      expect(result.metadata.totalEvents).toBe(0);
    });

    it('should prevent concurrent processing', async () => {
      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      eventQueue.enqueue(event);

      let processingCount = 0;
      const processor = async (events: ElementEvent[]): Promise<BatchElementEventResult> => {
        processingCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          successful: events.map(e => e.elementId),
          failed: [],
          queued: [],
          metadata: { totalEvents: events.length, processingTime: 50 }
        };
      };

      // Start two flush operations simultaneously
      const [result1, result2] = await Promise.all([
        eventQueue.flush(processor),
        eventQueue.flush(processor)
      ]);

      expect(processingCount).toBe(1);
      expect(result1.successful.length + result2.successful.length).toBe(1);
    });
  });

  describe('utility methods', () => {
    it('should track flush scheduling', () => {
      expect(eventQueue.isFlushScheduled()).toBe(false);

      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      eventQueue.enqueue(event);
      expect(eventQueue.isFlushScheduled()).toBe(true);
    });

    it('should force flush scheduling', () => {
      eventQueue.forceFlush();
      expect(eventQueue.isFlushScheduled()).toBe(true);
    });

    it('should clear all events', () => {
      const events: ElementEvent[] = [
        {
          elementId: 'test-1',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'high' }
        },
        {
          elementId: 'test-2',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }
      ];

      events.forEach(event => eventQueue.enqueue(event));
      expect(eventQueue.getTotalQueueSize()).toBe(2);

      eventQueue.clear();
      expect(eventQueue.getTotalQueueSize()).toBe(0);
      expect(eventQueue.isFlushScheduled()).toBe(false);
    });

    it('should destroy queue properly', () => {
      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      eventQueue.enqueue(event);
      expect(eventQueue.getTotalQueueSize()).toBe(1);

      eventQueue.destroy();
      expect(eventQueue.getTotalQueueSize()).toBe(0);
      expect(eventQueue.isFlushScheduled()).toBe(false);
    });
  });
});
