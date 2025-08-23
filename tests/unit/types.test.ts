/**
 * @fileoverview Unit tests for type definitions
 */

import {
  DEFAULT_CAPABILITIES,
  isMarkdownBlock,
  isMermaidBlock,
  isImageBlock,
  getTypedPayload,
  getKnownPayload,
  ContentItemBuilder,
  BlockBuilder,
  VariantBuilder
} from '../../src/types';
import type { Block, MarkdownBlockPayload } from '../../src/types';

describe('Types', () => {
  describe('Block Type Guards', () => {
    const markdownBlock: Block = {
      id: 'test-1',
      kind: 'markdown',
      payload: { source: '# Test' },
      variants: []
    };

    const mermaidBlock: Block = {
      id: 'test-2',
      kind: 'mermaid',
      payload: { source: 'graph TD; A-->B' },
      variants: []
    };

    const imageBlock: Block = {
      id: 'test-3',
      kind: 'image',
      payload: { uri: 'https://example.com/image.png' },
      variants: []
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

  describe('Payload Extraction', () => {
    const markdownBlock: Block = {
      id: 'test-1',
      kind: 'markdown',
      payload: { source: '# Test' },
      variants: []
    };

    it('should extract typed payload with validation', () => {
      const isMarkdownPayload = (payload: unknown): payload is MarkdownBlockPayload => {
        return typeof payload === 'object' && payload !== null && 'source' in payload;
      };

      const payload = getTypedPayload(markdownBlock, isMarkdownPayload);
      expect(payload).toEqual({ source: '# Test' });
    });

    it('should return null for invalid payload', () => {
      const isMarkdownPayload = (payload: unknown): payload is MarkdownBlockPayload => {
        return typeof payload === 'object' && payload !== null && 'source' in payload;
      };

      const invalidBlock: Block = {
        id: 'test-1',
        kind: 'markdown',
        payload: { invalid: true },
        variants: []
      };

      const payload = getTypedPayload(invalidBlock, isMarkdownPayload);
      expect(payload).toBeNull();
    });

    it('should extract known payload types', () => {
      const payload = getKnownPayload(markdownBlock, 'markdown');
      expect(payload).toEqual({ source: '# Test' });
    });

    it('should return null for mismatched kind', () => {
      const payload = getKnownPayload(markdownBlock, 'image');
      expect(payload).toBeNull();
    });
  });

  describe('Builders', () => {
    it('should build ContentItem correctly', () => {
      const item = new ContentItemBuilder('test-id', 'document')
        .title('Test Document')
        .summary('A test document')
        .createdBy('test-user')
        .build();

      expect(item.id).toBe('test-id');
      expect(item.type).toBe('document');
      expect(item.title).toBe('Test Document');
      expect(item.summary).toBe('A test document');
      expect(item.createdBy).toBe('test-user');
      expect(item.blocks).toEqual([]);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should build Block correctly', () => {
      const block = new BlockBuilder('block-id', 'markdown')
        .payload({ source: '# Test' })
        .build();

      expect(block.id).toBe('block-id');
      expect(block.kind).toBe('markdown');
      expect(block.payload).toEqual({ source: '# Test' });
      expect(block.variants).toEqual([]);
    });

    it('should build Variant correctly', () => {
      const variant = new VariantBuilder('text/html')
        .uri('https://example.com/content.html')
        .dimensions(800, 600)
        .bytes(1024)
        .contentHash('abc123')
        .generatedBy('test-tool', '1.0.0')
        .build();

      expect(variant.mediaType).toBe('text/html');
      expect(variant.uri).toBe('https://example.com/content.html');
      expect(variant.width).toBe(800);
      expect(variant.height).toBe(600);
      expect(variant.bytes).toBe(1024);
      expect(variant.contentHash).toBe('abc123');
      expect(variant.generatedBy).toBe('test-tool');
      expect(variant.toolVersion).toBe('1.0.0');
      expect(variant.createdAt).toBeDefined();
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
