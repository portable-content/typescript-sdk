/**
 * @fileoverview Tests for content resolution system
 */

import { EagerLoadingStrategy } from '../../../src/rendering/strategies';
import { DefaultContentResolver, MemoryContentCache } from '../../../src/rendering/resolver';
import { generateCacheKey } from '../../../src/rendering/content-resolution';
import type { PayloadSource, Element, Capabilities, ExternalPayloadSource } from '../../../src/types';

// Mock fetch for testing external content
global.fetch = jest.fn();

describe('EagerLoadingStrategy', () => {
  let strategy: EagerLoadingStrategy;
  let mockCapabilities: Capabilities;

  beforeEach(() => {
    strategy = new EagerLoadingStrategy();
    mockCapabilities = {
      accept: ['text/plain', 'text/html']
    };
    jest.clearAllMocks();
  });

  describe('canHandle', () => {
    it('should handle any payload source', () => {
      const inlineSource: PayloadSource = {
        type: 'inline',
        mediaType: 'text/plain',
        source: 'test content'
      };

      const externalSource: PayloadSource = {
        type: 'external',
        mediaType: 'text/plain',
        uri: 'https://example.com/content.txt'
      };

      expect(strategy.canHandle(inlineSource)).toBe(true);
      expect(strategy.canHandle(externalSource)).toBe(true);
    });
  });

  describe('resolve inline content', () => {
    it('should resolve inline content successfully', async () => {
      const source: PayloadSource = {
        type: 'inline',
        mediaType: 'text/plain',
        source: 'Hello, world!'
      };

      const result = await strategy.resolve(source, mockCapabilities);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content.data).toBe('Hello, world!');
        expect(result.content.mediaType).toBe('text/plain');
        expect(result.content.source).toBe(source);
        expect(result.content.metadata?.size).toBe(13);
      }
    });

    it('should reject inline content exceeding size limit', async () => {
      const source: PayloadSource = {
        type: 'inline',
        mediaType: 'text/plain',
        source: 'This is a long content string'
      };

      const result = await strategy.resolve(source, mockCapabilities, { maxSize: 10 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SIZE_LIMIT');
      }
    });
  });

  describe('resolve external content', () => {
    it('should resolve external text content successfully', async () => {
      const source: PayloadSource = {
        type: 'external',
        mediaType: 'text/plain',
        uri: 'https://example.com/content.txt'
      };

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'text/plain'],
          ['content-length', '13']
        ]),
        text: jest.fn().mockResolvedValue('Hello, world!')
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await strategy.resolve(source, mockCapabilities);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.content.data).toBe('Hello, world!');
        expect(result.content.mediaType).toBe('text/plain');
        expect(result.content.source).toBe(source);
      }
    });

    it('should handle HTTP errors', async () => {
      const source: PayloadSource = {
        type: 'external',
        mediaType: 'text/plain',
        uri: 'https://example.com/not-found.txt'
      };

      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await strategy.resolve(source, mockCapabilities);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should handle network timeouts', async () => {
      const source: PayloadSource = {
        type: 'external',
        mediaType: 'text/plain',
        uri: 'https://example.com/slow.txt'
      };

      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100)
        )
      );

      const result = await strategy.resolve(source, mockCapabilities, { timeout: 50 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    });
  });
});

describe('DefaultContentResolver', () => {
  let resolver: DefaultContentResolver;
  let cache: MemoryContentCache;
  let mockElement: Element;
  let mockCapabilities: Capabilities;

  beforeEach(() => {
    cache = new MemoryContentCache();
    resolver = new DefaultContentResolver(undefined, cache);

    mockElement = {
      id: 'test-element',
      kind: 'markdown',
      content: {
        primary: {
          type: 'inline',
          mediaType: 'text/plain',
          source: 'Test content'
        }
      }
    };

    mockCapabilities = {
      accept: ['text/plain']
    };
  });

  describe('resolveElementContent', () => {
    it('should resolve block content successfully', async () => {
      const content = await resolver.resolveElementContent(mockElement, mockCapabilities);

      expect(content.data).toBe('Test content');
      expect(content.mediaType).toBe('text/plain');
      expect(content.source.type).toBe('inline');
    });

    it('should throw error when no suitable payload source found', async () => {
      const blockWithNoSources: Element = {
        id: 'empty-block',
        kind: 'document',
        content: {
          primary: {
            type: 'external',
            mediaType: 'application/unknown',
            uri: 'test.bin'
          }
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain'] // Different from block's media type
      };

      await expect(
        resolver.resolveElementContent(blockWithNoSources, capabilities)
      ).rejects.toThrow('No suitable payload source found');
    });
  });

  describe('caching', () => {
    it('should cache resolved content', async () => {
      // First resolution
      const content1 = await resolver.resolveElementContent(mockElement, mockCapabilities);
      expect(content1.metadata?.fromCache).toBe(false);

      // Second resolution should come from cache
      const content2 = await resolver.resolveElementContent(mockElement, mockCapabilities);
      expect(content2.metadata?.fromCache).toBe(true);
      expect(content2.data).toBe(content1.data);
    });

    it('should skip cache when disabled', async () => {
      const content1 = await resolver.resolveElementContent(
        mockElement, 
        mockCapabilities, 
        { useCache: false }
      );
      expect(content1.metadata?.fromCache).toBe(false);

      const content2 = await resolver.resolveElementContent(
        mockElement, 
        mockCapabilities, 
        { useCache: false }
      );
      expect(content2.metadata?.fromCache).toBe(false);
    });
  });
});

describe('MemoryContentCache', () => {
  let cache: MemoryContentCache;

  beforeEach(() => {
    cache = new MemoryContentCache();
  });

  it('should store and retrieve content', async () => {
    const content = {
      data: 'test',
      mediaType: 'text/plain',
      source: { type: 'inline', mediaType: 'text/plain', source: 'test' } as PayloadSource
    };

    await cache.set('key1', content);
    const retrieved = await cache.get('key1');

    expect(retrieved).toEqual(content);
  });

  it('should return null for non-existent keys', async () => {
    const result = await cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should handle TTL expiration', async () => {
    const content = {
      data: 'test',
      mediaType: 'text/plain',
      source: { type: 'inline', mediaType: 'text/plain', source: 'test' } as PayloadSource
    };

    await cache.set('key1', content, 10); // 10ms TTL
    
    // Should exist immediately
    expect(await cache.has('key1')).toBe(true);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Should be expired
    expect(await cache.has('key1')).toBe(false);
    expect(await cache.get('key1')).toBeNull();
  });
});

describe('generateCacheKey', () => {
  it('should generate consistent keys for inline content', () => {
    const source: PayloadSource = {
      type: 'inline',
      mediaType: 'text/plain',
      source: 'test content'
    };

    const key1 = generateCacheKey(source);
    const key2 = generateCacheKey(source);

    expect(key1).toBe(key2);
    expect(key1).toMatch(/^inline:text\/plain:/);
  });

  it('should generate consistent keys for external content', () => {
    const source: PayloadSource = {
      type: 'external',
      mediaType: 'text/plain',
      uri: 'https://example.com/content.txt'
    };

    const key1 = generateCacheKey(source);
    const key2 = generateCacheKey(source);

    expect(key1).toBe(key2);
    expect(key1).toBe('external:https://example.com/content.txt');
  });

  it('should include content hash when available', () => {
    const source: ExternalPayloadSource = {
      type: 'external',
      mediaType: 'text/plain',
      uri: 'https://example.com/content.txt',
      contentHash: 'abc123'
    };

    const key = generateCacheKey(source);
    expect(key).toBe('external:https://example.com/content.txt:abc123');
  });
});
