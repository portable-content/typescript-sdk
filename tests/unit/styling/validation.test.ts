/**
 * @fileoverview Tests for styling validation
 */

import {
  validateAdapter,
  validateCapabilities,
  testAdapter,
  validateAdapterName,
  hasCapability
} from '../../../src/styling/validation';
import { createMockAdapter } from '../../__mocks__/mock-style-adapter';
import { baseAdapter } from '../../../src/styling/adapters/base-adapter';

describe('validateAdapter', () => {
  it('should validate a correct adapter', () => {
    const adapter = createMockAdapter('test');
    const result = validateAdapter(adapter);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject non-object adapters', () => {
    const result = validateAdapter(null);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter must be an object');
  });

  it('should require name property', () => {
    const adapter = {
      theme: {},
      createStyles: () => ({}),
      combineStyles: () => ({}),
    };

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter must have a valid name property (string)');
  });

  it('should require theme property', () => {
    const adapter = {
      name: 'test',
      createStyles: () => ({}),
      combineStyles: () => ({}),
    };

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter must have a valid theme property (object)');
  });

  it('should require createStyles method', () => {
    const adapter = {
      name: 'test',
      theme: {},
      combineStyles: () => ({}),
    };

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter must implement createStyles method');
  });

  it('should require combineStyles method', () => {
    const adapter = {
      name: 'test',
      theme: {},
      createStyles: () => ({}),
    };

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter must implement combineStyles method');
  });

  it('should warn about invalid version type', () => {
    const adapter = createMockAdapter('test');
    (adapter as any).version = 123;

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Version should be a string if provided');
  });

  it('should reject empty name', () => {
    const adapter = createMockAdapter('test');
    (adapter as any).name = '';

    const result = validateAdapter(adapter);

    expect(result.valid).toBe(false);
    // The validation logic checks for empty string after checking for valid string type
    expect(result.errors).toContain('Adapter name cannot be empty');
  });
});

describe('validateCapabilities', () => {
  it('should validate correct capabilities', () => {
    const capabilities = {
      responsive: true,
      animations: false,
      variants: true,
    };

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject non-object capabilities', () => {
    const result = validateCapabilities('invalid');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Capabilities should be an object if provided');
  });

  it('should warn about unknown capabilities', () => {
    const capabilities = {
      responsive: true,
      unknownCapability: true,
    };

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Unknown capability: unknownCapability');
  });

  it('should warn about non-boolean capability values', () => {
    const capabilities = {
      responsive: 'yes',
    };

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Capability responsive should be a boolean');
  });
});

describe('testAdapter', () => {
  it('should test a working adapter', async () => {
    const adapter = baseAdapter;
    const result = await testAdapter(adapter);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch adapter errors', async () => {
    const adapter = createMockAdapter('error-adapter');
    adapter.createStyles = () => {
      throw new Error('Test error');
    };

    const result = await testAdapter(adapter);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Adapter threw error during testing: Test error');
  });
});

describe('validateAdapterName', () => {
  it('should accept valid names', () => {
    expect(validateAdapterName('test')).toBe(true);
    expect(validateAdapterName('test-adapter')).toBe(true);
    expect(validateAdapterName('adapter123')).toBe(true);
  });

  it('should reject invalid names', () => {
    expect(validateAdapterName('')).toBe(false);
    expect(validateAdapterName('Test')).toBe(false); // uppercase
    expect(validateAdapterName('test_adapter')).toBe(false); // underscore
    expect(validateAdapterName('test adapter')).toBe(false); // space
  });
});

describe('hasCapability', () => {
  it('should detect supported capabilities', () => {
    const adapter = createMockAdapter('test');
    
    expect(hasCapability(adapter, 'responsive')).toBe(true);
    expect(hasCapability(adapter, 'animations')).toBe(true);
  });

  it('should return false for unsupported capabilities', () => {
    const adapter = baseAdapter;
    
    expect(hasCapability(adapter, 'responsive')).toBe(false);
    expect(hasCapability(adapter, 'animations')).toBe(false);
  });

  it('should return false when no capabilities defined', () => {
    const adapter = createMockAdapter('no-caps');
    delete (adapter as any).capabilities;

    expect(hasCapability(adapter, 'responsive')).toBe(false);
  });
});
