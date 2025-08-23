/**
 * @fileoverview Capability negotiation type definitions
 */

/**
 * Client capabilities for content negotiation
 */
export interface Capabilities {
  /** Array of accepted media types (with optional quality values) */
  accept: string[];
  /** Optional hints about client preferences */
  hints?: CapabilityHints;
}

/**
 * Hints about client capabilities and preferences
 */
export interface CapabilityHints {
  /** Preferred viewport width in pixels */
  width?: number;
  /** Preferred viewport height in pixels */
  height?: number;
  /** Display pixel density (e.g., 1.0, 2.0, 3.0) */
  density?: number;
  /** Network connection type hint */
  network?: NetworkType;
}

/**
 * Network connection types for optimization hints
 */
export type NetworkType = 'FAST' | 'SLOW' | 'CELLULAR';

/**
 * Default capabilities for common scenarios
 */
export const DEFAULT_CAPABILITIES: Capabilities = {
  accept: [
    'text/html',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/json',
  ],
  hints: {
    width: 1024,
    height: 768,
    density: 1.0,
    network: 'FAST',
  },
};
