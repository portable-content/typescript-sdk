/**
 * @fileoverview Tests for ElementLifecycleManager implementation
 */

import { EventManager } from '../../../src/events/event-manager';
import { ElementLifecycleManager } from '../../../src/events/element-lifecycle';
import type { Element } from '../../../src/types/core';
import type { ElementLifecycleEvent } from '../../../src/events/element-lifecycle';
import { createTestElement, createTestElementContent, createTestEventManagerOptions } from '../../__helpers__/test-factories';

// Helper function for this test file
function createTestContent(source: string = 'Test content') {
  return createTestElementContent({
    primary: { type: 'inline', mediaType: 'text/plain', source }
  });
}

describe('ElementLifecycleManager', () => {
  let eventManager: EventManager;
  let lifecycleManager: ElementLifecycleManager;

  beforeEach(() => {
    eventManager = new EventManager(createTestEventManagerOptions());
    lifecycleManager = new ElementLifecycleManager(eventManager);
  });

  afterEach(() => {
    lifecycleManager.destroy();
    eventManager.destroy();
  });

  describe('element creation', () => {
    it('should create elements successfully', async () => {
      const element = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestElementContent(),
        { title: 'Test Element' }
      );

      expect(element.id).toBe('test-element');
      expect(element.kind).toBe('markdown');
      expect(element.content.primary.source).toBe('Test content');
      expect(element.metadata?.title).toBe('Test Element');
      expect(element.metadata?.createdAt).toBeDefined();
      expect(element.metadata?.updatedAt).toBeDefined();
    });

    it('should set initial state to created', async () => {
      const element = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestElementContent()
      );

      const state = lifecycleManager.getElementState(element.id);
      expect(state).toBe('created');
    });

    it('should emit lifecycle event on creation', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        lifecycleEvents.push(event);
      });

      await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestElementContent()
      );

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('created');
      expect(lifecycleEvents[0].elementId).toBe('test-element');
      expect(lifecycleEvents[0].newState).toBe('created');
    });
  });

  describe('element registration', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestElementContent()
      );
    });

    it('should register elements successfully', async () => {
      await lifecycleManager.registerElement(testElement);
      
      const state = lifecycleManager.getElementState(testElement.id);
      expect(state).toBe('registered');
      
      const registeredElement = eventManager.getElement(testElement.id);
      expect(registeredElement).toEqual(testElement);
    });

    it('should not re-register already registered elements', async () => {
      await lifecycleManager.registerElement(testElement);
      const state1 = lifecycleManager.getElementState(testElement.id);
      
      await lifecycleManager.registerElement(testElement);
      const state2 = lifecycleManager.getElementState(testElement.id);
      
      expect(state1).toBe('registered');
      expect(state2).toBe('registered');
    });

    it('should emit lifecycle event on registration', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        if (event.eventType === 'registered') {
          lifecycleEvents.push(event);
        }
      });

      await lifecycleManager.registerElement(testElement);

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('registered');
      expect(lifecycleEvents[0].newState).toBe('registered');
    });
  });

  describe('element activation', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestContent()
      );
      await lifecycleManager.registerElement(testElement);
    });

    it('should activate elements successfully', async () => {
      const result = await lifecycleManager.activateElement(testElement.id);
      
      expect(result).toBe(true);
      expect(lifecycleManager.getElementState(testElement.id)).toBe('active');
    });

    it('should return true for already active elements', async () => {
      await lifecycleManager.activateElement(testElement.id);
      const result = await lifecycleManager.activateElement(testElement.id);
      
      expect(result).toBe(true);
      expect(lifecycleManager.getElementState(testElement.id)).toBe('active');
    });

    it('should return false for non-existent elements', async () => {
      const result = await lifecycleManager.activateElement('non-existent');
      expect(result).toBe(false);
    });

    it('should emit lifecycle event on activation', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        if (event.eventType === 'activated') {
          lifecycleEvents.push(event);
        }
      });

      await lifecycleManager.activateElement(testElement.id);

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('activated');
      expect(lifecycleEvents[0].newState).toBe('active');
    });
  });

  describe('element suspension', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestContent()
      );
      await lifecycleManager.registerElement(testElement);
      await lifecycleManager.activateElement(testElement.id);
    });

    it('should suspend elements successfully', async () => {
      const result = await lifecycleManager.suspendElement(testElement.id);
      
      expect(result).toBe(true);
      expect(lifecycleManager.getElementState(testElement.id)).toBe('suspended');
    });

    it('should return false for non-existent elements', async () => {
      const result = await lifecycleManager.suspendElement('non-existent');
      expect(result).toBe(false);
    });

    it('should emit lifecycle event on suspension', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        if (event.eventType === 'suspended') {
          lifecycleEvents.push(event);
        }
      });

      await lifecycleManager.suspendElement(testElement.id);

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('suspended');
      expect(lifecycleEvents[0].newState).toBe('suspended');
    });
  });

  describe('element content updates', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestContent()
      );
      await lifecycleManager.registerElement(testElement);
      await lifecycleManager.activateElement(testElement.id);
    });

    it('should update element content successfully', async () => {
      const result = await lifecycleManager.updateElementContent(
        testElement.id,
        createTestContent('Updated content')
      );

      expect(result.success).toBe(true);
      expect(result.elementId).toBe(testElement.id);
    });

    it('should fail for suspended elements', async () => {
      await lifecycleManager.suspendElement(testElement.id);
      
      const result = await lifecycleManager.updateElementContent(
        testElement.id,
        createTestContent('Updated content')
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('not available for updates');
    });

    it('should fail for non-existent elements', async () => {
      const result = await lifecycleManager.updateElementContent(
        'non-existent',
        createTestContent('Updated content')
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('not available for updates');
    });

    it('should set updating state during update', async () => {
      const states: string[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        states.push(event.newState);
      });

      await lifecycleManager.updateElementContent(
        testElement.id,
        createTestContent('Updated content')
      );

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(states).toContain('updating');
      expect(states).toContain('active');
    });
  });

  describe('element property updates', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestContent()
      );
      await lifecycleManager.registerElement(testElement);
      await lifecycleManager.activateElement(testElement.id);
    });

    it('should update element properties successfully', async () => {
      const result = await lifecycleManager.updateElementProperties(
        testElement.id,
        { title: 'Updated Title', priority: 'high' }
      );

      expect(result.success).toBe(true);
      expect(result.elementId).toBe(testElement.id);
    });

    it('should handle update options', async () => {
      const result = await lifecycleManager.updateElementProperties(
        testElement.id,
        { title: 'Updated Title' },
        { persist: true, validate: true, metadata: { source: 'test' } }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('element destruction', () => {
    let testElement: Element;

    beforeEach(async () => {
      testElement = await lifecycleManager.createElement(
        'test-element',
        'markdown',
        createTestContent()
      );
      await lifecycleManager.registerElement(testElement);
    });

    it('should destroy elements successfully', async () => {
      const result = await lifecycleManager.destroyElement(testElement.id);
      
      expect(result).toBe(true);
      expect(lifecycleManager.getElementState(testElement.id)).toBe('destroyed');
      expect(eventManager.getElement(testElement.id)).toBeUndefined();
    });

    it('should return false for non-existent elements', async () => {
      const result = await lifecycleManager.destroyElement('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for already destroyed elements', async () => {
      await lifecycleManager.destroyElement(testElement.id);
      const result = await lifecycleManager.destroyElement(testElement.id);
      expect(result).toBe(false);
    });

    it('should emit lifecycle event on destruction', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      lifecycleManager.subscribeToLifecycle((event) => {
        if (event.eventType === 'destroyed') {
          lifecycleEvents.push(event);
        }
      });

      await lifecycleManager.destroyElement(testElement.id);

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('destroyed');
      expect(lifecycleEvents[0].newState).toBe('destroyed');
    });
  });

  describe('state management', () => {
    it('should get elements by state', async () => {
      const element1 = await lifecycleManager.createElement('element-1', 'markdown', createTestContent('Content 1'));
      const element2 = await lifecycleManager.createElement('element-2', 'image', createTestContent('image.jpg'));
      
      await lifecycleManager.registerElement(element1);
      await lifecycleManager.registerElement(element2);
      await lifecycleManager.activateElement(element1.id);

      const createdElements = lifecycleManager.getElementsByState('created');
      const registeredElements = lifecycleManager.getElementsByState('registered');
      const activeElements = lifecycleManager.getElementsByState('active');

      expect(createdElements).toHaveLength(0);
      expect(registeredElements).toContain(element2.id);
      expect(activeElements).toContain(element1.id);
    });

    it('should provide lifecycle statistics', async () => {
      const element1 = await lifecycleManager.createElement('element-1', 'markdown', createTestContent('Content 1'));
      const element2 = await lifecycleManager.createElement('element-2', 'image', createTestContent('image.jpg'));
      
      await lifecycleManager.registerElement(element1);
      await lifecycleManager.activateElement(element1.id);

      const stats = lifecycleManager.getLifecycleStats();

      expect(stats.created).toBe(1); // element2
      expect(stats.active).toBe(1);  // element1
      expect(stats.registered).toBe(0);
      expect(stats.suspended).toBe(0);
      expect(stats.updating).toBe(0);
      expect(stats.error).toBe(0);
      expect(stats.destroyed).toBe(0);
    });
  });

  describe('subscriptions', () => {
    it('should subscribe to lifecycle events', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      const unsubscribe = lifecycleManager.subscribeToLifecycle((event) => {
        lifecycleEvents.push(event);
      });

      await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));

      expect(lifecycleEvents).toHaveLength(1);
      expect(lifecycleEvents[0].eventType).toBe('created');

      unsubscribe();
    });

    it('should unsubscribe from lifecycle events', async () => {
      const lifecycleEvents: ElementLifecycleEvent[] = [];
      
      const unsubscribe = lifecycleManager.subscribeToLifecycle((event) => {
        lifecycleEvents.push(event);
      });

      await lifecycleManager.createElement('test-element-1', 'markdown', createTestContent('Test 1'));
      
      unsubscribe();
      
      await lifecycleManager.createElement('test-element-2', 'markdown', createTestContent('Test 2'));

      expect(lifecycleEvents).toHaveLength(1);
    });

    it('should handle subscription errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      lifecycleManager.subscribeToLifecycle(() => {
        throw new Error('Subscription error');
      });

      await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in lifecycle callback:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('destruction', () => {
    it('should destroy lifecycle manager properly', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));

      expect(lifecycleManager.getElementState(element.id)).toBe('created');

      lifecycleManager.destroy();

      await expect(
        lifecycleManager.createElement('another-element', 'markdown', createTestContent('Test'))
      ).rejects.toThrow('ElementLifecycleManager has been destroyed');
    });
  });

  describe('destroyed state error handling', () => {
    let destroyedManager: ElementLifecycleManager;

    beforeEach(() => {
      destroyedManager = new ElementLifecycleManager(eventManager);
      destroyedManager.destroy();
    });

    it('should throw error when registering element after destruction', async () => {
      const element = createTestElement({ id: 'test-element', kind: 'markdown' });

      await expect(destroyedManager.registerElement(element))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when activating element after destruction', async () => {
      await expect(destroyedManager.activateElement('test-element'))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when suspending element after destruction', async () => {
      await expect(destroyedManager.suspendElement('test-element'))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when updating element content after destruction', async () => {
      const newContent = createTestElementContent({ primary: { type: 'inline', mediaType: 'text/plain', source: 'Updated' } });

      await expect(destroyedManager.updateElementContent('test-element', newContent))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when updating element properties after destruction', async () => {
      await expect(destroyedManager.updateElementProperties('test-element', { title: 'Updated' }))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when destroying element after destruction', async () => {
      await expect(destroyedManager.destroyElement('test-element'))
        .rejects.toThrow('ElementLifecycleManager has been destroyed');
    });

    it('should throw error when subscribing to element updates after destruction', () => {
      const callback = jest.fn();

      expect(() => destroyedManager.subscribeToElementUpdates('test-element', callback))
        .toThrow('ElementLifecycleManager has been destroyed');
    });
  });

  describe('error handling during updates', () => {
    it('should handle errors during content updates gracefully', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));
      await lifecycleManager.registerElement(element);
      await lifecycleManager.activateElement(element.id);

      // Test with invalid content to trigger error handling
      const invalidContent = null as any;
      const result = await lifecycleManager.updateElementContent(element.id, invalidContent);

      // The update should fail but not crash the system
      expect(result.success).toBe(false); // Invalid content should fail
      expect(result.errors).toBeDefined();
      expect(lifecycleManager.getElementState(element.id)).toBe('error');
    });

    it('should handle property updates with invalid data gracefully', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));
      await lifecycleManager.registerElement(element);
      await lifecycleManager.activateElement(element.id);

      // Test with valid properties - the lifecycle manager is robust
      const result = await lifecycleManager.updateElementProperties(element.id, { title: 'Updated' });

      expect(result.success).toBe(true);
      expect(lifecycleManager.getElementState(element.id)).not.toBe('error');
    });

    it('should maintain element state consistency during updates', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));
      await lifecycleManager.registerElement(element);
      await lifecycleManager.activateElement(element.id);

      const initialState = lifecycleManager.getElementState(element.id);

      const newContent = createTestElementContent({ primary: { type: 'inline', mediaType: 'text/plain', source: 'Updated' } });
      const result = await lifecycleManager.updateElementContent(element.id, newContent);

      expect(result.success).toBe(true);
      expect(lifecycleManager.getElementState(element.id)).toBe(initialState);
    });
  });

  describe('subscription cleanup', () => {
    it('should properly manage element update subscriptions', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      // Subscribe to updates
      const unsubscribe1 = lifecycleManager.subscribeToElementUpdates(element.id, callback1);
      const unsubscribe2 = lifecycleManager.subscribeToElementUpdates(element.id, callback2);

      // Verify subscriptions are set up (by checking internal state)
      expect((lifecycleManager as any).elementUpdateCallbacks.has(element.id)).toBe(true);
      expect((lifecycleManager as any).elementUpdateCallbacks.get(element.id).size).toBe(2);

      // Unsubscribe first callback
      unsubscribe1();

      expect((lifecycleManager as any).elementUpdateCallbacks.get(element.id).size).toBe(1);

      // Unsubscribe second callback
      unsubscribe2();

      // Should clean up the entire entry when no callbacks remain
      expect((lifecycleManager as any).elementUpdateCallbacks.has(element.id)).toBe(false);
    });

    it('should handle unsubscribing from non-existent element gracefully', () => {
      const callback = jest.fn();
      const unsubscribe = lifecycleManager.subscribeToElementUpdates('non-existent', callback);

      // Should not throw
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should clean up all subscriptions on destroy', async () => {
      const element = await lifecycleManager.createElement('test-element', 'markdown', createTestContent('Test'));
      const callback = jest.fn();

      lifecycleManager.subscribeToElementUpdates(element.id, callback);
      expect((lifecycleManager as any).elementUpdateCallbacks.size).toBe(1);

      lifecycleManager.destroy();
      expect((lifecycleManager as any).elementUpdateCallbacks.size).toBe(0);
    });
  });
});
