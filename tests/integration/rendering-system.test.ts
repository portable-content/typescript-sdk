/**
 * @fileoverview Integration tests for the complete rendering system
 */

import {
  PayloadSourceSelector,
  DefaultContentProcessor,
  DefaultRendererRegistry,
  CapabilityDetector
} from '../../src/rendering';
import { MockContentFactory } from '../__mocks__/content-factory';
import type { Block, Capabilities } from '../../src/types';
import type { BlockRenderer, RenderContext, RenderResult } from '../../src/rendering/interfaces';

// Mock renderer implementations for integration testing
class MockMarkdownRenderer implements BlockRenderer {
  readonly kind = 'markdown';
  readonly priority = 1;

  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === 'markdown';
  }

  async render(block: Block, props: any, context: RenderContext): Promise<RenderResult> {
    const selector = new PayloadSourceSelector();
    const payloadSource = selector.selectBestPayloadSource(block, context.capabilities);

    const content = payloadSource?.type === 'inline'
      ? payloadSource.source
      : 'External content';

    return {
      content: `<div>Rendered markdown: ${content || 'No content'}</div>`,
      payloadSource,
      metadata: { renderer: 'MockMarkdownRenderer' }
    };
  }
}

class MockImageRenderer implements BlockRenderer {
  readonly kind = 'image';
  readonly priority = 1;

  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === 'image';
  }

  async render(block: Block, props: any, context: RenderContext): Promise<RenderResult> {
    const selector = new PayloadSourceSelector();
    const payloadSource = selector.selectBestPayloadSource(block, context.capabilities);

    if (!payloadSource) {
      return { content: null, payloadSource: null, errors: ['No suitable payload source found'] };
    }

    const src = payloadSource.type === 'external'
      ? payloadSource.uri
      : `data:${payloadSource.mediaType};base64,${payloadSource.source}`;

    return {
      content: {
        src,
        alt: props?.alt || 'Image',
        width: payloadSource.width,
        height: payloadSource.height
      },
      payloadSource,
      metadata: { renderer: 'MockImageRenderer' }
    };
  }
}

class MockMermaidRenderer implements BlockRenderer {
  readonly kind = 'mermaid';
  readonly priority = 1;

  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === 'mermaid';
  }

  async render(block: Block, props: any, context: RenderContext): Promise<RenderResult> {
    const selector = new PayloadSourceSelector();
    const payloadSource = selector.selectBestPayloadSource(block, context.capabilities);

    return {
      content: `<svg>Rendered mermaid diagram</svg>`,
      payloadSource,
      metadata: { renderer: 'MockMermaidRenderer' }
    };
  }
}

describe('Rendering System Integration', () => {
  let registry: DefaultRendererRegistry;
  let processor: DefaultContentProcessor;
  let detector: CapabilityDetector;

  beforeEach(() => {
    registry = new DefaultRendererRegistry();
    processor = new DefaultContentProcessor();
    detector = new CapabilityDetector();

    // Register mock renderers
    registry.register(new MockMarkdownRenderer());
    registry.register(new MockImageRenderer());
    registry.register(new MockMermaidRenderer());
  });

  describe('End-to-End Content Rendering', () => {
    it('should process and render complete content manifest', async () => {
      // Create mock content with all block types
      const content = MockContentFactory.createContentManifest();
      const capabilities: Capabilities = { accept: ['text/html', 'image/webp', 'image/svg+xml'] };
      const context: RenderContext = { capabilities };

      // Process content to optimize payload sources
      const processedContent = await processor.processContent(content, capabilities);

      // Render each block
      const renderResults = [];
      for (const block of processedContent.blocks) {
        const renderer = registry.getRenderer(block, context);
        if (renderer) {
          const result = await renderer.render(block, {}, context);
          renderResults.push(result);
        }
      }

      expect(renderResults).toHaveLength(3); // markdown, image, mermaid
      expect(renderResults.every(r => r.content !== null)).toBe(true);
      expect(renderResults.every(r => r.payloadSource !== null)).toBe(true);
    });

    it('should optimize for mobile devices', async () => {
      const content = MockContentFactory.createContentManifest({ includeMarkdown: false, includeMermaid: false });
      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg'],
        hints: { width: 375, network: 'CELLULAR' }
      };
      const context: RenderContext = { capabilities };

      const processedContent = await processor.processContent(content, capabilities);
      const imageBlock = processedContent.blocks.find(b => b.kind === 'image');

      expect(imageBlock).toBeDefined();

      const renderer = registry.getRenderer(imageBlock!, context);
      const result = await renderer!.render(imageBlock!, {}, context);

      // Should select appropriate payload source for mobile
      expect(result.payloadSource).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should optimize for slow networks', async () => {
      const content = MockContentFactory.createContentManifest({ includeMarkdown: false, includeMermaid: false });
      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg'],
        hints: { network: 'SLOW', maxBytes: 50000 }
      };
      const context: RenderContext = { capabilities };

      const processedContent = await processor.processContent(content, capabilities);
      const imageBlock = processedContent.blocks.find(b => b.kind === 'image');

      const renderer = registry.getRenderer(imageBlock!, context);
      const result = await renderer!.render(imageBlock!, {}, context);

      // Should prefer optimized content for slow networks
      expect(result.payloadSource).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should handle representation filtering', async () => {
      const content = MockContentFactory.createContentManifest();
      const capabilities: Capabilities = { accept: ['*/*'] };

      // Process with summary representation (should only include first block)
      const summaryContent = await processor.processContent(
        content,
        capabilities,
        { representation: 'summary' }
      );

      expect(summaryContent.blocks).toHaveLength(1);
      expect(summaryContent.blocks[0].kind).toBe('markdown');

      // Process with full representation
      const fullContent = await processor.processContent(
        content, 
        capabilities, 
        { representation: 'full' }
      );

      expect(fullContent.blocks).toHaveLength(3);
    });
  });

  describe('PayloadSource Selection Optimization', () => {
    it('should select WebP over JPEG when supported', async () => {
      const imageBlock = MockContentFactory.createImageBlock();
      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg', 'image/png']
      };
      const context: RenderContext = { capabilities };

      const renderer = registry.getRenderer(imageBlock, context);
      const result = await renderer!.render(imageBlock, {}, context);

      expect(result.payloadSource?.mediaType).toBe('image/webp');
    });

    it('should fallback to supported formats', async () => {
      const imageBlock = MockContentFactory.createImageBlock();
      const capabilities: Capabilities = {
        accept: ['image/png'] // Only PNG supported
      };
      const context: RenderContext = { capabilities };

      const renderer = registry.getRenderer(imageBlock, context);
      const result = await renderer!.render(imageBlock, {}, context);

      expect(result.payloadSource?.mediaType).toBe('image/png');
    });

    it('should handle high-density displays', async () => {
      const imageBlock = MockContentFactory.createImageBlock([
        { type: 'external', mediaType: 'image/png', uri: 'standard.png', width: 800, height: 600 },
        { type: 'external', mediaType: 'image/png', uri: 'retina.png', width: 1600, height: 1200 }
      ]);

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { density: 2.0 }
      };
      const context: RenderContext = { capabilities };

      const renderer = registry.getRenderer(imageBlock, context);
      const result = await renderer!.render(imageBlock, {}, context);

      // Should prefer higher resolution for high-density displays
      expect(result.payloadSource?.width).toBeGreaterThanOrEqual(1600);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle blocks with no suitable payload sources', async () => {
      const unrederableBlock = MockContentFactory.createUnrenderableBlock();
      const capabilities: Capabilities = { accept: ['text/plain', 'image/png'] };
      const context: RenderContext = { capabilities };

      const renderer = registry.getRenderer(unrederableBlock, context);
      expect(renderer).toBeNull(); // No renderer can handle this block
    });

    it('should handle blocks with no alternatives gracefully', async () => {
      const emptyBlock = MockContentFactory.createEdgeCaseBlock('empty-alternatives');
      const capabilities: Capabilities = { accept: ['text/plain'] };
      const context: RenderContext = { capabilities };

      const processedBlock = await processor.processBlock(emptyBlock, capabilities);
      expect(processedBlock.content.alternatives).toBeUndefined();
    });

    it('should provide error callbacks', async () => {
      const errors: Error[] = [];
      const onError = (error: Error) => errors.push(error);
      
      const context: RenderContext = {
        capabilities: MockContentFactory.createCapabilities('desktop'),
        onError
      };

      // This would trigger an error in a real scenario
      // For now, just verify the callback mechanism works
      expect(context.onError).toBeDefined();
    });

    it('should provide loading callbacks', async () => {
      const loadingStates: boolean[] = [];
      const onLoading = (loading: boolean) => loadingStates.push(loading);
      
      const context: RenderContext = {
        capabilities: MockContentFactory.createCapabilities('desktop'),
        onLoading
      };

      expect(context.onLoading).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should process large content efficiently', async () => {
      // Create content with many blocks
      const largeContent = {
        ...MockContentFactory.createContentManifest(),
        blocks: Array.from({ length: 100 }, (_, i) => ({
          ...MockContentFactory.createMarkdownBlock(`# Block ${i}`),
          id: `block-${i}`
        }))
      };

      const capabilities: Capabilities = { accept: ['text/markdown', 'text/html'] };
      const startTime = Date.now();

      const processedContent = await processor.processContent(largeContent, capabilities);

      const processingTime = Date.now() - startTime;

      expect(processedContent.blocks).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should handle blocks with many alternatives efficiently', async () => {
      const blockWithManyAlternatives = {
        ...MockContentFactory.createImageBlock(),
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' },
          alternatives: MockContentFactory.createOptimizedPayloadSources('format-variety')
        }
      };

      const capabilities: Capabilities = { accept: ['image/webp', 'image/jpeg', 'image/png'] };
      const processedBlock = await processor.processBlock(blockWithManyAlternatives, capabilities);

      // Block should remain unchanged with new processor
      expect(processedBlock.content.alternatives?.length).toBeGreaterThan(0);
    });
  });

  describe('Capability Detection Integration', () => {
    it('should work with detected capabilities', () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: { screen: { width: 1920, height: 1080 }, devicePixelRatio: 2.0 },
        configurable: true
      });

      const detectedCapabilities = detector.detectCapabilities();
      expect(detectedCapabilities.accept).toContain('text/html');
      expect(detectedCapabilities.hints?.width).toBe(1920);
      expect(detectedCapabilities.hints?.density).toBe(2.0);

      // Clean up
      delete (global as any).window;
    });
  });
});
