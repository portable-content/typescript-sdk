/**
 * @fileoverview Tests for base renderer classes
 */

import { BaseBlockRenderer, BaseTextRenderer, BaseImageRenderer } from '../../../src/rendering/base-renderers';
import type { Block, PayloadSource, Capabilities } from '../../../src/types';
import type { RenderContext, RenderResult } from '../../../src/rendering/interfaces';

// Mock implementation of BaseBlockRenderer for testing
class TestBlockRenderer extends BaseBlockRenderer<{ text: string }, string> {
  readonly kind = 'test';
  readonly priority = 1;

  async render(block: Block, props: { text: string }, context: RenderContext): Promise<RenderResult<string>> {
    const payloadSource = this.selectPayloadSource(block, context);
    return {
      content: `Rendered: ${props.text}`,
      payloadSource
    };
  }
}

// Mock implementation of BaseTextRenderer for testing
class TestTextRenderer extends BaseTextRenderer<{ style: string }, string> {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block: Block, props: { style: string }, context: RenderContext): Promise<RenderResult<string>> {
    const payloadSource = this.selectPayloadSource(block, context);
    if (!payloadSource) {
      return { content: 'No payload source', payloadSource: null };
    }

    try {
      const text = await this.getTextContent(payloadSource);
      return {
        content: `${props.style}: ${text}`,
        payloadSource
      };
    } catch (error) {
      this.handleError(error as Error, context);
      return {
        content: 'Error loading text',
        payloadSource,
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
    const payloadSource = this.selectPayloadSource(block, context);
    if (!payloadSource || !this.isImagePayloadSource(payloadSource)) {
      return { content: { src: '', alt: props.alt }, payloadSource: null };
    }

    const dimensions = this.getImageDimensions(payloadSource);
    const src = payloadSource.type === 'external' ? payloadSource.uri || '' : `data:${payloadSource.mediaType};base64,${payloadSource.source}`;
    return {
      content: { src, alt: props.alt },
      payloadSource,
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
    it('should return true for matching block kind with renderable payload source', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        content: {
          primary: { type: 'external', mediaType: 'text/plain', uri: 'test.txt' }
        }
      };

      expect(renderer.canRender(block, mockContext)).toBe(true);
    });

    it('should return false for non-matching block kind', () => {
      const block: Block = {
        id: 'test',
        kind: 'other',
        content: {
          primary: { type: 'external', mediaType: 'text/plain', uri: 'test.txt' }
        }
      };

      expect(renderer.canRender(block, mockContext)).toBe(false);
    });

    it('should return false when no renderable payload sources exist', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        content: {
          primary: { type: 'external', mediaType: 'application/unknown', uri: 'test.bin' }
        }
      };

      mockContext.capabilities.accept = ['text/plain']; // Different from block's media type
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

  describe('selectPayloadSource', () => {
    it('should select best payload source based on capabilities', () => {
      const block: Block = {
        id: 'test',
        kind: 'test',
        content: {
          primary: { type: 'external', mediaType: 'text/html', uri: 'test.html' },
          alternatives: [
            { type: 'external', mediaType: 'text/plain', uri: 'test.txt' }
          ]
        }
      };

      const payloadSource = renderer['selectPayloadSource'](block, mockContext);
      expect(payloadSource?.mediaType).toBe('text/plain');
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
    it('should fetch and return text content from external source', async () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# Test Content')
      });

      const content = await renderer['getTextContent'](payloadSource);
      expect(content).toBe('# Test Content');
      expect(fetch).toHaveBeenCalledWith('https://example.com/test.md');
    });

    it('should return inline content directly', async () => {
      const payloadSource: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: '# Inline Content'
      };

      const content = await renderer['getTextContent'](payloadSource);
      expect(content).toBe('# Inline Content');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when external source has no URI', async () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown'
      } as PayloadSource;

      await expect(renderer['getTextContent'](payloadSource)).rejects.toThrow('External payload source has no URI for text content');
    });

    it('should throw error when fetch fails', async () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(renderer['getTextContent'](payloadSource)).rejects.toThrow('Failed to fetch text content: Not Found');
    });

    it('should throw error when network request fails', async () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'https://example.com/test.md'
      };

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(renderer['getTextContent'](payloadSource)).rejects.toThrow('Failed to load text content: Error: Network error');
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

  describe('isImagePayloadSource', () => {
    it('should return true for image media types', () => {
      const payloadSources = [
        { type: 'external', mediaType: 'image/png', uri: 'test.png' },
        { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' },
        { type: 'external', mediaType: 'image/webp', uri: 'test.webp' },
        { type: 'external', mediaType: 'image/svg+xml', uri: 'test.svg' }
      ] as PayloadSource[];

      payloadSources.forEach(payloadSource => {
        expect(renderer['isImagePayloadSource'](payloadSource)).toBe(true);
      });
    });

    it('should return false for non-image media types', () => {
      const payloadSources = [
        { type: 'inline', mediaType: 'text/plain', source: 'text' },
        { type: 'external', mediaType: 'application/json', uri: 'data.json' },
        { type: 'external', mediaType: 'video/mp4', uri: 'video.mp4' }
      ] as PayloadSource[];

      payloadSources.forEach(payloadSource => {
        expect(renderer['isImagePayloadSource'](payloadSource)).toBe(false);
      });
    });
  });

  describe('getImageDimensions', () => {
    it('should return dimensions when available', () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'image/png',
        uri: 'test.png',
        width: 800,
        height: 600
      };

      const dimensions = renderer['getImageDimensions'](payloadSource);
      expect(dimensions).toEqual({ width: 800, height: 600 });
    });

    it('should return undefined dimensions when not available', () => {
      const payloadSource: PayloadSource = {
        type: 'external',
        mediaType: 'image/png',
        uri: 'test.png'
      };

      const dimensions = renderer['getImageDimensions'](payloadSource);
      expect(dimensions).toEqual({ width: undefined, height: undefined });
    });
  });
});
