/**
 * @fileoverview Content resolution interfaces and types for normalizing content for rendering
 */

import type { Element, PayloadSource, Capabilities, ExternalPayloadSource } from '../types';

/**
 * Normalized content ready for rendering by element components
 */
export interface RenderingContent {
  /** The actual content data (text, binary data, etc.) */
  data: string | ArrayBuffer | Blob;

  /** Media type of the content */
  mediaType: string;

  /** Original payload source that was resolved */
  source: PayloadSource;

  /** Additional metadata about the content */
  metadata?: {
    /** Size of the content in bytes */
    size?: number;

    /** Content hash for caching/validation */
    hash?: string;

    /** When the content was loaded */
    loadedAt?: Date;

    /** Loading duration in milliseconds */
    loadDuration?: number;

    /** Whether content was loaded from cache */
    fromCache?: boolean;

    /** Any additional metadata from the source */
    [key: string]: unknown;
  };
}

/**
 * Error that occurred during content resolution
 */
export interface ContentResolutionError {
  /** Error message */
  message: string;

  /** Error code for programmatic handling */
  code: string;

  /** The payload source that failed to resolve */
  source: PayloadSource;

  /** Original error if available */
  cause?: Error;

  /** When the error occurred */
  timestamp: Date;
}

/**
 * Result of content resolution - either success or error
 */
export type ContentResolutionResult =
  | { success: true; content: RenderingContent }
  | { success: false; error: ContentResolutionError };

/**
 * Strategy interface for different content loading approaches
 */
export interface LoadingStrategy {
  /** Name of the strategy for debugging/logging */
  readonly name: string;

  /**
   * Resolve a payload source to rendering content
   * @param source The payload source to resolve
   * @param capabilities Client capabilities for optimization
   * @param options Resolution options
   * @returns Promise resolving to the content or error
   */
  resolve(
    source: PayloadSource,
    capabilities: Capabilities,
    options?: ContentResolutionOptions
  ): Promise<ContentResolutionResult>;

  /**
   * Check if this strategy can handle the given payload source
   * @param source The payload source to check
   * @returns True if this strategy can handle the source
   */
  canHandle(source: PayloadSource): boolean;
}

/**
 * Options for content resolution
 */
export interface ContentResolutionOptions {
  /** Timeout for external content loading in milliseconds */
  timeout?: number;

  /** Whether to use caching */
  useCache?: boolean;

  /** Custom headers for external requests */
  headers?: Record<string, string>;

  /** Whether to validate content integrity */
  validateIntegrity?: boolean;

  /** Maximum content size to accept in bytes */
  maxSize?: number;
}

/**
 * Content resolver that coordinates content loading and normalization
 */
export interface ContentResolver {
  /**
   * Resolve content for an element using the best available payload source
   * @param element The element to resolve content for
   * @param capabilities Client capabilities
   * @param options Resolution options
   * @returns Promise resolving to rendering content
   */
  resolveElementContent(
    element: Element,
    capabilities: Capabilities,
    options?: ContentResolutionOptions
  ): Promise<RenderingContent>;

  /**
   * Resolve a specific payload source to rendering content
   * @param source The payload source to resolve
   * @param capabilities Client capabilities
   * @param options Resolution options
   * @returns Promise resolving to rendering content
   */
  resolvePayloadSource(
    source: PayloadSource,
    capabilities: Capabilities,
    options?: ContentResolutionOptions
  ): Promise<RenderingContent>;

  /**
   * Set the loading strategy to use
   * @param strategy The loading strategy
   */
  setLoadingStrategy(strategy: LoadingStrategy): void;

  /**
   * Get the current loading strategy
   * @returns The current loading strategy
   */
  getLoadingStrategy(): LoadingStrategy;
}

/**
 * Cache interface for content resolution
 */
export interface ContentCache {
  /**
   * Get cached content by key
   * @param key Cache key
   * @returns Cached content or null if not found
   */
  get(key: string): Promise<RenderingContent | null>;

  /**
   * Set cached content
   * @param key Cache key
   * @param content Content to cache
   * @param ttl Time to live in milliseconds
   */
  set(key: string, content: RenderingContent, ttl?: number): Promise<void>;

  /**
   * Check if content exists in cache
   * @param key Cache key
   * @returns True if content is cached
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear cached content
   * @param key Cache key or pattern
   */
  clear(key?: string): Promise<void>;
}

/**
 * Generate a cache key for a payload source
 * @param source The payload source
 * @returns Cache key string
 */
export function generateCacheKey(source: PayloadSource): string {
  if (source.type === 'inline') {
    // For inline content, use a hash of the source content
    return `inline:${source.mediaType}:${hashString(source.source || '')}`;
  } else {
    // For external content, use URI and optional hash
    const base = `external:${source.uri}`;
    const externalSource = source as ExternalPayloadSource;
    return externalSource.contentHash ? `${base}:${externalSource.contentHash}` : base;
  }
}

/**
 * Simple string hash function for cache keys
 * @param str String to hash
 * @returns Hash string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
