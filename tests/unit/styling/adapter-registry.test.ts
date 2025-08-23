/**
 * @fileoverview Tests for adapter registry
 */

import { AdapterRegistry, adapterRegistry, registerAdapter, getAdapter } from '../../../src/styling/adapter-registry';
import { createMockAdapter } from '../../../src/styling/adapters/mock-adapter';

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  describe('register and get', () => {
    it('should register and retrieve adapters', () => {
      const adapter = createMockAdapter('test-adapter');
      registry.register(adapter);

      const retrieved = registry.get('test-adapter');
      expect(retrieved).toBe(adapter);
    });

    it('should return undefined for non-existent adapters', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered adapters', () => {
      const adapter = createMockAdapter('test-adapter');
      registry.register(adapter);

      expect(registry.has('test-adapter')).toBe(true);
    });

    it('should return false for non-registered adapters', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove registered adapters', () => {
      const adapter = createMockAdapter('test-adapter');
      registry.register(adapter);

      expect(registry.has('test-adapter')).toBe(true);
      registry.unregister('test-adapter');
      expect(registry.has('test-adapter')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all registered adapters', () => {
      const adapter1 = createMockAdapter('adapter1');
      const adapter2 = createMockAdapter('adapter2');

      registry.register(adapter1);
      registry.register(adapter2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(adapter1);
      expect(all).toContain(adapter2);
    });

    it('should return empty array when no adapters registered', () => {
      const all = registry.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('getNames', () => {
    it('should return all adapter names', () => {
      const adapter1 = createMockAdapter('adapter1');
      const adapter2 = createMockAdapter('adapter2');

      registry.register(adapter1);
      registry.register(adapter2);

      const names = registry.getNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('adapter1');
      expect(names).toContain('adapter2');
    });
  });

  describe('clear', () => {
    it('should remove all adapters', () => {
      const adapter1 = createMockAdapter('adapter1');
      const adapter2 = createMockAdapter('adapter2');

      registry.register(adapter1);
      registry.register(adapter2);

      expect(registry.getAll()).toHaveLength(2);
      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
    });
  });
});

describe('Global registry functions', () => {
  beforeEach(() => {
    adapterRegistry.clear();
  });

  afterEach(() => {
    adapterRegistry.clear();
  });

  it('should work with global registry', () => {
    const adapter = createMockAdapter('global-test');
    
    registerAdapter(adapter);
    expect(getAdapter('global-test')).toBe(adapter);
  });
});
