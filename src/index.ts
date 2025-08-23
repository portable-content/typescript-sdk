/**
 * @fileoverview Main entry point for the Portable Content TypeScript SDK
 * 
 * This SDK provides framework-agnostic tools for working with the Portable Content System,
 * including data models, API clients, and rendering utilities.
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

// Version information
export const VERSION = '0.2.0';
