/**
 * @fileoverview Tests for VariantSelector
 */

import { VariantSelector } from '../../../src/rendering/variant-selector';
import type { Variant, Capabilities } from '../../../src/types';

describe('VariantSelector', () => {
  let selector: VariantSelector;

  beforeEach(() => {
    selector = new VariantSelector();
  });

  describe('selectBestVariant', () => {
    it('should return null for empty variants array', () => {
      const capabilities: Capabilities = { accept: ['image/png'] };
      const result = selector.selectBestVariant([], capabilities);
      expect(result).toBeNull();
    });

    it('should select WebP over JPEG when both are supported', () => {
      const variants: Variant[] = [
        { mediaType: 'image/jpeg', bytes: 100000, uri: 'test.jpg' },
        { mediaType: 'image/webp', bytes: 80000, uri: 'test.webp' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/webp', 'image/jpeg']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.mediaType).toBe('image/webp');
    });

    it('should prefer smaller files on slow networks', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 200000, uri: 'large.png' },
        { mediaType: 'image/png', bytes: 100000, uri: 'small.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'SLOW' }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.bytes).toBe(100000);
    });

    it('should handle quality values in accept headers', () => {
      const variants: Variant[] = [
        { mediaType: 'image/webp', bytes: 80000, uri: 'test.webp' },
        { mediaType: 'image/jpeg', bytes: 100000, uri: 'test.jpg' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/webp;q=0.6', 'image/jpeg;q=0.9'] // Larger quality difference
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.mediaType).toBe('image/jpeg'); // Higher quality preference should override format bonus
    });

    it('should match wildcard media types', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 100000, uri: 'test.png' },
        { mediaType: 'text/plain', bytes: 1000, uri: 'test.txt' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/*']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.mediaType).toBe('image/png');
    });

    it('should consider size preferences in hints', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', width: 800, height: 600, bytes: 100000, uri: 'medium.png' },
        { mediaType: 'image/png', width: 1200, height: 900, bytes: 200000, uri: 'large.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { width: 800, height: 600 }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.width).toBe(800);
    });

    it('should return fallback variant when no variants match capabilities', () => {
      const variants: Variant[] = [
        { mediaType: 'image/tiff', bytes: 100000, uri: 'test.tiff' },
        { mediaType: 'image/bmp', bytes: 200000, uri: 'test.bmp' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png', 'image/jpeg']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType).toBe('image/tiff'); // Smallest fallback
    });

    it('should handle density preferences', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', width: 800, height: 600, bytes: 100000, uri: 'standard.png' },
        { mediaType: 'image/png', width: 1600, height: 1200, bytes: 300000, uri: 'retina.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { density: 2.0 }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.width).toBe(1600); // High-res for high density
    });

    it('should penalize variants exceeding max bytes', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 50000, uri: 'small.png' },
        { mediaType: 'image/png', bytes: 200000, uri: 'large.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { maxBytes: 100000 }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.bytes).toBe(50000); // Should prefer smaller file
    });
  });

  describe('media type matching', () => {
    it('should match exact media types', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', uri: 'test.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.mediaType).toBe('image/png');
    });

    it('should match wildcard patterns', () => {
      const variants: Variant[] = [
        { mediaType: 'image/webp', uri: 'test.webp' },
        { mediaType: 'text/plain', uri: 'test.txt' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/*', 'text/*']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType.startsWith('image/') || selected?.mediaType.startsWith('text/')).toBe(true);
    });

    it('should match catch-all pattern', () => {
      const variants: Variant[] = [
        { mediaType: 'application/octet-stream', uri: 'test.bin' }
      ];

      const capabilities: Capabilities = {
        accept: ['*/*']
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.mediaType).toBe('application/octet-stream');
    });
  });

  describe('network optimization', () => {
    it('should prefer smaller files on cellular networks', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 50000, uri: 'small.png' },
        { mediaType: 'image/png', bytes: 500000, uri: 'large.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'CELLULAR' }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected?.bytes).toBe(50000);
    });

    it('should not penalize large files on fast networks', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 50000, uri: 'small.png' },
        { mediaType: 'image/png', bytes: 500000, uri: 'large.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'FAST' }
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      // On fast networks, other factors may determine selection
      expect(selected).not.toBeNull();
    });
  });

  describe('selectFallbackVariant edge cases', () => {
    it('should return first variant when no accessible variants exist', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 100000 }, // No URI
        { mediaType: 'image/jpeg', bytes: 200000 } // No URI
      ];

      const capabilities: Capabilities = {
        accept: ['text/plain'] // No matching media types
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).toBe(variants[0]); // Should return first variant as fallback
    });

    it('should handle accessible variants without bytes', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', uri: 'test1.png' }, // Has URI but no bytes
        { mediaType: 'image/jpeg', uri: 'test2.jpg' } // Has URI but no bytes
      ];

      const capabilities: Capabilities = {
        accept: ['text/plain'] // No matching media types
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).toBe(variants[0]); // Should return first accessible variant
    });
  });

  describe('mediaTypeMatches edge cases', () => {
    it('should match catch-all media type', () => {
      const variants: Variant[] = [
        { mediaType: 'application/custom', bytes: 100000, uri: 'test.custom' }
      ];

      const capabilities: Capabilities = {
        accept: ['*/*'] // Catch-all
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).not.toBeNull();
      expect(selected?.mediaType).toBe('application/custom');
    });
  });

  describe('scoreForNetwork edge cases', () => {
    it('should handle unknown network types', () => {
      const variants: Variant[] = [
        { mediaType: 'image/png', bytes: 1000000, uri: 'test.png' }
      ];

      const capabilities: Capabilities = {
        accept: ['image/png'],
        hints: { network: 'UNKNOWN' as any } // Unknown network type to test default case
      };

      const selected = selector.selectBestVariant(variants, capabilities);
      expect(selected).not.toBeNull();
      // Should still work with default network scoring
    });
  });
});
