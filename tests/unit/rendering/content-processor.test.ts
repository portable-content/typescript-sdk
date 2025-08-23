/**
 * @fileoverview Tests for DefaultContentProcessor
 */

import { DefaultContentProcessor } from '../../../src/rendering/content-processor';
import type { ContentItem, Block, Variant, Capabilities } from '../../../src/types';

describe('DefaultContentProcessor', () => {
  let processor: DefaultContentProcessor;

  beforeEach(() => {
    processor = new DefaultContentProcessor();
  });

  describe('processContent', () => {
    it('should process content with multiple blocks', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          {
            id: 'block1',
            kind: 'markdown',
            payload: { source: '# Test' },
            variants: [
              { mediaType: 'text/markdown', uri: 'test.md' },
              { mediaType: 'text/html', uri: 'test.html' }
            ]
          },
          {
            id: 'block2',
            kind: 'image',
            payload: { alt: 'Test image' },
            variants: [
              { mediaType: 'image/webp', bytes: 50000, uri: 'test.webp' },
              { mediaType: 'image/jpeg', bytes: 80000, uri: 'test.jpg' }
            ]
          }
        ]
      };

      const capabilities: Capabilities = {
        accept: ['text/html', 'image/webp']
      };

      const result = await processor.processContent(content, capabilities);

      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0].variants[0].mediaType).toBe('text/html');
      expect(result.blocks[1].variants[0].mediaType).toBe('image/webp');
    });

    it('should apply representation filtering when specified', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          { id: 'block1', kind: 'markdown', payload: {}, variants: [] },
          { id: 'block2', kind: 'image', payload: {}, variants: [] },
          { id: 'block3', kind: 'mermaid', payload: {}, variants: [] }
        ],
        representations: {
          'summary': {
            blocks: ['block1', 'block3']
          }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'summary' };

      const result = await processor.processContent(content, capabilities, options);

      expect(result.blocks).toHaveLength(2);
      expect(result.blocks.map(b => b.id)).toEqual(['block1', 'block3']);
    });

    it('should handle non-existent representation gracefully', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          { id: 'block1', kind: 'markdown', payload: {}, variants: [] }
        ],
        representations: {
          'summary': { blocks: ['block1'] }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'nonexistent' };

      const result = await processor.processContent(content, capabilities, options);

      // Should return original content when representation doesn't exist
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].id).toBe('block1');
    });

    it('should handle content without representations', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          { id: 'block1', kind: 'markdown', payload: {}, variants: [] }
        ]
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'summary' };

      const result = await processor.processContent(content, capabilities, options);

      // Should return original content when no representations defined
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].id).toBe('block1');
    });
  });

  describe('processBlock', () => {
    it('should select best variant and include fallbacks', async () => {
      const block: Block = {
        id: 'test-block',
        kind: 'image',
        payload: {},
        variants: [
          { mediaType: 'image/avif', bytes: 40000, uri: 'test.avif' },
          { mediaType: 'image/webp', bytes: 50000, uri: 'test.webp' },
          { mediaType: 'image/jpeg', bytes: 80000, uri: 'test.jpg' },
          { mediaType: 'image/png', bytes: 120000, uri: 'test.png' }
        ]
      };

      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg', 'image/png']
      };

      const result = await processor.processBlock(block, capabilities);

      // Should have best variant first, followed by fallbacks
      expect(result.variants).toHaveLength(3); // Best + 2 fallbacks
      expect(result.variants[0].mediaType).toBe('image/webp'); // Best match
      expect(result.variants.slice(1)).toHaveLength(2); // 2 fallbacks
    });

    it('should handle block with no acceptable variants', async () => {
      const block: Block = {
        id: 'test-block',
        kind: 'image',
        payload: {},
        variants: [
          { mediaType: 'image/tiff', bytes: 100000, uri: 'test.tiff' },
          { mediaType: 'image/bmp', bytes: 200000, uri: 'test.bmp' }
        ]
      };

      const capabilities: Capabilities = {
        accept: ['image/png', 'image/jpeg']
      };

      const result = await processor.processBlock(block, capabilities);

      // Should return original variants when no acceptable variants found
      expect(result.variants).toHaveLength(2);
      expect(result.variants[0].mediaType).toBe('image/tiff'); // Fallback selection
    });

    it('should handle block with single variant', async () => {
      const block: Block = {
        id: 'test-block',
        kind: 'markdown',
        payload: {},
        variants: [
          { mediaType: 'text/markdown', uri: 'test.md' }
        ]
      };

      const capabilities: Capabilities = {
        accept: ['text/markdown']
      };

      const result = await processor.processBlock(block, capabilities);

      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].mediaType).toBe('text/markdown');
    });

    it('should handle empty variants array', async () => {
      const block: Block = {
        id: 'test-block',
        kind: 'markdown',
        payload: {},
        variants: []
      };

      const capabilities: Capabilities = {
        accept: ['text/markdown']
      };

      const result = await processor.processBlock(block, capabilities);

      expect(result.variants).toHaveLength(0);
    });
  });

  describe('representation filtering', () => {
    it('should filter blocks based on representation', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          { id: 'intro', kind: 'markdown', payload: {}, variants: [] },
          { id: 'chart', kind: 'mermaid', payload: {}, variants: [] },
          { id: 'conclusion', kind: 'markdown', payload: {}, variants: [] },
          { id: 'appendix', kind: 'markdown', payload: {}, variants: [] }
        ],
        representations: {
          'brief': {
            blocks: ['intro', 'conclusion']
          },
          'full': {
            blocks: ['intro', 'chart', 'conclusion', 'appendix']
          }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };

      // Test brief representation
      const briefResult = await processor.processContent(
        content, 
        capabilities, 
        { representation: 'brief' }
      );
      expect(briefResult.blocks).toHaveLength(2);
      expect(briefResult.blocks.map(b => b.id)).toEqual(['intro', 'conclusion']);

      // Test full representation
      const fullResult = await processor.processContent(
        content, 
        capabilities, 
        { representation: 'full' }
      );
      expect(fullResult.blocks).toHaveLength(4);
      expect(fullResult.blocks.map(b => b.id)).toEqual(['intro', 'chart', 'conclusion', 'appendix']);
    });

    it('should handle representation with non-existent block IDs', async () => {
      const content: ContentItem = {
        id: 'test-content',
        type: 'article',
        blocks: [
          { id: 'block1', kind: 'markdown', payload: {}, variants: [] }
        ],
        representations: {
          'test': {
            blocks: ['block1', 'nonexistent', 'block2']
          }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };

      const result = await processor.processContent(
        content, 
        capabilities, 
        { representation: 'test' }
      );

      // Should only include existing blocks
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].id).toBe('block1');
    });
  });
});
