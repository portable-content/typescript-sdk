/**
 * @fileoverview Mock content factory for testing rendering system
 */

import type { ContentItem, Block, Variant, Capabilities } from '../../src/types';

/**
 * Factory for creating mock content for comprehensive testing
 */
export class MockContentFactory {
  /**
   * Create a mock image block with customizable variants
   */
  static createImageBlock(variants?: Partial<Variant>[]): Block {
    const defaultVariants: Variant[] = [
      {
        mediaType: 'image/webp',
        bytes: 50000,
        width: 800,
        height: 600,
        uri: 'https://example.com/image.webp'
      },
      {
        mediaType: 'image/jpeg',
        bytes: 80000,
        width: 800,
        height: 600,
        uri: 'https://example.com/image.jpg'
      },
      {
        mediaType: 'image/png',
        bytes: 120000,
        width: 800,
        height: 600,
        uri: 'https://example.com/image.png'
      }
    ];

    return {
      id: 'mock-image-block',
      kind: 'image',
      payload: {
        alt: 'Mock image for testing',
        originalWidth: 800,
        originalHeight: 600
      },
      variants: variants ? variants.map((v, i) => ({ ...defaultVariants[i], ...v })) : defaultVariants
    };
  }

  /**
   * Create a mock markdown block with customizable source
   */
  static createMarkdownBlock(source?: string): Block {
    const defaultSource = '# Test Markdown\n\nThis is a test markdown block for rendering tests.';
    
    return {
      id: 'mock-markdown-block',
      kind: 'markdown',
      payload: {
        source: source || defaultSource
      },
      variants: [
        {
          mediaType: 'text/markdown',
          uri: `data:text/markdown,${encodeURIComponent(source || defaultSource)}`,
          bytes: (source || defaultSource).length
        },
        {
          mediaType: 'text/html',
          uri: 'https://example.com/rendered.html',
          bytes: (source || defaultSource).length * 1.5 // Approximate HTML size
        }
      ]
    };
  }

  /**
   * Create a mock Mermaid diagram block
   */
  static createMermaidBlock(source?: string, theme?: string): Block {
    const defaultSource = 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]';
    
    return {
      id: 'mock-mermaid-block',
      kind: 'mermaid',
      payload: {
        source: source || defaultSource,
        theme: theme || 'default'
      },
      variants: [
        {
          mediaType: 'text/plain',
          uri: `data:text/plain,${encodeURIComponent(source || defaultSource)}`,
          bytes: (source || defaultSource).length
        },
        {
          mediaType: 'image/svg+xml',
          uri: 'https://example.com/diagram.svg',
          width: 400,
          height: 300,
          bytes: 5000
        },
        {
          mediaType: 'image/png',
          uri: 'https://example.com/diagram.png',
          width: 400,
          height: 300,
          bytes: 15000
        }
      ]
    };
  }

  /**
   * Create a complete content item with multiple blocks
   */
  static createContentItem(options?: {
    includeMarkdown?: boolean;
    includeImage?: boolean;
    includeMermaid?: boolean;
    representations?: Record<string, { blocks: string[] }>;
  }): ContentItem {
    const blocks: Block[] = [];
    
    if (options?.includeMarkdown !== false) {
      blocks.push(this.createMarkdownBlock());
    }
    
    if (options?.includeImage !== false) {
      blocks.push(this.createImageBlock());
    }
    
    if (options?.includeMermaid !== false) {
      blocks.push(this.createMermaidBlock());
    }

    return {
      id: 'mock-content-item',
      type: 'article',
      title: 'Mock Content Item',
      summary: 'A mock content item for testing the rendering system',
      blocks,
      representations: options?.representations || {
        'full': {
          blocks: blocks.map(b => b.id)
        },
        'summary': {
          blocks: blocks.slice(0, 1).map(b => b.id)
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user'
    };
  }

  /**
   * Create mock capabilities for different scenarios
   */
  static createCapabilities(scenario: 'desktop' | 'mobile' | 'slow-network' | 'high-density' = 'desktop'): Capabilities {
    const baseCapabilities: Capabilities = {
      accept: [
        'text/html',
        'text/markdown',
        'text/plain',
        'image/webp',
        'image/png',
        'image/jpeg',
        'image/svg+xml'
      ]
    };

    switch (scenario) {
      case 'desktop':
        return {
          ...baseCapabilities,
          hints: {
            width: 1920,
            height: 1080,
            density: 1.0,
            network: 'FAST',
            interactive: true
          }
        };

      case 'mobile':
        return {
          ...baseCapabilities,
          hints: {
            width: 375,
            height: 667,
            density: 2.0,
            network: 'FAST',
            interactive: true
          }
        };

      case 'slow-network':
        return {
          ...baseCapabilities,
          hints: {
            width: 375,
            height: 667,
            density: 2.0,
            network: 'SLOW',
            maxBytes: 50000,
            interactive: true
          }
        };

      case 'high-density':
        return {
          ...baseCapabilities,
          accept: [...baseCapabilities.accept, 'image/avif'], // Support advanced formats
          hints: {
            width: 1920,
            height: 1080,
            density: 3.0,
            network: 'FAST',
            interactive: true
          }
        };

      default:
        return baseCapabilities;
    }
  }

  /**
   * Create variants with different optimization scenarios
   */
  static createOptimizedVariants(scenario: 'size-optimized' | 'quality-optimized' | 'format-variety'): Variant[] {
    switch (scenario) {
      case 'size-optimized':
        return [
          { mediaType: 'image/avif', bytes: 25000, width: 800, height: 600, uri: 'small.avif' },
          { mediaType: 'image/webp', bytes: 35000, width: 800, height: 600, uri: 'small.webp' },
          { mediaType: 'image/jpeg', bytes: 60000, width: 800, height: 600, uri: 'small.jpg' }
        ];

      case 'quality-optimized':
        return [
          { mediaType: 'image/png', bytes: 200000, width: 1600, height: 1200, uri: 'hq.png' },
          { mediaType: 'image/jpeg', bytes: 150000, width: 1600, height: 1200, uri: 'hq.jpg' },
          { mediaType: 'image/webp', bytes: 100000, width: 1600, height: 1200, uri: 'hq.webp' }
        ];

      case 'format-variety':
        return [
          { mediaType: 'image/avif', bytes: 40000, width: 800, height: 600, uri: 'test.avif' },
          { mediaType: 'image/webp', bytes: 50000, width: 800, height: 600, uri: 'test.webp' },
          { mediaType: 'image/jpeg', bytes: 80000, width: 800, height: 600, uri: 'test.jpg' },
          { mediaType: 'image/png', bytes: 120000, width: 800, height: 600, uri: 'test.png' },
          { mediaType: 'image/svg+xml', bytes: 5000, uri: 'test.svg' },
          { mediaType: 'image/gif', bytes: 200000, width: 800, height: 600, uri: 'test.gif' }
        ];

      default:
        return [];
    }
  }

  /**
   * Create a block with no acceptable variants (for fallback testing)
   */
  static createUnrenderableBlock(): Block {
    return {
      id: 'unrenderable-block',
      kind: 'custom',
      payload: { data: 'test' },
      variants: [
        { mediaType: 'application/x-custom', uri: 'test.custom' },
        { mediaType: 'application/octet-stream', bytes: 1000, uri: 'test.bin' }
      ]
    };
  }

  /**
   * Create edge case scenarios for testing
   */
  static createEdgeCaseBlock(scenario: 'empty-variants' | 'no-uri' | 'huge-file' | 'tiny-file'): Block {
    const baseBlock = {
      id: `edge-case-${scenario}`,
      kind: 'test',
      payload: {}
    };

    switch (scenario) {
      case 'empty-variants':
        return { ...baseBlock, variants: [] };

      case 'no-uri':
        return {
          ...baseBlock,
          variants: [{ mediaType: 'text/plain', bytes: 1000 }]
        };

      case 'huge-file':
        return {
          ...baseBlock,
          variants: [{ mediaType: 'image/png', bytes: 50000000, uri: 'huge.png' }] // 50MB
        };

      case 'tiny-file':
        return {
          ...baseBlock,
          variants: [{ mediaType: 'text/plain', bytes: 10, uri: 'tiny.txt' }]
        };

      default:
        return { ...baseBlock, variants: [] };
    }
  }
}
