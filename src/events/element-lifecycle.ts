/**
 * @fileoverview Element lifecycle management with event-driven state tracking
 */

import type { Element, ElementContent, ElementMetadata } from '../types/core';
import type { ElementEvent, ElementEventResult, UnsubscribeFunction } from '../types/events';
import { EventManager } from './event-manager';

/**
 * Element lifecycle states
 */
export type ElementLifecycleState =
  | 'created' // Element created but not registered
  | 'registered' // Element registered with event system
  | 'active' // Element actively receiving updates
  | 'suspended' // Element temporarily suspended from updates
  | 'updating' // Element currently being updated
  | 'error' // Element in error state
  | 'destroyed'; // Element destroyed and cleaned up

/**
 * Element lifecycle event types
 */
export type ElementLifecycleEventType =
  | 'created'
  | 'registered'
  | 'activated'
  | 'suspended'
  | 'updated'
  | 'error'
  | 'destroyed';

/**
 * Element lifecycle event data
 */
export interface ElementLifecycleEvent {
  elementId: string;
  eventType: ElementLifecycleEventType;
  previousState?: ElementLifecycleState;
  newState: ElementLifecycleState;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Element lifecycle callback
 */
export interface ElementLifecycleCallback {
  (event: ElementLifecycleEvent): void | Promise<void>;
}

/**
 * Element update options
 */
export interface ElementUpdateOptions {
  /** Whether to validate content before updating */
  validate?: boolean;
  /** Whether to trigger transforms after update */
  triggerTransforms?: boolean;
  /** Whether to persist the change */
  persist?: boolean;
  /** Custom metadata for the update */
  metadata?: Record<string, unknown>;
}

/**
 * Element lifecycle manager for tracking element states and updates
 */
export class ElementLifecycleManager {
  private readonly eventManager: EventManager;
  private readonly elementStates = new Map<string, ElementLifecycleState>();
  private readonly lifecycleCallbacks = new Set<ElementLifecycleCallback>();
  private readonly elementUpdateCallbacks = new Map<string, Set<(element: Element) => void>>();
  private isDestroyed = false;

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  /**
   * Create a new element and register it with the lifecycle manager
   */
  async createElement(
    id: string,
    kind: Element['kind'],
    content: ElementContent,
    metadata?: ElementMetadata
  ): Promise<Element> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const element: Element = {
      id,
      kind,
      content,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Set initial state
    this.elementStates.set(id, 'created');
    this.emitLifecycleEvent({
      elementId: id,
      eventType: 'created',
      newState: 'created',
      timestamp: Date.now(),
    });

    return element;
  }

  /**
   * Register an element with the event system
   */
  async registerElement(element: Element): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const currentState = this.elementStates.get(element.id);
    if (currentState === 'registered' || currentState === 'active') {
      return; // Already registered
    }

    // Register with event manager
    this.eventManager.registerElement(element);

    // Update state
    this.updateElementState(element.id, 'registered');
  }

  /**
   * Activate an element for receiving updates
   */
  async activateElement(elementId: string): Promise<boolean> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const currentState = this.elementStates.get(elementId);
    if (!currentState || currentState === 'destroyed') {
      return false;
    }

    if (currentState === 'active') {
      return true; // Already active
    }

    this.updateElementState(elementId, 'active');
    return true;
  }

  /**
   * Suspend an element from receiving updates
   */
  async suspendElement(elementId: string): Promise<boolean> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const currentState = this.elementStates.get(elementId);
    if (!currentState || currentState === 'destroyed') {
      return false;
    }

    this.updateElementState(elementId, 'suspended');
    return true;
  }

  /**
   * Update an element's content
   */
  async updateElementContent(
    elementId: string,
    content: Partial<ElementContent>,
    options: ElementUpdateOptions = {}
  ): Promise<ElementEventResult> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const currentState = this.elementStates.get(elementId);
    if (!currentState || currentState === 'destroyed' || currentState === 'suspended') {
      return {
        success: false,
        elementId,
        errors: [`Element ${elementId} is not available for updates (state: ${currentState})`],
      };
    }

    // Set updating state
    this.updateElementState(elementId, 'updating');

    try {
      // Send update event
      const event: ElementEvent = {
        elementId,
        elementType: this.getElementType(elementId),
        eventType: 'updatePayload',
        data: {
          payload: content.primary
            ? {
                ...content.primary,
                type: content.primary.type || 'inline',
                mediaType: content.primary.mediaType || 'text/plain',
              }
            : undefined,
          ...options.metadata,
        },
        metadata: {
          timestamp: Date.now(),
          source: 'api',
          priority: 'normal',
          ...options.metadata,
        },
        persistChange: options.persist,
        triggerTransforms: options.triggerTransforms,
        validateFirst: options.validate,
      };

      const result = await this.eventManager.sendEvent(event);

      if (result.success) {
        this.updateElementState(elementId, 'active');
        this.emitLifecycleEvent({
          elementId,
          eventType: 'updated',
          newState: 'active',
          previousState: 'updating',
          timestamp: Date.now(),
          metadata: options.metadata,
        });
      } else {
        this.updateElementState(elementId, 'error');
      }

      return result;
    } catch (error) {
      this.updateElementState(elementId, 'error');
      return {
        success: false,
        elementId,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Update an element's properties
   */
  async updateElementProperties(
    elementId: string,
    properties: Record<string, unknown>,
    options: ElementUpdateOptions = {}
  ): Promise<ElementEventResult> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const event: ElementEvent = {
      elementId,
      elementType: this.getElementType(elementId),
      eventType: 'updateProps',
      data: {
        props: properties,
      },
      metadata: {
        timestamp: Date.now(),
        source: 'api',
        priority: 'normal',
        ...options.metadata,
      },
      persistChange: options.persist,
    };

    return await this.eventManager.sendEvent(event);
  }

  /**
   * Destroy an element and clean up resources
   */
  async destroyElement(elementId: string): Promise<boolean> {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    const currentState = this.elementStates.get(elementId);
    if (!currentState || currentState === 'destroyed') {
      return false;
    }

    // Unregister from event manager
    this.eventManager.unregisterElement(elementId);

    // Clean up callbacks
    this.elementUpdateCallbacks.delete(elementId);

    // Update state
    this.updateElementState(elementId, 'destroyed');

    return true;
  }

  /**
   * Get the current state of an element
   */
  getElementState(elementId: string): ElementLifecycleState | undefined {
    return this.elementStates.get(elementId);
  }

  /**
   * Get all elements in a specific state
   */
  getElementsByState(state: ElementLifecycleState): string[] {
    const elements: string[] = [];
    for (const [elementId, elementState] of this.elementStates.entries()) {
      if (elementState === state) {
        elements.push(elementId);
      }
    }
    return elements;
  }

  /**
   * Subscribe to lifecycle events
   */
  subscribeToLifecycle(callback: ElementLifecycleCallback): UnsubscribeFunction {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    this.lifecycleCallbacks.add(callback);

    return () => {
      this.lifecycleCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to element updates
   */
  subscribeToElementUpdates(
    elementId: string,
    callback: (element: Element) => void
  ): UnsubscribeFunction {
    if (this.isDestroyed) {
      throw new Error('ElementLifecycleManager has been destroyed');
    }

    let callbacks = this.elementUpdateCallbacks.get(elementId);
    if (!callbacks) {
      callbacks = new Set();
      this.elementUpdateCallbacks.set(elementId, callbacks);
    }

    callbacks.add(callback);

    return () => {
      const cbs = this.elementUpdateCallbacks.get(elementId);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          this.elementUpdateCallbacks.delete(elementId);
        }
      }
    };
  }

  /**
   * Get lifecycle statistics
   */
  getLifecycleStats(): Record<ElementLifecycleState, number> {
    const stats: Record<ElementLifecycleState, number> = {
      created: 0,
      registered: 0,
      active: 0,
      suspended: 0,
      updating: 0,
      error: 0,
      destroyed: 0,
    };

    for (const state of this.elementStates.values()) {
      stats[state]++;
    }

    return stats;
  }

  /**
   * Destroy the lifecycle manager and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.elementStates.clear();
    this.lifecycleCallbacks.clear();
    this.elementUpdateCallbacks.clear();
  }

  /**
   * Update element state and emit lifecycle event
   */
  private updateElementState(elementId: string, newState: ElementLifecycleState): void {
    const previousState = this.elementStates.get(elementId);
    this.elementStates.set(elementId, newState);

    this.emitLifecycleEvent({
      elementId,
      eventType: this.getLifecycleEventType(newState),
      previousState,
      newState,
      timestamp: Date.now(),
    });
  }

  /**
   * Emit a lifecycle event to all subscribers
   */
  private emitLifecycleEvent(event: ElementLifecycleEvent): void {
    for (const callback of this.lifecycleCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in lifecycle callback:', error);
      }
    }
  }

  /**
   * Get lifecycle event type from state
   */
  private getLifecycleEventType(state: ElementLifecycleState): ElementLifecycleEventType {
    switch (state) {
      case 'created':
        return 'created';
      case 'registered':
        return 'registered';
      case 'active':
        return 'activated';
      case 'suspended':
        return 'suspended';
      case 'updating':
        return 'updated';
      case 'error':
        return 'error';
      case 'destroyed':
        return 'destroyed';
      default:
        return 'updated';
    }
  }

  /**
   * Get element type from event manager
   */
  private getElementType(elementId: string): Element['kind'] {
    const element = this.eventManager.getElement(elementId);
    return element?.kind || 'markdown'; // Default fallback
  }
}
