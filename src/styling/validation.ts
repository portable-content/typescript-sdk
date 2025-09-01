/**
 * @fileoverview Validation utilities for styling adapters
 */

import type { StyleAdapter, StyleCapabilities } from '../types/styling';

/**
 * Result of adapter validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that an object implements the StyleAdapter interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateAdapter(adapter: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check if adapter is an object
  if (!adapter || typeof adapter !== 'object') {
    result.errors.push('Adapter must be an object');
    result.valid = false;
    return result;
  }

  // Required properties
  if (typeof adapter.name !== 'string') {
    result.errors.push('Adapter must have a valid name property (string)');
    result.valid = false;
  } else if (adapter.name.length === 0) {
    result.errors.push('Adapter name cannot be empty');
    result.valid = false;
  }

  if (!adapter.theme || typeof adapter.theme !== 'object') {
    result.errors.push('Adapter must have a valid theme property (object)');
    result.valid = false;
  }

  if (!adapter.createStyles || typeof adapter.createStyles !== 'function') {
    result.errors.push('Adapter must implement createStyles method');
    result.valid = false;
  }

  if (!adapter.combineStyles || typeof adapter.combineStyles !== 'function') {
    result.errors.push('Adapter must implement combineStyles method');
    result.valid = false;
  }

  // Optional properties validation
  if (adapter.version !== undefined && typeof adapter.version !== 'string') {
    result.warnings.push('Version should be a string if provided');
  }

  if (adapter.capabilities !== undefined) {
    const capabilityResult = validateCapabilities(adapter.capabilities);
    result.warnings.push(...capabilityResult.warnings);
    if (!capabilityResult.valid) {
      result.errors.push(...capabilityResult.errors);
      result.valid = false;
    }
  }

  // Optional lifecycle methods validation
  const lifecycleMethods = ['onMount', 'onUnmount', 'onThemeChange'];
  for (const method of lifecycleMethods) {
    if (adapter[method] !== undefined && typeof adapter[method] !== 'function') {
      result.warnings.push(`${method} should be a function if provided`);
    }
  }

  // Optional advanced methods validation
  const advancedMethods = ['createResponsiveStyles', 'createAnimatedStyles', 'createVariantStyles'];
  for (const method of advancedMethods) {
    if (adapter[method] !== undefined && typeof adapter[method] !== 'function') {
      result.warnings.push(`${method} should be a function if provided`);
    }
  }

  return result;
}

/**
 * Validate style capabilities object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateCapabilities(capabilities: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (typeof capabilities !== 'object' || capabilities === null) {
    result.errors.push('Capabilities should be an object if provided');
    result.valid = false;
    return result;
  }

  const validCapabilities = [
    'responsive',
    'animations',
    'variants',
    'darkMode',
    'customProperties',
  ];
  const providedCapabilities = Object.keys(capabilities);

  for (const key of providedCapabilities) {
    if (!validCapabilities.includes(key)) {
      result.warnings.push(`Unknown capability: ${key}`);
    } else if (typeof capabilities[key] !== 'boolean') {
      result.warnings.push(`Capability ${key} should be a boolean`);
    }
  }

  return result;
}

/**
 * Test basic adapter functionality
 */
export async function testAdapter(adapter: StyleAdapter): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // First validate the interface
  const interfaceResult = validateAdapter(adapter);
  result.errors.push(...interfaceResult.errors);
  result.warnings.push(...interfaceResult.warnings);

  if (!interfaceResult.valid) {
    result.valid = false;
    return result;
  }

  try {
    // Test basic style creation
    const testStyles = {
      container: {
        backgroundColor: '#ffffff',
        padding: 16,
      },
      text: {
        fontSize: 16,
        color: '#000000',
      },
    };

    const createdStyles = adapter.createStyles(testStyles);
    if (createdStyles === undefined || createdStyles === null) {
      result.errors.push('createStyles returned null or undefined');
      result.valid = false;
    }

    // Test style combination
    const style1 = { backgroundColor: 'red' };
    const style2 = { padding: 10 };

    const combined = adapter.combineStyles(style1, style2);
    if (combined === undefined || combined === null) {
      result.errors.push('combineStyles returned null or undefined');
      result.valid = false;
    }

    // Test with null/undefined styles
    const combinedWithNulls = adapter.combineStyles(style1, null, undefined, style2);
    if (combinedWithNulls === undefined || combinedWithNulls === null) {
      result.warnings.push('combineStyles should handle null/undefined gracefully');
    }
  } catch (error) {
    result.errors.push(
      `Adapter threw error during testing: ${error instanceof Error ? error.message : String(error)}`
    );
    result.valid = false;
  }

  return result;
}

/**
 * Validate adapter name format
 */
export function validateAdapterName(name: string): boolean {
  // Adapter names should be lowercase, alphanumeric with hyphens
  const nameRegex = /^[a-z0-9-]+$/;
  return nameRegex.test(name) && name.length > 0 && name.length <= 50;
}

/**
 * Check if adapter supports a specific capability
 */
export function hasCapability(adapter: StyleAdapter, capability: keyof StyleCapabilities): boolean {
  return adapter.capabilities?.[capability] === true;
}

/**
 * Get all supported capabilities from an adapter
 */
export function getSupportedCapabilities(adapter: StyleAdapter): (keyof StyleCapabilities)[] {
  if (!adapter.capabilities) {
    return [];
  }

  return Object.entries(adapter.capabilities)
    .filter(([_, supported]) => supported === true)
    .map(([capability]) => capability as keyof StyleCapabilities);
}
