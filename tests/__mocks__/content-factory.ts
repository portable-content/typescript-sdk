/**
 * @fileoverview Mock content factory for testing rendering system
 */

import type { ContentManifest, Element, PayloadSource, Capabilities } from '../../src/types';

/**
 * Factory for creating mock content for comprehensive testing
 */
export class MockContentFactory {
  /**
   * Create a mock image element with customizable alternatives
   */
  static createImageElement(alternatives?: Partial<PayloadSource>[]): Element {
    const defaultAlternatives: PayloadSource[] = [
      {
        type: 'external',
        mediaType: 'image/webp',
        uri: 'https://example.com/image.webp',
        width: 800,
        height: 600
      },
      {
        type: 'external',
        mediaType: 'image/jpeg',
        uri: 'https://example.com/image.jpg',
        width: 800,
        height: 600
      }
    ];

    return {
      id: 'mock-image-block',
      kind: 'image',
      content: {
        primary: {
          type: 'external',
          mediaType: 'image/png',
          uri: 'https://example.com/image.png',
          width: 800,
          height: 600
        },
        alternatives: alternatives ? alternatives.map((a, i) => ({ ...defaultAlternatives[i], ...a })) : defaultAlternatives
      }
    };
  }

  /**
   * Create a mock markdown element with customizable source
   */
  static createMarkdownElement(source?: string): Element {
    const defaultSource = '# Test Markdown\n\nThis is a test markdown block for rendering tests.';
    const content = source || defaultSource;

    return {
      id: 'mock-markdown-block',
      kind: 'markdown',
      content: {
        primary: {
          type: 'inline',
          mediaType: 'text/markdown',
          source: content
        },
        alternatives: [
          {
            type: 'external',
            mediaType: 'text/html',
            uri: 'https://example.com/rendered.html'
          }
        ]
      }
    };
  }

  /**
   * Create a mock Mermaid diagram element
   */
  static createMermaidElement(source?: string, theme?: string): Element {
    const defaultSource = 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]';
    const content = source || defaultSource;

    return {
      id: 'mock-mermaid-block',
      kind: 'mermaid',
      content: {
        primary: {
          type: 'external',
          mediaType: 'image/svg+xml',
          uri: 'https://example.com/diagram.svg',
          width: 400,
          height: 300
        },
        source: {
          type: 'inline',
          mediaType: 'text/plain',
          source: content
        },
        alternatives: [
          {
            type: 'external',
            mediaType: 'image/png',
            uri: 'https://example.com/diagram.png',
            width: 400,
            height: 300
          }
        ]
      }
    };
  }

  /**
   * Create a complete content manifest with multiple blocks
   */
  static createContentManifest(options?: {
    includeMarkdown?: boolean;
    includeImage?: boolean;
    includeMermaid?: boolean;
    representations?: Record<string, { elements: string[] }>;
  }): ContentManifest {
    const elements: Element[] = [];

    if (options?.includeMarkdown !== false) {
      elements.push(this.createMarkdownElement());
    }

    if (options?.includeImage !== false) {
      elements.push(this.createImageElement());
    }

    if (options?.includeMermaid !== false) {
      elements.push(this.createMermaidElement());
    }

    return {
      id: 'mock-content-manifest',
      type: 'article',
      title: 'Mock Content Manifest',
      summary: 'A mock content manifest for testing the rendering system',
      elements,
      representations: options?.representations || {
        'full': {
          elements: elements.map(e => e.id)
        },
        'summary': {
          elements: elements.slice(0, 1).map(e => e.id)
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user'
    };
  }

  /**
   * @deprecated Use createContentManifest instead
   */
  static createContentItem = this.createContentManifest;

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
   * Create payload sources with different optimization scenarios
   */
  static createOptimizedPayloadSources(scenario: 'size-optimized' | 'quality-optimized' | 'format-variety'): PayloadSource[] {
    switch (scenario) {
      case 'size-optimized':
        return [
          { type: 'external', mediaType: 'image/avif', uri: 'small.avif', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/webp', uri: 'small.webp', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/jpeg', uri: 'small.jpg', width: 800, height: 600 }
        ];

      case 'quality-optimized':
        return [
          { type: 'external', mediaType: 'image/png', uri: 'hq.png', width: 1600, height: 1200 },
          { type: 'external', mediaType: 'image/jpeg', uri: 'hq.jpg', width: 1600, height: 1200 },
          { type: 'external', mediaType: 'image/webp', uri: 'hq.webp', width: 1600, height: 1200 }
        ];

      case 'format-variety':
        return [
          { type: 'external', mediaType: 'image/avif', uri: 'test.avif', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/webp', uri: 'test.webp', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/png', uri: 'test.png', width: 800, height: 600 },
          { type: 'external', mediaType: 'image/svg+xml', uri: 'test.svg' },
          { type: 'external', mediaType: 'image/gif', uri: 'test.gif', width: 800, height: 600 }
        ];

      default:
        return [];
    }
  }

  /**
   * Create a block with no acceptable payload sources (for fallback testing)
   */
  static createUnrenderableBlock(): Element {
    return {
      id: 'unrenderable-block',
      kind: 'document',
      content: {
        primary: {
          type: 'external',
          mediaType: 'application/x-custom',
          uri: 'test.custom'
        },
        alternatives: [
          {
            type: 'external',
            mediaType: 'application/octet-stream',
            uri: 'test.bin'
          }
        ]
      }
    };
  }

  /**
   * Create edge case scenarios for testing
   */
  static createEdgeCaseBlock(scenario: 'empty-alternatives' | 'inline-only' | 'huge-file' | 'tiny-file'): Element {
    const baseId = `edge-case-${scenario}`;

    switch (scenario) {
      case 'empty-alternatives':
        return {
          id: baseId,
          kind: 'markdown',
          content: {
            primary: {
              type: 'inline',
              mediaType: 'text/plain',
              source: 'test content'
            }
          }
        };

      case 'inline-only':
        return {
          id: baseId,
          kind: 'markdown',
          content: {
            primary: {
              type: 'inline',
              mediaType: 'text/plain',
              source: 'inline test content'
            }
          }
        };

      case 'huge-file':
        return {
          id: baseId,
          kind: 'markdown',
          content: {
            primary: {
              type: 'external',
              mediaType: 'image/png',
              uri: 'huge.png'
            }
          }
        };

      case 'tiny-file':
        return {
          id: baseId,
          kind: 'markdown',
          content: {
            primary: {
              type: 'external',
              mediaType: 'text/plain',
              uri: 'tiny.txt'
            }
          }
        };

      default:
        return {
          id: baseId,
          kind: 'markdown',
          content: {
            primary: {
              type: 'inline',
              mediaType: 'text/plain',
              source: 'default content'
            }
          }
        };
    }
  }
}
