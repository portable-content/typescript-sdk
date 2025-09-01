/**
 * @fileoverview Tests for DefaultContentProcessor
 */

import { DefaultContentProcessor } from '../../../src/rendering/content-processor';
import type { ContentManifest, Element, PayloadSource, Capabilities } from '../../../src/types';

describe('DefaultContentProcessor', () => {
  let processor: DefaultContentProcessor;

  beforeEach(() => {
    processor = new DefaultContentProcessor();
  });

  describe('processContent', () => {
    it('should process content with multiple blocks', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          {
            id: 'element1',
            kind: 'markdown',
            content: {
              primary: { type: 'external', mediaType: 'text/markdown', uri: 'test.md' },
              alternatives: [
                { type: 'external', mediaType: 'text/html', uri: 'test.html' }
              ]
            }
          },
          {
            id: 'element2',
            kind: 'image',
            content: {
              primary: { type: 'external', mediaType: 'image/webp', uri: 'test.webp' },
              alternatives: [
                { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' }
              ]
            }
          }
        ]
      };

      const capabilities: Capabilities = {
        accept: ['text/html', 'image/webp']
      };

      const result = await processor.processContent(content, capabilities);

      expect(result.elements).toHaveLength(2);
      // The elements should remain unchanged since the processor now just returns the original elements
      expect(result.elements[0].content.primary.mediaType).toBe('text/markdown');
      expect(result.elements[1].content.primary.mediaType).toBe('image/webp');
    });

    it('should apply representation filtering when specified', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          { id: 'element1', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' } } },
          { id: 'element2', kind: 'image', content: { primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' } } },
          { id: 'element3', kind: 'mermaid', content: { primary: { type: 'inline', mediaType: 'text/plain', source: 'graph TD; A-->B;' } } }
        ],
        representations: {
          'summary': {
            elements: ['element1', 'element3']
          }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'summary' };

      const result = await processor.processContent(content, capabilities, options);

      expect(result.elements).toHaveLength(2);
      expect(result.elements.map(b => b.id)).toEqual(['element1', 'element3']);
    });

    it('should handle non-existent representation gracefully', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          { id: 'element1', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' } } }
        ],
        representations: {
          'summary': { elements: ['element1'] }
        }
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'nonexistent' };

      const result = await processor.processContent(content, capabilities, options);

      // Should return original content when representation doesn't exist
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].id).toBe('element1');
    });

    it('should handle content without representations', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          { id: 'element1', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' } } }
        ]
      };

      const capabilities: Capabilities = { accept: ['*/*'] };
      const options = { representation: 'summary' };

      const result = await processor.processContent(content, capabilities, options);

      // Should return original content when no representations defined
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].id).toBe('element1');
    });
  });

  describe('processElement', () => {
    it('should return block unchanged with new content structure', async () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/webp', uri: 'test.webp' },
          alternatives: [
            { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' },
            { type: 'external', mediaType: 'image/png', uri: 'test.png' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg', 'image/png']
      };

      const result = await processor.processElement(block, capabilities);

      // With new structure, block is returned unchanged
      expect(result).toEqual(block);
      expect(result.content.primary.mediaType).toBe('image/webp');
      expect(result.content.alternatives).toHaveLength(2);
    });

    it('should handle block with only primary content', async () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/plain', source: 'Hello world' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain']
      };

      const result = await processor.processElement(block, capabilities);

      // Should return block unchanged
      expect(result).toEqual(block);
      expect(result.content.primary.source).toBe('Hello world');
    });

    it('should handle block with source content', async () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'external', mediaType: 'text/html', uri: 'test.html' },
          source: { type: 'inline', mediaType: 'text/markdown', source: '# Test' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/markdown', 'text/html']
      };

      const result = await processor.processElement(block, capabilities);

      expect(result).toEqual(block);
      expect(result.content.source?.source).toBe('# Test');
    });

    it('should handle block with no alternatives', async () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/plain', source: 'Simple text' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain']
      };

      const result = await processor.processElement(block, capabilities);

      expect(result).toEqual(block);
      expect(result.content.alternatives).toBeUndefined();
    });
  });

  describe('representation filtering', () => {
    it('should filter blocks based on representation', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          { id: 'intro', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Intro' } } },
          { id: 'chart', kind: 'mermaid', content: { primary: { type: 'inline', mediaType: 'text/plain', source: 'graph TD; A-->B;' } } },
          { id: 'conclusion', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Conclusion' } } },
          { id: 'appendix', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Appendix' } } }
        ],
        representations: {
          'brief': {
            elements: ['intro', 'conclusion']
          },
          'full': {
            elements: ['intro', 'chart', 'conclusion', 'appendix']
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
      expect(briefResult.elements).toHaveLength(2);
      expect(briefResult.elements.map(b => b.id)).toEqual(['intro', 'conclusion']);

      // Test full representation
      const fullResult = await processor.processContent(
        content,
        capabilities,
        { representation: 'full' }
      );
      expect(fullResult.elements).toHaveLength(4);
      expect(fullResult.elements.map(b => b.id)).toEqual(['intro', 'chart', 'conclusion', 'appendix']);
    });

    it('should handle representation with non-existent block IDs', async () => {
      const content: ContentManifest = {
        id: 'test-content',
        type: 'article',
        elements: [
          { id: 'element1', kind: 'markdown', content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' } } }
        ],
        representations: {
          'test': {
            elements: ['element1', 'nonexistent', 'element2']
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
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].id).toBe('element1');
    });
  });
});
