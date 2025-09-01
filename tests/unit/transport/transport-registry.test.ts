/**
 * @fileoverview Tests for transport registry functionality
 */

import {
  DefaultTransportRegistry,
  MockTransportFactory,
  transportRegistry,
  createTransport,
  registerTransportFactory,
  isTransportSupported
} from '../../../src/transport/transport-registry';
import { MockTransport } from '../../../src/transport/mock-transport';
import type { TransportFactory, Transport, TransportConnectionOptions } from '../../../src/transport/transport-interface';

describe('MockTransportFactory', () => {
  let factory: MockTransportFactory;

  beforeEach(() => {
    factory = new MockTransportFactory();
  });

  it('should have correct name and supported protocols', () => {
    expect(factory.name).toBe('mock');
    expect(factory.supportedProtocols).toEqual(['mock', 'test']);
  });

  it('should create MockTransport instance', () => {
    const transport = factory.create('mock://test');
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should support mock:// URLs', () => {
    expect(factory.supports('mock://test')).toBe(true);
    expect(factory.supports('mock://localhost:8080')).toBe(true);
  });

  it('should support test:// URLs', () => {
    expect(factory.supports('test://example')).toBe(true);
    expect(factory.supports('test://localhost')).toBe(true);
  });

  it('should not support other protocols', () => {
    expect(factory.supports('http://example.com')).toBe(false);
    expect(factory.supports('ws://localhost:8080')).toBe(false);
    expect(factory.supports('invalid-url')).toBe(false);
  });

  it('should create transport with options', () => {
    const options = { timeout: 5000 };
    const transport = factory.create('mock://test', options);
    expect(transport).toBeInstanceOf(MockTransport);
  });
});

describe('DefaultTransportRegistry', () => {
  let registry: DefaultTransportRegistry;

  beforeEach(() => {
    registry = new DefaultTransportRegistry();
  });

  it('should register mock transport factory by default', () => {
    const factories = registry.getRegisteredFactories();
    expect(factories).toContain('mock');
  });

  it('should register new transport factory', () => {
    const customFactory: TransportFactory = {
      name: 'custom',
      supportedProtocols: ['custom'],
      create: () => new MockTransport(),
      supports: (url: string) => url.startsWith('custom://')
    };

    registry.register(customFactory);
    const factories = registry.getRegisteredFactories();
    expect(factories).toContain('custom');
  });

  it('should unregister transport factory', () => {
    const customFactory: TransportFactory = {
      name: 'custom',
      supportedProtocols: ['custom'],
      create: () => new MockTransport(),
      supports: (url: string) => url.startsWith('custom://')
    };

    registry.register(customFactory);
    expect(registry.getRegisteredFactories()).toContain('custom');

    const result = registry.unregister('custom');
    expect(result).toBe(true);
    expect(registry.getRegisteredFactories()).not.toContain('custom');
  });

  it('should return false when unregistering non-existent factory', () => {
    const result = registry.unregister('non-existent');
    expect(result).toBe(false);
  });

  it('should create transport for supported URL', () => {
    const transport = registry.create('mock://test');
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should return null for unsupported URL', () => {
    const transport = registry.create('unsupported://test');
    expect(transport).toBeNull();
  });

  it('should create transport with options', () => {
    const options = { timeout: 5000 };
    const transport = registry.create('mock://test', options);
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should check if URL is supported', () => {
    expect(registry.supports('mock://test')).toBe(true);
    expect(registry.supports('test://example')).toBe(true);
    expect(registry.supports('unsupported://test')).toBe(false);
  });

  it('should prioritize first matching factory', () => {
    const customFactory: TransportFactory = {
      name: 'custom-mock',
      supportedProtocols: ['mock'],
      create: () => {
        const transport = new MockTransport();
        (transport as any).isCustom = true;
        return transport;
      },
      supports: (url: string) => url.startsWith('mock://')
    };

    registry.register(customFactory);
    
    // Should use the first registered factory (mock factory, not custom)
    const transport = registry.create('mock://test');
    expect(transport).toBeInstanceOf(MockTransport);
    expect((transport as any).isCustom).toBeUndefined();
  });
});

describe('Global transport registry functions', () => {
  beforeEach(() => {
    // Reset global registry to clean state
    const factories = transportRegistry.getRegisteredFactories();
    factories.forEach(name => {
      if (name !== 'mock') {
        transportRegistry.unregister(name);
      }
    });
  });

  it('should create transport using global registry', () => {
    const transport = createTransport('mock://test');
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should return null for unsupported URL', () => {
    const transport = createTransport('unsupported://test');
    expect(transport).toBeNull();
  });

  it('should create transport with options', () => {
    const options = { timeout: 5000 };
    const transport = createTransport('mock://test', options);
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should register factory with global registry', () => {
    const customFactory: TransportFactory = {
      name: 'global-custom',
      supportedProtocols: ['global'],
      create: () => new MockTransport(),
      supports: (url: string) => url.startsWith('global://')
    };

    registerTransportFactory(customFactory);
    
    const factories = transportRegistry.getRegisteredFactories();
    expect(factories).toContain('global-custom');
    
    const transport = createTransport('global://test');
    expect(transport).toBeInstanceOf(MockTransport);
  });

  it('should check if transport is supported', () => {
    expect(isTransportSupported('mock://test')).toBe(true);
    expect(isTransportSupported('test://example')).toBe(true);
    expect(isTransportSupported('unsupported://test')).toBe(false);
  });

  it('should support newly registered transport', () => {
    const customFactory: TransportFactory = {
      name: 'websocket',
      supportedProtocols: ['ws', 'wss'],
      create: () => new MockTransport(),
      supports: (url: string) => url.startsWith('ws://') || url.startsWith('wss://')
    };

    registerTransportFactory(customFactory);
    
    expect(isTransportSupported('ws://localhost:8080')).toBe(true);
    expect(isTransportSupported('wss://secure.example.com')).toBe(true);
  });
});

describe('Transport registry edge cases', () => {
  let registry: DefaultTransportRegistry;

  beforeEach(() => {
    registry = new DefaultTransportRegistry();
  });

  it('should handle empty URL', () => {
    expect(registry.supports('')).toBe(false);
    expect(registry.create('')).toBeNull();
  });

  it('should handle malformed URLs', () => {
    expect(registry.supports('not-a-url')).toBe(false);
    expect(registry.create('not-a-url')).toBeNull();
  });

  it('should handle factory that throws during creation', () => {
    const faultyFactory: TransportFactory = {
      name: 'faulty',
      supportedProtocols: ['faulty'],
      create: () => {
        throw new Error('Factory creation failed');
      },
      supports: (url: string) => url.startsWith('faulty://')
    };

    registry.register(faultyFactory);
    
    expect(() => registry.create('faulty://test')).toThrow('Factory creation failed');
  });

  it('should handle factory with undefined supports method result', () => {
    const undefinedFactory: TransportFactory = {
      name: 'undefined',
      supportedProtocols: ['undefined'],
      create: () => new MockTransport(),
      supports: () => undefined as any
    };

    registry.register(undefinedFactory);
    
    expect(registry.supports('undefined://test')).toBe(false);
    expect(registry.create('undefined://test')).toBeNull();
  });
});
