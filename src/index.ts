/**
 * @fileoverview Main entry point for the Portable Content TypeScript SDK
 *
 * This SDK provides framework-agnostic tools for working with the Portable Content System,
 * including data models, API clients, rendering utilities, and event-driven capabilities.
 *
 * Updated for Element-based architecture with event system support.
 */

// Core types and interfaces
export * from './types';

// API client and transport
export * from './client';

// Rendering utilities
export * from './rendering';

// Validation utilities
export * from './validation';

// Utility functions
export * from './utils';

// Styling utilities
export * from './styling';

// Event system
export * from './events';

// Transport layer
export * from './transport';

// Transport layer (will be implemented in Phase 2)
// export * from './transport';

// Framework integrations (will be implemented in Phase 3)
// export * from './integrations';

// Version information
export const VERSION = '0.3.0-alpha.1';
