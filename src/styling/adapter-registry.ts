/**
 * @fileoverview Registry system for styling adapters
 */

import type { StyleAdapter } from '../types/styling';

/**
 * Registry for managing styling adapters
 */
export class AdapterRegistry {
  private adapters = new Map<string, StyleAdapter>();

  /**
   * Register a styling adapter
   */
  register(adapter: StyleAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Get an adapter by name
   */
  get(name: string): StyleAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Get all registered adapters
   */
  getAll(): StyleAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Check if an adapter is registered
   */
  has(name: string): boolean {
    return this.adapters.has(name);
  }

  /**
   * Unregister an adapter
   */
  unregister(name: string): void {
    this.adapters.delete(name);
  }

  /**
   * Get all adapter names
   */
  getNames(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Clear all adapters
   */
  clear(): void {
    this.adapters.clear();
  }
}

/**
 * Global adapter registry instance
 */
export const adapterRegistry = new AdapterRegistry();

/**
 * Register a styling adapter globally
 */
export const registerAdapter = (adapter: StyleAdapter): void => {
  adapterRegistry.register(adapter);
};

/**
 * Get a styling adapter by name
 */
export const getAdapter = (name: string): StyleAdapter | undefined => {
  return adapterRegistry.get(name);
};

/**
 * Check if an adapter is registered
 */
export const hasAdapter = (name: string): boolean => {
  return adapterRegistry.has(name);
};

/**
 * Unregister a styling adapter
 */
export const unregisterAdapter = (name: string): void => {
  adapterRegistry.unregister(name);
};

/**
 * Get all registered adapter names
 */
export const getAdapterNames = (): string[] => {
  return adapterRegistry.getNames();
};

/**
 * Get all registered adapters
 */
export const getAllAdapters = (): StyleAdapter[] => {
  return adapterRegistry.getAll();
};
