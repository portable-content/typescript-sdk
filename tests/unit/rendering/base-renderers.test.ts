/**
 * @fileoverview Tests for base renderer classes
 */

import { BaseBlockRenderer, BaseTextRenderer, BaseImageRenderer } from '../../../src/rendering/base-renderers';
import type { Block, Variant, Capabilities } from '../../../src/types';
import type { RenderContext, RenderResult } from '../../../src/rendering/interfaces';

// Mock implementation of BaseBlockRenderer for testing
class TestBlockRenderer extends BaseBlockRenderer<{ text: string }, string> {
  readonly kind = 'test';
  readonly priority = 1;

  async render(block: Block, props: { text: string }, context: RenderContext): Promise<RenderResult<string>> {
    const variant = this.selectVariant(block, context);
    return {
      content: `Rendered: ${props.text}`,
      variant
    };
  }
}

// Mock implementation of BaseTextRenderer for testing
class TestTextRenderer extends BaseTextRenderer<{ style: string }, string> {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block: Block, props: { style: string }, context: RenderContext): Promise<RenderResult<string>> {
    const variant = this.selectVariant(block, context);
    if (!variant) {
      return { content: 'No variant', variant: null };
    }

    try {
      const text = await this.getTextContent(variant);
      return {
        content: `${props.style}: ${text}`,
        variant
      };
    } catch (error) {
      this.handleError(error as Error, context);
      return {
        content: 'Error loading text',
        variant,
        errors: [(error as Error).message]
      };
    }
  }
}

// Mock implementation of BaseImageRenderer for testing
class TestImageRenderer extends BaseImageRenderer<{ alt: string }, { src: string; alt: string }> {
  readonly kind = 'image';
  readonly priority = 1;

  async render(block: Block, props: { alt: string }, context: RenderContext): Promise<RenderResult<{ src: string; alt: string }>> {
    const variant = this.selectVariant(block, context);
    if (!variant || !this.isImageVariant(variant)) {
      return { content: { src: '', alt: props.alt }, variant: null };
    }

    const dimensions = this.getImageDimensions(variant);
    return {
      content: { src: variant.uri || '', alt: props.alt },
      variant,
      metadata: dimensions
    };
  }
}

// Mock fetch for testing
global.fetch = jest.fn();

describe('BaseBlockRenderer', () => {
  let renderer: TestBlockRenderer;
  let mockContext: RenderContext;

  beforeEach(() => {
    renderer = new TestBlockRenderer();
    mockContext = {
      capabilities: { accept: ['text/plain'] }
    };
  });

  describe('canRender', () => {
    it('should return true for matching block kind with renderable variant', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        payload: {},
        variants: [{ mediaType: 'text/plain', uri: 'test.txt' }]
      };

      expect(renderer.canRender(block, mockContext)).toBe(true);
    });

    it('should return false for non-matching block kind', () => {
      const block: Block = {
        id: 'test',
        kind: 'other',
        payload: {},
        variants: [{ mediaType: 'text/plain', uri: 'test.txt' }]
      };

      expect(renderer.canRender(block, mockContext)).toBe(false);
    });

    it('should return false when no renderable variants exist', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        payload: {},
        variants: [] // No variants at all
      };

      expect(renderer.canRender(block, mockContext)).toBe(false);
    });
  });

  describe('getDefaultProps', () => {
    it('should return empty object by default', () => {
      expect(renderer.getDefaultProps()).toEqual({});
    });
  });

  describe('validateProps', () => {
    it('should return empty array by default', () => {
      expect(renderer.validateProps({ text: 'test' })).toEqual([]);
    });
  });

  describe('selectVariant', () => {
    it('should select best variant based on capabilities', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        payload: {},
        variants: [
          { mediaType: 'text/html', uri: 'test.html' },
          { mediaType: 'text/plain', uri: 'test.txt' }
        ]
      };

      const variant = renderer['selectVariant'](block, mockContext);
      expect(variant?.mediaType).toBe('text/plain');
    });
  });

  describe('error handling', () => {
    it('should call onError callback when provided', () => {
      const onError = jest.fn();
      const contextWithError = { ...mockContext, onError };
      const error = new Error('Test error');

      renderer['handleError'](error, contextWithError);
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should log to console when no onError callback provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      renderer['handleError'](error, mockContext);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rendering error in test renderer:'),
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loading state', () => {
    it('should call onLoading callback when provided', () => {
      const onLoading = jest.fn();
      const contextWithLoading = { ...mockContext, onLoading };

      renderer['setLoading'](true, contextWithLoading);
      expect(onLoading).toHaveBeenCalledWith(true);

      renderer['setLoading'](false, contextWithLoading);
      expect(onLoading).toHaveBeenCalledWith(false);
    });

    it('should not throw when no onLoading callback provided', () => {
      expect(() => renderer['setLoading'](true, mockContext)).not.toThrow();
    });
  });
});

describe('BaseTextRenderer', () => {
  let renderer: TestTextRenderer;
  let mockContext: RenderContext;

  beforeEach(() => {
    renderer = new TestTextRenderer();
    mockContext = {
      capabilities: { accept: ['text/markdown'] }
    };
    (fetch as jest.Mock).mockClear();
  });

  describe('getTextContent', () => {
    it('should fetch and return text content', async () => {
      const variant: Variant = {
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# Test Content')
      });

      const content = await renderer['getTextContent'](variant);
      expect(content).toBe('# Test Content');
      expect(fetch).toHaveBeenCalledWith('https://example.com/test.md');
    });

    it('should throw error when variant has no URI', async () => {
      const variant: Variant = {
        mediaType: 'text/markdown'
      };

      await expect(renderer['getTextContent'](variant)).rejects.toThrow('Variant has no URI for text content');
    });

    it('should throw error when fetch fails', async () => {
      const variant: Variant = {
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(renderer['getTextContent'](variant)).rejects.toThrow('Failed to fetch text content: Not Found');
    });

    it('should throw error when network request fails', async () => {
      const variant: Variant = {
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(renderer['getTextContent'](variant)).rejects.toThrow('Failed to load text content: Error: Network error');
    });
  });
});

describe('BaseImageRenderer', () => {
  let renderer: TestImageRenderer;
  let mockContext: RenderContext;

  beforeEach(() => {
    renderer = new TestImageRenderer();
    mockContext = {
      capabilities: { accept: ['image/png'] }
    };
  });

  describe('isImageVariant', () => {
    it('should return true for image media types', () => {
      const variants = [
        { mediaType: 'image/png' },
        { mediaType: 'image/jpeg' },
        { mediaType: 'image/webp' },
        { mediaType: 'image/svg+xml' }
      ];

      variants.forEach(variant => {
        expect(renderer['isImageVariant'](variant)).toBe(true);
      });
    });

    it('should return false for non-image media types', () => {
      const variants = [
        { mediaType: 'text/plain' },
        { mediaType: 'application/json' },
        { mediaType: 'video/mp4' }
      ];

      variants.forEach(variant => {
        expect(renderer['isImageVariant'](variant)).toBe(false);
      });
    });
  });

  describe('getImageDimensions', () => {
    it('should return dimensions when available', () => {
      const variant: Variant = {
        mediaType: 'image/png',
        width: 800,
        height: 600
      };

      const dimensions = renderer['getImageDimensions'](variant);
      expect(dimensions).toEqual({ width: 800, height: 600 });
    });

    it('should return undefined dimensions when not available', () => {
      const variant: Variant = {
        mediaType: 'image/png'
      };

      const dimensions = renderer['getImageDimensions'](variant);
      expect(dimensions).toEqual({ width: undefined, height: undefined });
    });
  });
});
