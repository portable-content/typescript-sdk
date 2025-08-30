/**
 * @fileoverview Unit tests for validation functions
 */

import {
  validateContentManifest,
  validateContentItem, // deprecated alias
  validateBlock,
  validatePayloadSource,
  validateCapabilities,
  validateBlockContent,
} from '../../src/validation';

describe('Validation', () => {
  describe('validateContentManifest', () => {
    it('should validate a valid ContentManifest', () => {
      const validManifest = {
        id: 'test-id',
        type: 'document',
        title: 'Test Document',
        blocks: [
          {
            id: 'block-1',
            kind: 'markdown',
            content: {
              primary: {
                type: 'inline',
                mediaType: 'text/markdown',
                source: '# Test'
              }
            }
          }
        ]
      };

      const result = validateContentManifest(validManifest);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid ContentManifest', () => {
      const invalidManifest = {
        // Missing required id
        type: 'document',
        blocks: []
      };

      const result = validateContentManifest(invalidManifest);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('id');
    });

    it('should work with deprecated validateContentItem alias', () => {
      const validManifest = {
        id: 'test-id',
        type: 'document',
        blocks: []
      };

      const result = validateContentItem(validManifest);
      expect(result.success).toBe(true);
    });
  });

  describe('validateBlock', () => {
    it('should validate a valid Block', () => {
      const validBlock = {
        id: 'block-1',
        kind: 'markdown',
        content: {
          primary: {
            type: 'inline',
            mediaType: 'text/markdown',
            source: '# Test'
          }
        }
      };

      const result = validateBlock(validBlock);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid Block', () => {
      const invalidBlock = {
        // Missing required id
        kind: 'markdown',
        content: {
          primary: {
            type: 'inline',
            mediaType: 'text/markdown',
            source: '# Test'
          }
        }
      };

      const result = validateBlock(invalidBlock);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validatePayloadSource', () => {
    it('should validate a valid external PayloadSource', () => {
      const validPayloadSource = {
        type: 'external',
        mediaType: 'text/html',
        uri: 'https://example.com/content.html',
        width: 800,
        height: 600
      };

      const result = validatePayloadSource(validPayloadSource);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate a valid inline PayloadSource', () => {
      const validPayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: '# Test Content'
      };

      const result = validatePayloadSource(validPayloadSource);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid PayloadSource', () => {
      const invalidPayloadSource = {
        type: 'external',
        mediaType: 'text/html'
        // Missing required uri for external type
      };

      const result = validatePayloadSource(invalidPayloadSource);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject inline PayloadSource without source', () => {
      const invalidPayloadSource = {
        type: 'inline',
        mediaType: 'text/plain'
        // Missing required source for inline type
      };

      const result = validatePayloadSource(invalidPayloadSource);
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

  describe('validateBlockContent', () => {
    it('should validate valid BlockContent', () => {
      const validBlockContent = {
        primary: {
          type: 'inline',
          mediaType: 'text/markdown',
          source: '# Test Markdown'
        }
      };

      const result = validateBlockContent(validBlockContent);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate BlockContent with alternatives', () => {
      const validBlockContent = {
        primary: {
          type: 'external',
          mediaType: 'image/png',
          uri: 'https://example.com/image.png'
        },
        alternatives: [
          {
            type: 'external',
            mediaType: 'image/webp',
            uri: 'https://example.com/image.webp'
          }
        ]
      };

      const result = validateBlockContent(validBlockContent);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid BlockContent', () => {
      const invalidBlockContent = {
        // Missing required primary
        alternatives: []
      };

      const result = validateBlockContent(invalidBlockContent);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
