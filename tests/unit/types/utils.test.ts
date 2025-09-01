/**
 * @fileoverview Tests for type utilities and builders
 */

import {
  ContentManifestBuilder,
  ElementBuilder,
  PayloadSourceBuilder
} from '../../../src/types/utils';
import type { ContentManifest, Element, PayloadSource, ElementContent, Representation } from '../../../src/types/core';

describe('ContentManifestBuilder', () => {
  let builder: ContentManifestBuilder;

  beforeEach(() => {
    builder = new ContentManifestBuilder('test-manifest', 'content');
  });

  it('should create manifest with id and type', () => {
    const manifest = builder.build();
    expect(manifest.id).toBe('test-manifest');
    expect(manifest.type).toBe('content');
    expect(manifest.elements).toEqual([]);
    expect(manifest.createdAt).toBeDefined();
    expect(manifest.updatedAt).toBeDefined();
  });

  it('should set title', () => {
    const manifest = builder.title('Test Title').build();
    expect(manifest.title).toBe('Test Title');
  });

  it('should add single element', () => {
    const element: Element = {
      id: 'test-element',
      kind: 'markdown',
      content: { primary: { type: 'inline', mediaType: 'text/markdown', source: 'Test' } }
    };

    const manifest = builder.addElement(element).build();
    expect(manifest.elements).toHaveLength(1);
    expect(manifest.elements[0]).toEqual(element);
  });

  it('should add multiple elements', () => {
    const element1: Element = {
      id: 'element-1',
      kind: 'markdown',
      content: { primary: { type: 'inline', mediaType: 'text/markdown', source: 'Test 1' } }
    };
    const element2: Element = {
      id: 'element-2',
      kind: 'image',
      content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
    };

    const manifest = builder
      .addElement(element1)
      .addElement(element2)
      .build();

    expect(manifest.elements).toHaveLength(2);
    expect(manifest.elements[0]).toEqual(element1);
    expect(manifest.elements[1]).toEqual(element2);
  });

  it('should add representation', () => {
    const representation: Representation = {
      elements: ['element-1', 'element-2'],
      metadata: { view: 'summary' }
    };

    const manifest = builder
      .addRepresentation('summary', representation)
      .build();

    expect(manifest.representations?.summary).toEqual(representation);
  });

  it('should add multiple representations', () => {
    const summaryRep: Representation = {
      elements: ['element-1'],
      metadata: { view: 'summary' }
    };
    const detailRep: Representation = {
      elements: ['element-1', 'element-2', 'element-3'],
      metadata: { view: 'detail' }
    };

    const manifest = builder
      .addRepresentation('summary', summaryRep)
      .addRepresentation('detail', detailRep)
      .build();

    expect(manifest.representations?.summary).toEqual(summaryRep);
    expect(manifest.representations?.detail).toEqual(detailRep);
  });

  it('should set createdBy', () => {
    const manifest = builder.createdBy('test-user').build();
    expect(manifest.createdBy).toBe('test-user');
  });

  it('should set summary', () => {
    const manifest = builder.summary('Test summary').build();
    expect(manifest.summary).toBe('Test summary');
  });

  it('should chain all methods', () => {
    const element: Element = {
      id: 'test-element',
      kind: 'markdown',
      content: { primary: { type: 'inline', mediaType: 'text/markdown', source: 'Test' } }
    };
    const representation: Representation = {
      elements: ['test-element'],
      metadata: { view: 'summary' }
    };

    const manifest = builder
      .title('Test Title')
      .summary('Test summary')
      .addElement(element)
      .addRepresentation('summary', representation)
      .createdBy('test-user')
      .build();

    expect(manifest.title).toBe('Test Title');
    expect(manifest.summary).toBe('Test summary');
    expect(manifest.elements).toHaveLength(1);
    expect(manifest.representations?.summary).toEqual(representation);
    expect(manifest.createdBy).toBe('test-user');
  });

  it('should preserve existing elements when adding new ones', () => {
    const element1: Element = {
      id: 'element-1',
      kind: 'markdown',
      content: { primary: { type: 'inline', mediaType: 'text/markdown', source: 'Test 1' } }
    };
    const element2: Element = {
      id: 'element-2',
      kind: 'image',
      content: { primary: { type: 'external', mediaType: 'image/jpeg', uri: 'test.jpg' } }
    };

    builder.addElement(element1);
    const manifest = builder.addElement(element2).build();

    expect(manifest.elements).toHaveLength(2);
    expect(manifest.elements[0]).toEqual(element1);
    expect(manifest.elements[1]).toEqual(element2);
  });

  it('should preserve existing representations when adding new ones', () => {
    const summaryRep: Representation = {
      elements: ['element-1'],
      metadata: { view: 'summary' }
    };
    const detailRep: Representation = {
      elements: ['element-1', 'element-2'],
      metadata: { view: 'detail' }
    };

    builder.addRepresentation('summary', summaryRep);
    const manifest = builder.addRepresentation('detail', detailRep).build();

    expect(manifest.representations?.summary).toEqual(summaryRep);
    expect(manifest.representations?.detail).toEqual(detailRep);
  });
});

describe('ElementBuilder', () => {
  it('should create element with id and kind', () => {
    const primary: PayloadSource = {
      type: 'inline',
      mediaType: 'text/markdown',
      source: 'Test content'
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .primary(primary)
      .build();

    expect(element.id).toBe('test-id');
    expect(element.kind).toBe('markdown');
    expect(element.content?.primary).toEqual(primary);
  });

  it('should set content', () => {
    const content: ElementContent = {
      primary: { type: 'inline', mediaType: 'text/markdown', source: 'Test content' }
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .content(content)
      .build();

    expect(element.content).toEqual(content);
  });

  it('should set primary content', () => {
    const primary: PayloadSource = {
      type: 'inline',
      mediaType: 'text/markdown',
      source: 'Test content'
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .primary(primary)
      .build();

    expect(element.content?.primary).toEqual(primary);
  });

  it('should set primary content when content already exists', () => {
    const initialContent: ElementContent = {
      primary: { type: 'inline', mediaType: 'text/plain', source: 'Initial' }
    };
    const newPrimary: PayloadSource = {
      type: 'inline',
      mediaType: 'text/markdown',
      source: 'Updated'
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .content(initialContent)
      .primary(newPrimary)
      .build();

    expect(element.content?.primary).toEqual(newPrimary);
  });

  it('should set source content', () => {
    const primary: PayloadSource = {
      type: 'inline',
      mediaType: 'text/markdown',
      source: 'Primary content'
    };
    const source: PayloadSource = {
      type: 'external',
      mediaType: 'text/markdown',
      uri: 'source.md'
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .primary(primary)
      .source(source)
      .build();

    expect(element.content?.primary).toEqual(primary);
    expect(element.content?.source).toEqual(source);
  });

  it('should throw error when setting source without primary', () => {
    const source: PayloadSource = {
      type: 'external',
      mediaType: 'text/markdown',
      uri: 'source.md'
    };

    expect(() => {
      new ElementBuilder('test-id', 'markdown')
        .source(source)
        .build();
    }).toThrow('Must set primary content before source');
  });

  it('should chain all methods', () => {
    const content: ElementContent = {
      primary: { type: 'inline', mediaType: 'text/markdown', source: 'Primary' }
    };
    const source: PayloadSource = {
      type: 'external',
      mediaType: 'text/markdown',
      uri: 'source.md'
    };

    const element = new ElementBuilder('test-id', 'markdown')
      .content(content)
      .source(source)
      .build();

    expect(element.id).toBe('test-id');
    expect(element.kind).toBe('markdown');
    expect(element.content?.primary).toEqual(content.primary);
    expect(element.content?.source).toEqual(source);
  });

  describe('error handling', () => {
    it('should throw error when adding alternative without primary content', () => {
      const alternative: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'alt.md'
      };

      expect(() => {
        new ElementBuilder('test-id', 'markdown')
          .addAlternative(alternative)
          .build();
      }).toThrow('Must set primary content before alternatives');
    });

    it('should throw error when adding variant without primary content', () => {
      const variant = {
        id: 'variant-1',
        name: 'Dark Theme',
        payloadSource: { type: 'inline' as const, mediaType: 'text/markdown', source: 'Dark variant' }
      };

      expect(() => {
        new ElementBuilder('test-id', 'markdown')
          .addVariant(variant)
          .build();
      }).toThrow('Must set primary content before variants');
    });

    it('should throw error when adding transform without primary content', () => {
      const transform = {
        id: 'transform-1',
        type: 'style' as const,
        config: { color: 'blue' }
      };

      expect(() => {
        new ElementBuilder('test-id', 'markdown')
          .addTransform(transform)
          .build();
      }).toThrow('Must set primary content before transforms');
    });

    it('should throw error when building without primary content', () => {
      expect(() => {
        new ElementBuilder('test-id', 'markdown')
          .build();
      }).toThrow('Element must have primary content');
    });
  });

  describe('builder methods', () => {
    it('should add alternatives correctly', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: 'Primary content'
      };
      const alternative: PayloadSource = {
        type: 'external',
        mediaType: 'text/markdown',
        uri: 'alt.md'
      };

      const element = new ElementBuilder('test-id', 'markdown')
        .content({ primary })
        .addAlternative(alternative)
        .build();

      expect(element.content?.alternatives).toHaveLength(1);
      expect(element.content?.alternatives?.[0]).toEqual(alternative);
    });

    it('should add variants correctly', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: 'Primary content'
      };
      const variant = {
        id: 'variant-1',
        name: 'Dark Theme',
        payloadSource: { type: 'inline' as const, mediaType: 'text/markdown', source: 'Dark variant' }
      };

      const element = new ElementBuilder('test-id', 'markdown')
        .content({ primary })
        .addVariant(variant)
        .build();

      expect(element.content?.variants).toHaveLength(1);
      expect(element.content?.variants?.[0]).toEqual(variant);
    });

    it('should add transforms correctly', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: 'Primary content'
      };
      const transform = {
        id: 'transform-1',
        type: 'style' as const,
        config: { color: 'blue' }
      };

      const element = new ElementBuilder('test-id', 'markdown')
        .content({ primary })
        .addTransform(transform)
        .build();

      expect(element.content?.transforms).toHaveLength(1);
      expect(element.content?.transforms?.[0]).toEqual(transform);
    });

    it('should set eventId correctly', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: 'Primary content'
      };

      const element = new ElementBuilder('test-id', 'markdown')
        .content({ primary })
        .eventId('event-123')
        .build();

      expect(element.eventId).toBe('event-123');
    });

    it('should set metadata correctly', () => {
      const primary: PayloadSource = {
        type: 'inline',
        mediaType: 'text/markdown',
        source: 'Primary content'
      };
      const metadata = {
        title: 'Test Element',
        description: 'A test element',
        tags: ['test']
      };

      const element = new ElementBuilder('test-id', 'markdown')
        .content({ primary })
        .metadata(metadata)
        .build();

      expect(element.metadata).toEqual(expect.objectContaining(metadata));
    });
  });
});

describe('PayloadSourceBuilder', () => {
  describe('inline payload sources', () => {
    it('should create inline payload source', () => {
      const payload = PayloadSourceBuilder.inline('text/markdown')
        .source('Test content')
        .build();

      expect(payload.type).toBe('inline');
      expect(payload.mediaType).toBe('text/markdown');
      expect(payload.source).toBe('Test content');
    });

    it('should throw error when setting URI on inline payload', () => {
      expect(() => {
        PayloadSourceBuilder.inline('text/markdown')
          .uri('http://example.com')
          .build();
      }).toThrow('URI can only be set for external payload sources');
    });

    it('should throw error when building inline payload without source', () => {
      expect(() => {
        PayloadSourceBuilder.inline('text/markdown')
          .build();
      }).toThrow('Inline payload source must have source content');
    });

    it('should set dimensions on inline payload', () => {
      const payload = PayloadSourceBuilder.inline('image/png')
        .source('base64data')
        .dimensions(800, 600)
        .build();

      expect(payload.width).toBe(800);
      expect(payload.height).toBe(600);
    });
  });

  describe('external payload sources', () => {
    it('should create external payload source', () => {
      const payload = PayloadSourceBuilder.external('text/markdown')
        .uri('http://example.com/content.md')
        .build();

      expect(payload.type).toBe('external');
      expect(payload.mediaType).toBe('text/markdown');
      expect(payload.uri).toBe('http://example.com/content.md');
    });

    it('should throw error when setting source on external payload', () => {
      expect(() => {
        PayloadSourceBuilder.external('text/markdown')
          .source('content')
          .build();
      }).toThrow('Source can only be set for inline payload sources');
    });

    it('should throw error when building external payload without URI', () => {
      expect(() => {
        PayloadSourceBuilder.external('text/markdown')
          .build();
      }).toThrow('External payload source must have URI');
    });

    it('should set dimensions on external payload', () => {
      const payload = PayloadSourceBuilder.external('image/png')
        .uri('http://example.com/image.png')
        .dimensions(1920, 1080)
        .build();

      expect(payload.width).toBe(1920);
      expect(payload.height).toBe(1080);
    });
  });
});
