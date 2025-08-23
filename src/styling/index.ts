/**
 * @fileoverview Styling utilities and adapters for the Portable Content System
 */

export * from './adapter-registry';
export * from './theme-utils';
export * from './adapters';

// Export styling validation with specific names to avoid conflicts
export {
  validateAdapter as validateStyleAdapter,
  validateCapabilities as validateStyleCapabilities,
  testAdapter as testStyleAdapter,
  validateAdapterName,
  hasCapability,
  getSupportedCapabilities,
  type ValidationResult as StyleValidationResult,
} from './validation';
