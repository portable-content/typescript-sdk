/**
 * @fileoverview Tests for EventManager implementation
 */

import { EventManager } from '../../../src/events/event-manager';
import type { Element } from '../../../src/types/core';
import type { ElementEvent } from '../../../src/types/events';
import { createTestElement, createTestElementContent, createTestElementEvent, createTestElementEventWithPayload, createTestEventManagerOptions } from '../../__helpers__/test-factories';

describe('EventManager', () => {
  let eventManager: EventManager;
  let testElement: Element;

  beforeEach(() => {
    eventManager = new EventManager(createTestEventManagerOptions());

    testElement = createTestElement();
  });

  afterEach(() => {
    eventManager.destroy();
  });

  describe('element registration', () => {
    it('should register elements successfully', () => {
      eventManager.registerElement(testElement);
      
      const registeredElements = eventManager.getRegisteredElements();
      expect(registeredElements).toHaveLength(1);
      expect(registeredElements[0]).toEqual(testElement);
    });

    it('should get element by ID', () => {
      eventManager.registerElement(testElement);
      
      const element = eventManager.getElement(testElement.id);
      expect(element).toEqual(testElement);
    });

    it('should return undefined for non-existent element', () => {
      const element = eventManager.getElement('non-existent');
      expect(element).toBeUndefined();
    });

    it('should unregister elements', () => {
      eventManager.registerElement(testElement);
      expect(eventManager.getRegisteredElements()).toHaveLength(1);

      const result = eventManager.unregisterElement(testElement.id);
      expect(result).toBe(true);
      expect(eventManager.getRegisteredElements()).toHaveLength(0);
    });

    it('should return false when unregistering non-existent element', () => {
      const result = eventManager.unregisterElement('non-existent');
      expect(result).toBe(false);
    });

    it('should throw error when destroyed', () => {
      eventManager.destroy();
      
      expect(() => {
        eventManager.registerElement(testElement);
      }).toThrow('EventManager has been destroyed');
    });
  });

  describe('event sending', () => {
    beforeEach(() => {
      eventManager.registerElement(testElement);
    });

    it('should send events successfully', async () => {
      const event = createTestElementEventWithPayload('Updated content', {
        elementId: testElement.id,
        metadata: {
          timestamp: Date.now(),
          source: 'test',
          priority: 'normal'
        }
      });

      const result = await eventManager.sendEvent(event);
      
      expect(result.success).toBe(true);
      expect(result.elementId).toBe(testElement.id);
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail for non-existent elements', async () => {
      const event: ElementEvent = {
        elementId: 'non-existent',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: {
          timestamp: Date.now(),
          source: 'test',
          priority: 'normal'
        }
      };

      const result = await eventManager.sendEvent(event);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Element non-existent not found');
    });

    it('should handle batch events', async () => {
      const events: ElementEvent[] = [
        createTestElementEventWithPayload('Content 1', {
          elementId: testElement.id,
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }),
        createTestElementEvent({
          elementId: testElement.id,
          eventType: 'updateProps',
          data: { props: { title: 'Test Title' } },
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        })
      ];

      const result = await eventManager.sendBatchEvents(events);
      
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.metadata?.totalEvents).toBe(2);
    });

    it('should handle mixed success/failure in batch', async () => {
      const events: ElementEvent[] = [
        {
          elementId: testElement.id,
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        },
        {
          elementId: 'non-existent',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }
      ];

      const result = await eventManager.sendBatchEvents(events);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].elementId).toBe('non-existent');
    });

    it('should validate events when validator provided', async () => {
      const validatorManager = new EventManager({
        validateEvent: async (event) => ({
          isValid: event.elementId !== 'invalid',
          errors: event.elementId === 'invalid' ? ['Invalid element ID'] : undefined
        })
      });

      validatorManager.registerElement(testElement);

      const validEvent: ElementEvent = {
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      const invalidEvent: ElementEvent = {
        elementId: 'invalid',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      const validResult = await validatorManager.sendEvent(validEvent);
      const invalidResult = await validatorManager.sendEvent(invalidEvent);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toContain('Invalid element ID');

      validatorManager.destroy();
    });
  });

  describe('event subscriptions', () => {
    beforeEach(() => {
      eventManager.registerElement(testElement);
    });

    it('should subscribe to element events', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = eventManager.subscribe(testElement.id, (event) => {
        receivedEvents.push(event);
      });

      const event: ElementEvent = {
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      await eventManager.sendEvent(event);
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toMatchObject(event);

      unsubscribe();
    });

    it('should subscribe to all events', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = eventManager.subscribeToAll((event) => {
        receivedEvents.push(event);
      });

      const event: ElementEvent = {
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      await eventManager.sendEvent(event);
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(receivedEvents).toHaveLength(1);

      unsubscribe();
    });

    it('should unsubscribe properly', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = eventManager.subscribe(testElement.id, (event) => {
        receivedEvents.push(event);
      });

      // Send event before unsubscribing
      await eventManager.sendEvent({
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      unsubscribe();

      // Send event after unsubscribing
      await eventManager.sendEvent({
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updateProps',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(receivedEvents).toHaveLength(1);
    });

    it('should handle subscriber errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      eventManager.subscribe(testElement.id, () => {
        throw new Error('Subscriber error');
      });

      await eventManager.sendEvent({
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event subscriber:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('event history', () => {
    beforeEach(() => {
      eventManager.registerElement(testElement);
    });

    it('should track event history', async () => {
      const event: ElementEvent = {
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      await eventManager.sendEvent(event);
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const history = eventManager.getEventHistory(testElement.id);
      expect(history).toHaveLength(1);
      expect(history[0].elementId).toBe(testElement.id);
      expect(history[0].eventType).toBe('updatePayload');
    });

    it('should get all event history', async () => {
      const anotherElement = createTestElement({
        id: 'another-element',
        kind: 'image',
        content: createTestElementContent({
          primary: { type: 'external', mediaType: 'image/jpeg', source: 'image.jpg' }
        })
      });

      eventManager.registerElement(anotherElement);

      await eventManager.sendEvent({
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      await eventManager.sendEvent({
        elementId: anotherElement.id,
        elementType: 'image',
        eventType: 'updateProps',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const allHistory = eventManager.getEventHistory();
      expect(allHistory.length).toBeGreaterThanOrEqual(2);
    });

    it('should clear event history', async () => {
      await eventManager.sendEvent({
        elementId: testElement.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(eventManager.getEventHistory()).not.toHaveLength(0);
      
      eventManager.clearHistory();
      expect(eventManager.getEventHistory()).toHaveLength(0);
    });
  });

  describe('queue statistics', () => {
    it('should provide queue statistics', () => {
      const stats = eventManager.getQueueStats();
      
      expect(stats).toHaveProperty('totalQueued');
      expect(stats).toHaveProperty('queueSizes');
      expect(typeof stats.totalQueued).toBe('number');
      expect(typeof stats.queueSizes).toBe('object');
    });
  });

  describe('destruction', () => {
    it('should destroy properly', async () => {
      eventManager.registerElement(testElement);
      expect(eventManager.getRegisteredElements()).toHaveLength(1);

      eventManager.destroy();
      
      expect(() => eventManager.registerElement(testElement)).toThrow();
      await expect(eventManager.sendEvent({} as any)).rejects.toThrow();
      expect(() => eventManager.subscribe('test', () => {})).toThrow();
    });
  });
});
