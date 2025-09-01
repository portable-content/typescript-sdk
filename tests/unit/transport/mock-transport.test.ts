/**
 * @fileoverview Tests for MockTransport implementation
 */

import { MockTransport } from '../../../src/transport/mock-transport';
import type { ElementEvent } from '../../../src/types/events';

describe('MockTransport', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  afterEach(async () => {
    await transport.destroy();
  });

  describe('connection management', () => {
    it('should connect successfully', async () => {
      expect(transport.connectionState).toBe('disconnected');
      expect(transport.isConnected).toBe(false);

      await transport.connect();

      expect(transport.connectionState).toBe('connected');
      expect(transport.isConnected).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await transport.connect();
      expect(transport.isConnected).toBe(true);

      await transport.disconnect();

      expect(transport.connectionState).toBe('disconnected');
      expect(transport.isConnected).toBe(false);
    });

    it('should handle multiple connect calls', async () => {
      await transport.connect();
      await transport.connect(); // Should not throw

      expect(transport.isConnected).toBe(true);
    });

    it('should handle multiple disconnect calls', async () => {
      await transport.connect();
      await transport.disconnect();
      await transport.disconnect(); // Should not throw

      expect(transport.isConnected).toBe(false);
    });

    it('should track connection state changes', async () => {
      const stateChanges: string[] = [];
      
      transport.onConnectionStateChange((state) => {
        stateChanges.push(state);
      });

      await transport.connect();
      await transport.disconnect();

      expect(stateChanges).toEqual(['connecting', 'connected', 'disconnected']);
    });
  });

  describe('event sending', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should send single events successfully', async () => {
      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: { payload: { source: 'Test content' } },
        metadata: {
          timestamp: Date.now(),
          source: 'test',
          priority: 'normal'
        }
      };

      const result = await transport.sendEvent(event);

      expect(result.success).toBe(true);
      expect(result.elementId).toBe('test-element');
      expect(result.updatedAt).toBeDefined();
    });

    it('should send batch events successfully', async () => {
      const events: ElementEvent[] = [
        {
          elementId: 'element-1',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        },
        {
          elementId: 'element-2',
          elementType: 'image',
          eventType: 'updateProps',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }
      ];

      const result = await transport.sendBatchEvents(events);

      expect(result.successful).toEqual(['element-1', 'element-2']);
      expect(result.failed).toHaveLength(0);
      expect(result.metadata.totalEvents).toBe(2);
    });

    it('should fail when not connected', async () => {
      await transport.disconnect();

      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      await expect(transport.sendEvent(event)).rejects.toThrow('Transport is not connected');
    });

    it('should update statistics on send', async () => {
      const initialStats = transport.getStats();
      expect(initialStats.eventsSent).toBe(0);
      expect(initialStats.batchEventsSent).toBe(0);

      await transport.sendEvent({
        elementId: 'test',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      await transport.sendBatchEvents([{
        elementId: 'test',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      }]);

      const finalStats = transport.getStats();
      expect(finalStats.eventsSent).toBe(1);
      expect(finalStats.batchEventsSent).toBe(1);
    });
  });

  describe('event subscriptions', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should subscribe to element events', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = await transport.subscribeToElement('test-element', (event) => {
        receivedEvents.push(event);
      });

      const event: ElementEvent = {
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      transport.simulateEvent(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual(event);

      unsubscribe();
    });

    it('should subscribe to all events', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = await transport.subscribeToAll((event) => {
        receivedEvents.push(event);
      });

      const event: ElementEvent = {
        elementId: 'any-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      };

      transport.simulateEvent(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual(event);

      unsubscribe();
    });

    it('should subscribe to batch events', async () => {
      const receivedBatches: ElementEvent[][] = [];
      
      const unsubscribe = await transport.subscribeToBatch((events) => {
        receivedBatches.push(events);
      });

      const events: ElementEvent[] = [
        {
          elementId: 'element-1',
          elementType: 'markdown',
          eventType: 'updatePayload',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        },
        {
          elementId: 'element-2',
          elementType: 'image',
          eventType: 'updateProps',
          data: {},
          metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
        }
      ];

      transport.simulateBatchEvents(events);

      expect(receivedBatches).toHaveLength(1);
      expect(receivedBatches[0]).toEqual(events);

      unsubscribe();
    });

    it('should unsubscribe properly', async () => {
      const receivedEvents: ElementEvent[] = [];
      
      const unsubscribe = await transport.subscribeToElement('test-element', (event) => {
        receivedEvents.push(event);
      });

      // Send event before unsubscribing
      transport.simulateEvent({
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      unsubscribe();

      // Send event after unsubscribing
      transport.simulateEvent({
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updateProps',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      expect(receivedEvents).toHaveLength(1);
    });

    it('should update subscription statistics', async () => {
      const initialStats = transport.getStats();
      expect(initialStats.activeSubscriptions).toBe(0);

      const unsubscribe1 = await transport.subscribeToElement('element-1', () => {});
      const unsubscribe2 = await transport.subscribeToAll(() => {});

      const midStats = transport.getStats();
      expect(midStats.activeSubscriptions).toBe(2);

      unsubscribe1();
      unsubscribe2();

      const finalStats = transport.getStats();
      expect(finalStats.activeSubscriptions).toBe(0);
    });

    it('should fail subscriptions when not connected', async () => {
      await transport.disconnect();

      await expect(transport.subscribeToElement('test', () => {}))
        .rejects.toThrow('Transport is not connected');
      
      await expect(transport.subscribeToAll(() => {}))
        .rejects.toThrow('Transport is not connected');
      
      await expect(transport.subscribeToBatch(() => {}))
        .rejects.toThrow('Transport is not connected');
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const errors: Error[] = [];
      
      transport.onError((error) => {
        errors.push(error);
      });

      const testError = new Error('Connection failed');
      transport.simulateConnectionError(testError);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe(testError);
    });

    it('should handle subscription errors gracefully', async () => {
      await transport.connect();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await transport.subscribeToElement('test-element', () => {
        throw new Error('Handler error');
      });

      transport.simulateEvent({
        elementId: 'test-element',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in mock event handler:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('simulation methods', () => {
    beforeEach(async () => {
      await transport.connect();
    });

    it('should simulate reconnection', async () => {
      const stateChanges: string[] = [];
      
      transport.onConnectionStateChange((state) => {
        stateChanges.push(state);
      });

      transport.simulateReconnection();

      // Wait for reconnection simulation
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(stateChanges).toContain('reconnecting');
      expect(stateChanges).toContain('connected');
    });

    it('should update received event statistics', async () => {
      const initialStats = transport.getStats();
      expect(initialStats.eventsReceived).toBe(0);
      expect(initialStats.batchEventsReceived).toBe(0);

      transport.simulateEvent({
        elementId: 'test',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      });

      transport.simulateBatchEvents([{
        elementId: 'test',
        elementType: 'markdown',
        eventType: 'updatePayload',
        data: {},
        metadata: { timestamp: Date.now(), source: 'test', priority: 'normal' }
      }]);

      const finalStats = transport.getStats();
      expect(finalStats.eventsReceived).toBe(1);
      expect(finalStats.batchEventsReceived).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should provide transport statistics', () => {
      const stats = transport.getStats();

      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('eventsSent');
      expect(stats).toHaveProperty('eventsReceived');
      expect(stats).toHaveProperty('batchEventsSent');
      expect(stats).toHaveProperty('batchEventsReceived');
      expect(stats).toHaveProperty('connectionErrors');
      expect(stats).toHaveProperty('messageErrors');
      expect(stats).toHaveProperty('averageLatency');
      expect(stats).toHaveProperty('activeSubscriptions');

      expect(typeof stats.uptime).toBe('number');
      expect(typeof stats.eventsSent).toBe('number');
      expect(typeof stats.eventsReceived).toBe('number');
    });

    it('should track uptime when connected', async () => {
      const initialStats = transport.getStats();
      expect(initialStats.uptime).toBe(0);

      await transport.connect();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      const connectedStats = transport.getStats();
      expect(connectedStats.uptime).toBeGreaterThan(0);
    });
  });

  describe('destruction', () => {
    it('should destroy transport properly', async () => {
      await transport.connect();
      expect(transport.isConnected).toBe(true);

      await transport.destroy();

      expect(transport.isConnected).toBe(false);
      
      // Should not be able to perform operations after destruction
      await expect(transport.connect()).rejects.toThrow('Transport has been destroyed');
    });

    it('should clean up subscriptions on destroy', async () => {
      await transport.connect();
      
      await transport.subscribeToElement('test', () => {});
      await transport.subscribeToAll(() => {});
      
      const statsBeforeDestroy = transport.getStats();
      expect(statsBeforeDestroy.activeSubscriptions).toBe(2);

      await transport.destroy();

      // Note: After destruction, stats are reset, so we can't check activeSubscriptions
      // but we can verify that operations fail
      await expect(transport.subscribeToElement('test', () => {}))
        .rejects.toThrow('Transport has been destroyed');
    });
  });
});
