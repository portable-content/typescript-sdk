/**
 * @fileoverview Unit tests for validation functions
 */

import {
  validateContentItem,
  validateBlock,
  validateVariant,
  validateCapabilities,
  validateBlockPayload,
  isMarkdownBlockPayload,
  isMermaidBlockPayload,
  isImageBlockPayload,
} from '../../src/validation';

describe('Validation', () => {
  describe('validateContentItem', () => {
    it('should validate a valid ContentItem', () => {
      const validItem = {
        id: 'test-id',
        type: 'document',
        title: 'Test Document',
        blocks: [
          {
            id: 'block-1',
            kind: 'markdown',
            payload: { source: '# Test' },
            variants: []
          }
        ]
      };

      const result = validateContentItem(validItem);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid ContentItem', () => {
      const invalidItem = {
        // Missing required id
        type: 'document',
        blocks: []
      };

      const result = validateContentItem(invalidItem);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('id');
    });
  });

  describe('validateBlock', () => {
    it('should validate a valid Block', () => {
      const validBlock = {
        id: 'block-1',
        kind: 'markdown',
        payload: { source: '# Test' },
        variants: []
      };

      const result = validateBlock(validBlock);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid Block', () => {
      const invalidBlock = {
        // Missing required id
        kind: 'markdown',
        payload: { source: '# Test' },
        variants: []
      };

      const result = validateBlock(invalidBlock);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateVariant', () => {
    it('should validate a valid Variant', () => {
      const validVariant = {
        mediaType: 'text/html',
        uri: 'https://example.com/content.html',
        width: 800,
        height: 600
      };

      const result = validateVariant(validVariant);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid Variant', () => {
      const invalidVariant = {
        // Missing required mediaType
        uri: 'https://example.com/content.html'
      };

      const result = validateVariant(invalidVariant);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateCapabilities', () => {
    it('should validate valid Capabilities', () => {
      const validCapabilities = {
        accept: ['text/html', 'text/markdown'],
        hints: {
          width: 1024,
          height: 768,
          network: 'FAST' as const
        }
      };

      const result = validateCapabilities(validCapabilities);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid Capabilities', () => {
      const invalidCapabilities = {
        accept: [], // Empty array not allowed
        hints: {
          width: -100 // Negative width not allowed
        }
      };

      const result = validateCapabilities(invalidCapabilities);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Block Payload Type Guards', () => {
    it('should identify valid MarkdownBlockPayload', () => {
      const validPayload = { source: '# Test Markdown' };
      expect(isMarkdownBlockPayload(validPayload)).toBe(true);
    });

    it('should reject invalid MarkdownBlockPayload', () => {
      const invalidPayload = { content: 'missing source field' };
      expect(isMarkdownBlockPayload(invalidPayload)).toBe(false);
    });

    it('should identify valid MermaidBlockPayload', () => {
      const validPayload = { source: 'graph TD; A-->B', theme: 'dark' };
      expect(isMermaidBlockPayload(validPayload)).toBe(true);
    });

    it('should identify valid ImageBlockPayload', () => {
      const validPayload = { 
        uri: 'https://example.com/image.png',
        alt: 'Test image',
        width: 800,
        height: 600
      };
      expect(isImageBlockPayload(validPayload)).toBe(true);
    });

    it('should reject invalid ImageBlockPayload', () => {
      const invalidPayload = { uri: 'not-a-valid-url' };
      expect(isImageBlockPayload(invalidPayload)).toBe(false);
    });
  });

  describe('validateBlockPayload', () => {
    it('should validate known block payload types', () => {
      const markdownPayload = { source: '# Test' };
      const result = validateBlockPayload('markdown', markdownPayload);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(markdownPayload);
    });

    it('should accept unknown block types', () => {
      const customPayload = { customField: 'value' };
      const result = validateBlockPayload('custom-type', customPayload);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(customPayload);
    });

    it('should reject invalid known payload types', () => {
      const invalidPayload = { notSource: 'invalid' };
      const result = validateBlockPayload('markdown', invalidPayload);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
