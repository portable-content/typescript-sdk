/**
 * @fileoverview Unit tests for type definitions
 */

import {
  DEFAULT_CAPABILITIES,
  isMarkdownBlock,
  isMermaidBlock,
  isImageBlock,
  getTypedContent,
  getPrimaryContent,
  getSourceContent,
  getAlternativeContent,
  ContentManifestBuilder,
  BlockBuilder,
  PayloadSourceBuilder
} from '../../src/types';
import type { Block } from '../../src/types';

describe('Types', () => {
  describe('Block Type Guards', () => {
    const markdownBlock: Block = {
      id: 'test-1',
      kind: 'markdown',
      content: {
        primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' }
      }
    };

    const mermaidBlock: Block = {
      id: 'test-2',
      kind: 'mermaid',
      content: {
        primary: { type: 'external', mediaType: 'image/svg+xml', uri: 'diagram.svg' },
        source: { type: 'inline', mediaType: 'text/plain', source: 'graph TD; A-->B' }
      }
    };

    const imageBlock: Block = {
      id: 'test-3',
      kind: 'image',
      content: {
        primary: { type: 'external', mediaType: 'image/png', uri: 'https://example.com/image.png' }
      }
    };

    it('should correctly identify markdown blocks', () => {
      expect(isMarkdownBlock(markdownBlock)).toBe(true);
      expect(isMarkdownBlock(mermaidBlock)).toBe(false);
      expect(isMarkdownBlock(imageBlock)).toBe(false);
    });

    it('should correctly identify mermaid blocks', () => {
      expect(isMermaidBlock(mermaidBlock)).toBe(true);
      expect(isMermaidBlock(markdownBlock)).toBe(false);
      expect(isMermaidBlock(imageBlock)).toBe(false);
    });

    it('should correctly identify image blocks', () => {
      expect(isImageBlock(imageBlock)).toBe(true);
      expect(isImageBlock(markdownBlock)).toBe(false);
      expect(isImageBlock(mermaidBlock)).toBe(false);
    });
  });

  describe('Content Extraction', () => {
    const markdownBlock: Block = {
      id: 'test-1',
      kind: 'markdown',
      content: {
        primary: { type: 'inline', mediaType: 'text/markdown', source: '# Test' },
        alternatives: [
          { type: 'external', mediaType: 'text/html', uri: 'test.html' }
        ]
      }
    };

    it('should extract typed content', () => {
      const content = getTypedContent(markdownBlock, 'markdown');
      expect(content).toEqual(markdownBlock.content);
    });

    it('should return null for mismatched kind', () => {
      const content = getTypedContent(markdownBlock, 'image');
      expect(content).toBeNull();
    });

    it('should extract primary content', () => {
      const primary = getPrimaryContent(markdownBlock);
      expect(primary).toEqual({
        type: 'inline',
        mediaType: 'text/markdown',
        source: '# Test'
      });
    });

    it('should extract source content', () => {
      const source = getSourceContent(markdownBlock);
      expect(source).toBeNull(); // This block has no source content
    });

    it('should extract alternative content', () => {
      const alternatives = getAlternativeContent(markdownBlock);
      expect(alternatives).toEqual([
        { type: 'external', mediaType: 'text/html', uri: 'test.html' }
      ]);
    });
  });

  describe('Builders', () => {
    it('should build ContentManifest correctly', () => {
      const manifest = new ContentManifestBuilder('test-id', 'document')
        .title('Test Document')
        .summary('A test document')
        .createdBy('test-user')
        .build();

      expect(manifest.id).toBe('test-id');
      expect(manifest.type).toBe('document');
      expect(manifest.title).toBe('Test Document');
      expect(manifest.summary).toBe('A test document');
      expect(manifest.createdBy).toBe('test-user');
      expect(manifest.blocks).toEqual([]);
      expect(manifest.createdAt).toBeDefined();
      expect(manifest.updatedAt).toBeDefined();
    });

    it('should build Block correctly', () => {
      const primary = PayloadSourceBuilder.inline('text/markdown')
        .source('# Test')
        .build();

      const block = new BlockBuilder('block-id', 'markdown')
        .primary(primary)
        .build();

      expect(block.id).toBe('block-id');
      expect(block.kind).toBe('markdown');
      expect(block.content.primary).toEqual({
        type: 'inline',
        mediaType: 'text/markdown',
        source: '# Test'
      });
    });

    it('should build PayloadSource correctly', () => {
      const externalSource = PayloadSourceBuilder.external('text/html')
        .uri('https://example.com/content.html')
        .dimensions(800, 600)
        .build();

      expect(externalSource.type).toBe('external');
      expect(externalSource.mediaType).toBe('text/html');
      expect(externalSource.uri).toBe('https://example.com/content.html');
      expect(externalSource.width).toBe(800);
      expect(externalSource.height).toBe(600);

      const inlineSource = PayloadSourceBuilder.inline('text/plain')
        .source('Hello world')
        .build();

      expect(inlineSource.type).toBe('inline');
      expect(inlineSource.mediaType).toBe('text/plain');
      expect(inlineSource.source).toBe('Hello world');
    });
  });

  describe('DEFAULT_CAPABILITIES', () => {
    it('should have default accept types', () => {
      expect(DEFAULT_CAPABILITIES.accept).toContain('text/html');
      expect(DEFAULT_CAPABILITIES.accept).toContain('text/markdown');
      expect(DEFAULT_CAPABILITIES.accept).toContain('image/jpeg');
    });

    it('should have default hints', () => {
      expect(DEFAULT_CAPABILITIES.hints).toBeDefined();
      expect(DEFAULT_CAPABILITIES.hints?.width).toBe(1024);
      expect(DEFAULT_CAPABILITIES.hints?.height).toBe(768);
      expect(DEFAULT_CAPABILITIES.hints?.density).toBe(1.0);
      expect(DEFAULT_CAPABILITIES.hints?.network).toBe('FAST');
    });
  });
});
