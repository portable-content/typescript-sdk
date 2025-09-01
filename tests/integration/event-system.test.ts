/**
 * @fileoverview Integration tests for the complete event system
 */

import { createEventSystem } from '../../src/events';
import { MockTransport } from '../../src/transport/mock-transport';
import type { Element } from '../../src/types/core';
import type { ElementEvent, ElementLifecycleEvent } from '../../src/events';

describe('Event System Integration', () => {
  let eventSystem: ReturnType<typeof createEventSystem>;
  let transport: MockTransport;

  beforeEach(() => {
    eventSystem = createEventSystem({
      queueOptions: { flushInterval: 10 }
    });
    transport = new MockTransport();
  });

  afterEach(async () => {
    eventSystem.eventManager.destroy();
    eventSystem.lifecycleManager.destroy();
    await transport.destroy();
  });

  describe('complete element lifecycle', () => {
    it('should handle full element lifecycle with events', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      const elementEvents: ElementEvent[] = [];

      // Subscribe to lifecycle events
      eventSystem.lifecycleManager.subscribeToLifecycle((event) => {
        lifecycleEvents.push(event);
      });

      // Subscribe to element events
      eventSystem.eventManager.subscribeToAll((event) => {
        elementEvents.push(event);
      });

      // 1. Create element
      const element = await eventSystem.lifecycleManager.createElement(
        'integration-test-element',
        'markdown',
        { primary: { source: '# Test Content' } },
        { title: 'Integration Test' }
      );

      expect(element.id).toBe('integration-test-element');
      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('created');

      // 2. Register element
      await eventSystem.lifecycleManager.registerElement(element);
      
      expect(eventSystem.eventManager.getElement(element.id)).toEqual(element);
      expect(lifecycleEvents).toHaveLength(2);
      expect(lifecycleEvents[1].eventType).toBe('registered');

      // 3. Activate element
      await eventSystem.lifecycleManager.activateElement(element.id);
      
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('active');
      expect(lifecycleEvents).toHaveLength(3);
      expect(lifecycleEvents[2].eventType).toBe('activated');

      // 4. Update element content
      const updateResult = await eventSystem.lifecycleManager.updateElementContent(
        element.id,
        { primary: { source: '# Updated Content' } }
      );

      expect(updateResult.success).toBe(true);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have lifecycle events for updating -> active
      const updatingEvents = lifecycleEvents.filter(e => e.newState === 'updating');
      expect(updatingEvents).toHaveLength(1);

      // Should have element events for the update
      const updateEvents = elementEvents.filter(e => e.eventType === 'updatePayload');
      expect(updateEvents.length).toBeGreaterThan(0);

      // 5. Suspend element
      await eventSystem.lifecycleManager.suspendElement(element.id);
      
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('suspended');

      // 6. Try to update suspended element (should fail)
      const suspendedUpdateResult = await eventSystem.lifecycleManager.updateElementContent(
        element.id,
        { primary: { source: '# Should Fail' } }
      );

      expect(suspendedUpdateResult.success).toBe(false);

      // 7. Reactivate element
      await eventSystem.lifecycleManager.activateElement(element.id);
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('active');

      // 8. Destroy element
      await eventSystem.lifecycleManager.destroyElement(element.id);
      
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('destroyed');
      expect(eventSystem.eventManager.getElement(element.id)).toBeUndefined();

      const destroyedEvents = lifecycleEvents.filter(e => e.eventType === 'destroyed');
      expect(destroyedEvents).toHaveLength(1);
    });

    it('should handle multiple elements concurrently', async () => {
      const elements: Element[] = [];
      
      // Create multiple elements
      for (let i = 0; i < 5; i++) {
        const element = await eventSystem.lifecycleManager.createElement(
          `element-${i}`,
          i % 2 === 0 ? 'markdown' : 'image',
          { primary: { source: `Content ${i}` } }
        );
        elements.push(element);
        await eventSystem.lifecycleManager.registerElement(element);
        await eventSystem.lifecycleManager.activateElement(element.id);
      }

      // Update all elements concurrently
      const updatePromises = elements.map(element =>
        eventSystem.lifecycleManager.updateElementContent(
          element.id,
          { primary: { source: `Updated ${element.id}` } }
        )
      );

      const results = await Promise.all(updatePromises);
      
      // All updates should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Check final states
      elements.forEach(element => {
        expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('active');
      });

      // Get lifecycle statistics
      const stats = eventSystem.lifecycleManager.getLifecycleStats();
      expect(stats.active).toBe(5);
      expect(stats.created + stats.registered + stats.active + stats.suspended + stats.updating + stats.error + stats.destroyed).toBe(5);
    });
  });

  describe('event system with transport', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should integrate with transport layer', async () => {
      const transportEvents: ElementEvent[] = [];
      
      // Subscribe to transport events
      await transport.subscribeToAll((event) => {
        transportEvents.push(event);
      });

      // Create and register element
      const element = await eventSystem.lifecycleManager.createElement(
        'transport-test-element',
        'markdown',
        { primary: { source: 'Transport test' } }
      );
      
      await eventSystem.lifecycleManager.registerElement(element);
      await eventSystem.lifecycleManager.activateElement(element.id);

      // Send event through transport
      const transportEvent: ElementEvent = {
        elementId: element.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: { payload: { source: 'Updated via transport' } },
        metadata: {
          timestamp: Date.now(),
          source: 'transport',
          priority: 'normal'
        }
      };

      const result = await transport.sendEvent(transportEvent);
      expect(result.success).toBe(true);

      // Simulate receiving the event
      transport.simulateEvent(transportEvent);

      expect(transportEvents).toHaveLength(1);
      expect(transportEvents[0]).toEqual(transportEvent);
    });

    it('should handle batch operations with transport', async () => {
      const batchEvents: ElementEvent[][] = [];
      
      await transport.subscribeToBatch((events) => {
        batchEvents.push(events);
      });

      // Create multiple elements
      const elements: Element[] = [];
      for (let i = 0; i < 3; i++) {
        const element = await eventSystem.lifecycleManager.createElement(
          `batch-element-${i}`,
          'markdown',
          { primary: { source: `Batch content ${i}` } }
        );
        elements.push(element);
        await eventSystem.lifecycleManager.registerElement(element);
        await eventSystem.lifecycleManager.activateElement(element.id);
      }

      // Send batch events
      const events: ElementEvent[] = elements.map(element => ({
        elementId: element.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: { payload: { source: `Batch updated ${element.id}` } },
        metadata: {
          timestamp: Date.now(),
          source: 'batch-test',
          priority: 'normal'
        }
      }));

      const result = await transport.sendBatchEvents(events);
      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);

      // Simulate receiving batch events
      transport.simulateBatchEvents(events);

      expect(batchEvents).toHaveLength(1);
      expect(batchEvents[0]).toHaveLength(3);
    });
  });

  describe('error handling and recovery', () => {
    it('should handle element errors gracefully', async () => {
      const element = await eventSystem.lifecycleManager.createElement(
        'error-test-element',
        'markdown',
        { primary: { source: 'Error test' } }
      );

      await eventSystem.lifecycleManager.registerElement(element);
      await eventSystem.lifecycleManager.activateElement(element.id);

      // Try to update non-existent element
      const result = await eventSystem.eventManager.sendEvent({
        elementId: 'non-existent-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: {
          timestamp: Date.now(),
          source: 'error-test',
          priority: 'normal'
        }
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Element non-existent-element not found');

      // Original element should still be active
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('active');
    });

    it('should handle transport errors', async () => {
      await transport.connect();
      
      const errors: Error[] = [];
      transport.onError((error) => {
        errors.push(error);
      });

      // Simulate transport error
      const testError = new Error('Transport connection lost');
      transport.simulateConnectionError(testError);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Transport connection lost');
    });

    it('should handle subscription errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const element = await eventSystem.lifecycleManager.createElement(
        'subscription-error-element',
        'markdown',
        { primary: { source: 'Subscription error test' } }
      );

      await eventSystem.lifecycleManager.registerElement(element);

      // Subscribe with error-throwing callback
      eventSystem.eventManager.subscribe(element.id, () => {
        throw new Error('Subscription callback error');
      });

      // Send event that will trigger the error
      await eventSystem.eventManager.sendEvent({
        elementId: element.id,
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: {
          timestamp: Date.now(),
          source: 'error-test',
          priority: 'normal'
        }
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

  describe('performance and scalability', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const element = await eventSystem.lifecycleManager.createElement(
        'performance-test-element',
        'markdown',
        { primary: { source: 'Performance test' } }
      );

      await eventSystem.lifecycleManager.registerElement(element);
      await eventSystem.lifecycleManager.activateElement(element.id);

      const startTime = Date.now();
      const updateCount = 100;

      // Send many updates rapidly
      const updatePromises = Array.from({ length: updateCount }, (_, i) =>
        eventSystem.eventManager.sendEvent({
          elementId: element.id,
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: { payload: { source: `Update ${i}` } },
          metadata: {
            timestamp: Date.now(),
            source: 'performance-test',
            priority: 'normal'
          }
        })
      );

      const results = await Promise.all(updatePromises);
      const endTime = Date.now();

      // All updates should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete in reasonable time (less than 1 second for 100 updates)
      expect(endTime - startTime).toBeLessThan(1000);

      // Wait for all events to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Element should still be active
      expect(eventSystem.lifecycleManager.getElementState(element.id)).toBe('active');
    });

    it('should handle many elements efficiently', async () => {
      const elementCount = 50;
      const elements: Element[] = [];

      const startTime = Date.now();

      // Create many elements
      for (let i = 0; i < elementCount; i++) {
        const element = await eventSystem.lifecycleManager.createElement(
          `scale-test-element-${i}`,
          i % 3 === 0 ? 'markdown' : i % 3 === 1 ? 'image' : 'mermaid',
          { primary: { source: `Scale test content ${i}` } }
        );
        elements.push(element);
        await eventSystem.lifecycleManager.registerElement(element);
        await eventSystem.lifecycleManager.activateElement(element.id);
      }

      const creationTime = Date.now();

      // Update all elements
      const updatePromises = elements.map(element =>
        eventSystem.lifecycleManager.updateElementContent(
          element.id,
          { primary: { source: `Updated ${element.id}` } }
        )
      );

      const updateResults = await Promise.all(updatePromises);
      const updateTime = Date.now();

      // All operations should succeed
      updateResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete in reasonable time
      expect(creationTime - startTime).toBeLessThan(2000); // 2 seconds for creation
      expect(updateTime - creationTime).toBeLessThan(1000); // 1 second for updates

      // Check final statistics
      const stats = eventSystem.lifecycleManager.getLifecycleStats();
      expect(stats.active).toBe(elementCount);

      const queueStats = eventSystem.eventManager.getQueueStats();
      expect(queueStats.totalQueued).toBe(0); // All events should be processed
    });
  });
});
