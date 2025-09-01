/**
 * @fileoverview Transport registry for managing transport factories
 */

import type {
  Transport,
  TransportFactory,
  TransportRegistry,
  TransportConnectionOptions,
} from './transport-interface';
import { MockTransport } from './mock-transport';

/**
 * Mock transport factory
 */
export class MockTransportFactory implements TransportFactory {
  readonly name = 'mock';
  readonly supportedProtocols = ['mock', 'test'];

  create(_url: string, _options?: TransportConnectionOptions): Transport {
    return new MockTransport();
  }

  supports(url: string): boolean {
    return url.startsWith('mock://') || url.startsWith('test://');
  }
}

/**
 * Default transport registry implementation
 */
export class DefaultTransportRegistry implements TransportRegistry {
  private factories = new Map<string, TransportFactory>();

  constructor() {
    // Register default mock transport
    this.register(new MockTransportFactory());
  }

  /**
   * Register a transport factory
   */
  register(factory: TransportFactory): void {
    this.factories.set(factory.name, factory);
  }

  /**
   * Unregister a transport factory
   */
  unregister(name: string): boolean {
    return this.factories.delete(name);
  }

  /**
   * Create a transport for a given URL
   */
  create(url: string, options?: TransportConnectionOptions): Transport | null {
    for (const factory of this.factories.values()) {
      if (factory.supports(url)) {
        return factory.create(url, options);
      }
    }
    return null;
  }

  /**
   * Get all registered factory names
   */
  getRegisteredFactories(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Check if a URL is supported by any registered factory
   */
  supports(url: string): boolean {
    for (const factory of this.factories.values()) {
      if (factory.supports(url)) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Global transport registry instance
 */
export const transportRegistry = new DefaultTransportRegistry();

/**
 * Create a transport from a URL
 */
export function createTransport(url: string, options?: TransportConnectionOptions): Transport | null {
  return transportRegistry.create(url, options);
}

/**
 * Register a transport factory with the global registry
 */
export function registerTransportFactory(factory: TransportFactory): void {
  transportRegistry.register(factory);
}

/**
 * Check if a transport URL is supported
 */
export function isTransportSupported(url: string): boolean {
  return transportRegistry.supports(url);
}
