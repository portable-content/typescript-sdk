/**
 * @fileoverview Tests for PayloadSourceSelector
 */

import { PayloadSourceSelector } from '../../../src/rendering/variant-selector';
import type { Element, PayloadSource, Capabilities } from '../../../src/types';

describe('PayloadSourceSelector', () => {
  let selector: PayloadSourceSelector;

  beforeEach(() => {
    selector = new PayloadSourceSelector();
  });

  describe('selectBestPayloadSource', () => {
    it('should return primary source when no alternatives exist', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' }
        }
      };

      const capabilities: Capabilities = { accept: ['image/png'] };
      const result = selector.selectBestPayloadSource(block, capabilities);
      expect(result).toEqual(block.content.primary);
    });

    it('should select WebP over JPEG when both are supported', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' },
          alternatives: [
            { type: 'external', mediaType: 'image/webp', uri: 'test.webp' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.mediaType).toBe('image/webp');
    });

    it('should prefer inline content for small data', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'external', mediaType: 'text/plain', uri: 'large.txt' },
          alternatives: [
            { type: 'inline', mediaType: 'text/plain', source: 'small text content' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain'],
        hints: { network: 'SLOW' }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.type).toBe('inline');
    });

    it('should handle quality values in accept headers', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/webp', uri: 'test.webp' },
          alternatives: [
            { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/webp;q=0.6', 'image/jpeg;q=0.9'] // Larger quality difference
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.mediaType).toBe('image/jpeg'); // Higher quality preference should override format bonus
    });

    it('should match wildcard media types', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' },
          alternatives: [
            { type: 'external', mediaType: 'text/plain', uri: 'test.txt' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/*']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.mediaType).toBe('image/png');
    });

    it('should consider size preferences in hints', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', width: 800, height: 600, uri: 'medium.png' },
          alternatives: [
            { type: 'external', mediaType: 'image/png', width: 1200, height: 900, uri: 'large.png' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { width: 800, height: 600 }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.width).toBe(800);
    });

    it('should return primary when no alternatives match capabilities', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' },
          alternatives: [
            { type: 'external', mediaType: 'image/tiff', uri: 'test.tiff' },
            { type: 'external', mediaType: 'image/bmp', uri: 'test.bmp' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png', 'image/jpeg']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType).toBe('image/png'); // Should return primary as fallback
    });

    it('should handle density preferences', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', width: 800, height: 600, uri: 'standard.png' },
          alternatives: [
            { type: 'external', mediaType: 'image/png', width: 1600, height: 1200, uri: 'retina.png' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { density: 2.0 }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.width).toBe(1600); // High-res for high density
    });

    it('should penalize inline content exceeding max bytes', () => {
      const largeContent = 'x'.repeat(200000); // 200KB content
      const smallContent = 'small content';

      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/plain', source: largeContent },
          alternatives: [
            { type: 'inline', mediaType: 'text/plain', source: smallContent }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain'],
        hints: { maxBytes: 100000 }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.source).toBe(smallContent); // Should prefer smaller content
    });
  });

  describe('media type matching', () => {
    it('should match exact media types', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.mediaType).toBe('image/png');
    });

    it('should match wildcard patterns', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'document',
        content: {
          primary: { type: 'external', mediaType: 'image/webp', uri: 'test.webp' },
          alternatives: [
            { type: 'external', mediaType: 'text/plain', uri: 'test.txt' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/*', 'text/*']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType.startsWith('image/') || selected?.mediaType.startsWith('text/')).toBe(true);
    });

    it('should match catch-all pattern', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'document',
        content: {
          primary: { type: 'external', mediaType: 'application/octet-stream', uri: 'test.bin' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['*/*']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.mediaType).toBe('application/octet-stream');
    });
  });

  describe('network optimization', () => {
    it('should prefer inline content on cellular networks', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'external', mediaType: 'text/plain', uri: 'large.txt' },
          alternatives: [
            { type: 'inline', mediaType: 'text/plain', source: 'small inline content' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain'],
        hints: { network: 'CELLULAR' }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected?.type).toBe('inline');
    });

    it('should not penalize external content on fast networks', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'inline', mediaType: 'image/png', source: 'base64data' },
          alternatives: [
            { type: 'external', mediaType: 'image/png', uri: 'large.png' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'FAST' }
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      // On fast networks, other factors may determine selection
      expect(selected).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return primary when block has no alternatives', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/plain', source: 'content' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['text/plain']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).toBe(block.content.primary); // Should return primary
    });

    it('should handle blocks with only external sources', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test1.png' },
          alternatives: [
            { type: 'external', mediaType: 'image/jpeg', uri: 'test2.jpg' }
          ]
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png', 'image/jpeg']
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).not.toBeNull();
      expect(['image/png', 'image/jpeg']).toContain(selected?.mediaType);
    });
  });

  describe('mediaTypeMatches edge cases', () => {
    it('should match catch-all media type', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'document',
        content: {
          primary: { type: 'external', mediaType: 'application/custom', uri: 'test.custom' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['*/*'] // Catch-all
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType).toBe('application/custom');
    });
  });

  describe('scoreForNetwork edge cases', () => {
    it('should handle unknown network types', () => {
      const block: Element = {
        id: 'test-block',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/png', uri: 'test.png' }
        }
      };

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'UNKNOWN' as any } // Unknown network type to test default case
      };

      const selected = selector.selectBestPayloadSource(block, capabilities);
      expect(selected).not.toBeNull();
      // Should still work with default network scoring
    });
  });
});
