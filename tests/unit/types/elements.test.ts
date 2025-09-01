/**
 * @fileoverview Tests for element type utilities and type guards
 */

import {
  isMarkdownElement,
  isMermaidElement,
  isImageElement,
  isVideoElement,
  isDocumentElement,
  getTypedContent,
  getPrimaryContent,
  getSourceContent,
  getAlternativeContent,
  getBestAlternative,
  getElementVariants,
  getVariantById,
  getTransformConfigs
} from '../../../src/types/elements';
import type { Element, PayloadSource, ElementVariant, TransformConfig } from '../../../src/types/core';

describe('Element Type Guards', () => {
  describe('isMarkdownElement', () => {
    it('should return true for markdown elements', () => {
      const element: Element = {
        id: 'md-1',
        kind: 'markdown',
        content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' } }
      };
      expect(isMarkdownElement(element)).toBe(true);
    });

    it('should return false for non-markdown elements', () => {
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
      };
      expect(isMarkdownElement(element)).toBe(false);
    });
  });

  describe('isMermaidElement', () => {
    it('should return true for mermaid elements', () => {
      const element: Element = {
        id: 'mermaid-1',
        kind: 'mermaid',
        content: { primary: { type: 'inline', mediaType: 'image/svg+xml', source: '<svg>...</svg>' } }
      };
      expect(isMermaidElement(element)).toBe(true);
    });

    it('should return false for non-mermaid elements', () => {
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
      };
      expect(isMermaidElement(element)).toBe(false);
    });
  });

  describe('isImageElement', () => {
    it('should return true for image elements', () => {
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
      };
      expect(isImageElement(element)).toBe(true);
    });

    it('should return false for non-image elements', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' } }
      };
      expect(isImageElement(element)).toBe(false);
    });
  });

  describe('isVideoElement', () => {
    it('should return true for video elements', () => {
      const element: Element = {
        id: 'video-1',
        kind: 'video',
        content: { primary: { type: 'external', mediaType: 'video/mp4', uri: 'test.mp4' } }
      };
      expect(isVideoElement(element)).toBe(true);
    });

    it('should return false for non-video elements', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' } }
      };
      expect(isVideoElement(element)).toBe(false);
    });
  });

  describe('isDocumentElement', () => {
    it('should return true for document elements', () => {
      const element: Element = {
        id: 'doc-1',
        kind: 'document',
        content: { primary: { type: 'external', mediaType: 'application/pdf', uri: 'doc.pdf' } }
      };
      expect(isDocumentElement(element)).toBe(true);
    });

    it('should return false for non-document elements', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' } }
      };
      expect(isDocumentElement(element)).toBe(false);
    });
  });
});

describe('Content Access Functions', () => {
  describe('getTypedContent', () => {
    it('should return typed content for markdown element', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' } }
      };
      const content = getTypedContent(element, 'markdown');
      expect(content).toEqual(element.content);
    });

    it('should return typed content for image element', () => {
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
      };
      const content = getTypedContent(element, 'image');
      expect(content).toEqual(element.content);
    });
  });

  describe('getPrimaryContent', () => {
    it('should return primary content when it exists', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: '# Hello World'
      };
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary }
      };

      expect(getPrimaryContent(element)).toEqual(primary);
    });

    it('should return primary content for different element types', () => {
      const imageElement: Element = {
        id: 'image-1',
        kind: 'image',
        content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
      };

      expect(getPrimaryContent(imageElement)).toEqual({ type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' });
    });

    it('should return primary content even when empty', () => {
      const primary: PayloadSource = { type: 'inline', mediaType: 'text/markdown', source: '' };
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: { primary }
      };

      expect(getPrimaryContent(element)).toEqual(primary);
    });
  });

  describe('getSourceContent', () => {
    it('should return source content when it exists', () => {
      const source: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'source.md'
      };
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' },
          source
        }
      };

      expect(getSourceContent(element)).toEqual(source);
    });

    it('should return source content for different element types', () => {
      const source: PayloadSource = {
        type: 'external',
        mediaType: 'image/raw',
        uri: 'original.tiff'
      };
      const imageElement: Element = {
        id: 'image-1',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'compressed.jpg' },
          source
        }
      };

      expect(getSourceContent(imageElement)).toEqual(source);
    });

    it('should return null when source is undefined', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' }
        }
      };

      expect(getSourceContent(element)).toBeNull();
    });
  });

  describe('getAlternativeContent', () => {
    it('should return alternatives when they exist', () => {
      const alternatives: PayloadSource[] = [
        { type: 'inline', mediaType: 'text/html', source: '<p>Hello</p>' },
        { type: 'external', mediaType: 'text/markdown', uri: 'content.md' }
      ];
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' },
          alternatives
        }
      };

      expect(getAlternativeContent(element)).toEqual(alternatives);
    });

    it('should return alternatives for different element types', () => {
      const alternatives: PayloadSource[] = [
        { type: 'external', mediaType: 'image/webp', uri: 'image.webp' },
        { type: 'external', mediaType: 'image/avif', uri: 'image.avif' }
      ];
      const imageElement: Element = {
        id: 'image-1',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'image.jpg' },
          alternatives
        }
      };

      expect(getAlternativeContent(imageElement)).toEqual(alternatives);
    });

    it('should return empty array when alternatives is undefined', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' }
        }
      };

      expect(getAlternativeContent(element)).toEqual([]);
    });
  });

  describe('getBestAlternative', () => {
    it('should return first matching alternative', () => {
      const alternatives: PayloadSource[] = [
        { type: 'inline', mediaType: 'text/html', source: '<p>Hello</p>' },
        { type: 'external', mediaType: 'text/markdown', uri: 'content.md' },
        { type: 'inline', mediaType: 'application/json', source: '{"text": "Hello"}' }
      ];
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' },
          alternatives
        }
      };

      const result = getBestAlternative(element, ['text/markdown', 'application/json']);
      expect(result).toEqual(alternatives[1]); // Should return markdown alternative
    });

    it('should return null when no alternatives match', () => {
      const alternatives: PayloadSource[] = [
        { type: 'inline', mediaType: 'text/html', source: '<p>Hello</p>' }
      ];
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' },
          alternatives
        }
      };

      const result = getBestAlternative(element, ['text/xml', 'application/json']);
      expect(result).toBeNull();
    });

    it('should return null when no alternatives exist', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' }
        }
      };

      const result = getBestAlternative(element, ['text/html']);
      expect(result).toBeNull();
    });
  });
});

describe('Variant and Transform Functions', () => {
  describe('getElementVariants', () => {
    it('should return variants when they exist', () => {
      const variants: ElementVariant[] = [
        {
          id: 'mobile',
          name: 'Mobile Version',
          payloadSource: { type: 'inline', mediaType: 'text/markdown', source: '# Mobile' },
          metadata: { screenSize: 'small' }
        },
        {
          id: 'desktop',
          name: 'Desktop Version',
          payloadSource: { type: 'inline', mediaType: 'text/markdown', source: '# Desktop' },
          metadata: { screenSize: 'large' }
        }
      ];
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Default' },
          variants
        }
      };

      expect(getElementVariants(element)).toEqual(variants);
    });

    it('should return empty array when variants is undefined', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' }
        }
      };

      expect(getElementVariants(element)).toEqual([]);
    });

    it('should return variants for different element types', () => {
      const variants: ElementVariant[] = [
        {
          id: 'thumbnail',
          name: 'Thumbnail',
          payloadSource: { type: 'external', mediaType: 'image/jpeg', uri: 'thumb.jpg' },
          metadata: { size: 'small' }
        }
      ];
      const imageElement: Element = {
        id: 'image-1',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'full.jpg' },
          variants
        }
      };

      expect(getElementVariants(imageElement)).toEqual(variants);
    });
  });

  describe('getVariantById', () => {
    it('should return variant when found', () => {
      const mobileVariant: ElementVariant = {
        id: 'mobile',
        name: 'Mobile Version',
        payloadSource: { type: 'inline', mediaType: 'text/markdown', source: '# Mobile' },
        metadata: { screenSize: 'small' }
      };
      const desktopVariant: ElementVariant = {
        id: 'desktop',
        name: 'Desktop Version',
        payloadSource: { type: 'inline', mediaType: 'text/markdown', source: '# Desktop' },
        metadata: { screenSize: 'large' }
      };
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Default' },
          variants: [mobileVariant, desktopVariant]
        }
      };

      expect(getVariantById(element, 'mobile')).toEqual(mobileVariant);
      expect(getVariantById(element, 'desktop')).toEqual(desktopVariant);
    });

    it('should return null when variant not found', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Default' },
          variants: [
            {
              id: 'mobile',
              name: 'Mobile Version',
              payloadSource: { type: 'inline', mediaType: 'text/markdown', source: '# Mobile' },
              metadata: { screenSize: 'small' }
            }
          ]
        }
      };

      expect(getVariantById(element, 'tablet')).toBeNull();
    });

    it('should return null when no variants exist', () => {
      const element: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' }
        }
      };

      expect(getVariantById(element, 'mobile')).toBeNull();
    });
  });

  describe('getTransformConfigs', () => {
    it('should return transforms when they exist', () => {
      const transforms: TransformConfig[] = [
        {
          type: 'image-resize',
          params: { width: 300, height: 200 },
          outputFormats: ['image/jpeg', 'image/webp']
        },
        {
          type: 'image-compress',
          params: { quality: 0.8 }
        }
      ];
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'image.jpg' },
          transforms
        }
      };

      expect(getTransformConfigs(element)).toEqual(transforms);
    });

    it('should return empty array when transforms is undefined', () => {
      const element: Element = {
        id: 'image-1',
        kind: 'image',
        content: {
          primary: { type: 'external', mediaType: 'image/jpeg', uri: 'image.jpg' }
        }
      };

      expect(getTransformConfigs(element)).toEqual([]);
    });

    it('should return transforms for different element types', () => {
      const transforms: TransformConfig[] = [
        {
          type: 'markdown-to-html',
          params: { sanitize: true },
          outputFormats: ['text/html']
        }
      ];
      const markdownElement: Element = {
        id: 'markdown-1',
        kind: 'markdown',
        content: {
          primary: { type: 'inline', mediaType: 'text/markdown', source: '# Hello' },
          transforms
        }
      };

      expect(getTransformConfigs(markdownElement)).toEqual(transforms);
    });
  });
});
