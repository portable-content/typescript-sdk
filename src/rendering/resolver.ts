/**
 * @fileoverview Default content resolver implementation
 */

import type { 
  ContentResolver, 
  LoadingStrategy, 
  RenderingContent,
  ContentResolutionOptions,
  ContentCache
} from './content-resolution';
import type { Block, PayloadSource, Capabilities } from '../types';
import { PayloadSourceSelector } from './variant-selector';
import { EagerLoadingStrategy } from './strategies';
import { generateCacheKey } from './content-resolution';

/**
 * Default implementation of ContentResolver
 */
export class DefaultContentResolver implements ContentResolver {
  private loadingStrategy: LoadingStrategy;
  private payloadSourceSelector: PayloadSourceSelector;
  private cache?: ContentCache;

  constructor(
    loadingStrategy?: LoadingStrategy,
    cache?: ContentCache
  ) {
    this.loadingStrategy = loadingStrategy || new EagerLoadingStrategy();
    this.payloadSourceSelector = new PayloadSourceSelector();
    this.cache = cache;
  }

  async resolveBlockContent(
    block: Block, 
    capabilities: Capabilities, 
    options: ContentResolutionOptions = {}
  ): Promise<RenderingContent> {
    // Select the best payload source for this block
    const payloadSource = this.payloadSourceSelector.selectBestPayloadSource(block, capabilities);
    
    if (!payloadSource) {
      throw new Error(`No suitable payload source found for block ${block.id}`);
    }

    return this.resolvePayloadSource(payloadSource, capabilities, options);
  }

  async resolvePayloadSource(
    source: PayloadSource, 
    capabilities: Capabilities, 
    options: ContentResolutionOptions = {}
  ): Promise<RenderingContent> {
    // Check cache first if enabled
    if (options.useCache !== false && this.cache) {
      const cacheKey = generateCacheKey(source);
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        // Update metadata to indicate cache hit
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            fromCache: true,
            loadedAt: new Date()
          }
        };
      }
    }

    // Check if the current strategy can handle this source
    if (!this.loadingStrategy.canHandle(source)) {
      throw new Error(`Loading strategy '${this.loadingStrategy.name}' cannot handle payload source type '${source.type}'`);
    }

    // Resolve using the loading strategy
    const result = await this.loadingStrategy.resolve(source, capabilities, options);
    
    if (!result.success) {
      const error = new Error(`Content resolution failed: ${result.error.message}`);
      (error as any).cause = result.error.cause;
      throw error;
    }

    const content = result.content;

    // Cache the result if caching is enabled
    if (options.useCache !== false && this.cache) {
      const cacheKey = generateCacheKey(source);
      const ttl = this.calculateCacheTTL(source, options);
      await this.cache.set(cacheKey, content, ttl);
    }

    return content;
  }

  setLoadingStrategy(strategy: LoadingStrategy): void {
    this.loadingStrategy = strategy;
  }

  getLoadingStrategy(): LoadingStrategy {
    return this.loadingStrategy;
  }

  /**
   * Set the content cache
   * @param cache The cache implementation to use
   */
  setCache(cache: ContentCache): void {
    this.cache = cache;
  }

  /**
   * Get the current content cache
   * @returns The current cache or undefined if not set
   */
  getCache(): ContentCache | undefined {
    return this.cache;
  }

  private calculateCacheTTL(source: PayloadSource, options: ContentResolutionOptions): number | undefined {
    // Default TTL based on content type
    if (source.type === 'inline') {
      // Inline content can be cached longer since it doesn't change
      return 24 * 60 * 60 * 1000; // 24 hours
    } else {
      // External content has shorter TTL by default
      return 60 * 60 * 1000; // 1 hour
    }
  }
}

/**
 * Simple in-memory cache implementation for content
 */
export class MemoryContentCache implements ContentCache {
  private cache = new Map<string, { content: RenderingContent; expires?: number }>();

  async get(key: string): Promise<RenderingContent | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.content;
  }

  async set(key: string, content: RenderingContent, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl : undefined;
    this.cache.set(key, { content, expires });
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}
