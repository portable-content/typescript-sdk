/**
 * @fileoverview Utility types and builder classes
 * Updated for Element-based architecture
 */

import type {
  ContentManifest,
  Element,
  ElementContent,
  ElementMetadata,
  ElementVariant,
  TransformConfig,
  PayloadSource,
} from './core';
import type { ElementTypeMap } from './elements';

/**
 * Utility type to extract content type from element kind
 * Uses ElementTypeMap for extensibility
 */
export type ContentForElementKind<K extends keyof ElementTypeMap> = ElementTypeMap[K]['content'];

/**
 * Utility type for unknown element kinds (fallback)
 */
export type ContentForUnknownElementKind<K extends string> = K extends keyof ElementTypeMap
  ? ContentForElementKind<K>
  : ElementContent;

/**
 * Utility type for partial updates
 */
export type PartialContentManifest = Partial<Omit<ContentManifest, 'id' | 'elements'>> & {
  id: string;
  elements?: Partial<Element>[];
};

/**
 * Builder class for creating ContentManifests
 */
export class ContentManifestBuilder {
  private manifest: Partial<ContentManifest> = {
    elements: [],
  };

  constructor(id: string, type: string) {
    this.manifest.id = id;
    this.manifest.type = type;
  }

  title(title: string): this {
    this.manifest.title = title;
    return this;
  }

  summary(summary: string): this {
    this.manifest.summary = summary;
    return this;
  }

  addElement(element: Element): this {
    this.manifest.elements = [...(this.manifest.elements || []), element];
    return this;
  }

  addRepresentation(name: string, representation: import('./core').Representation): this {
    this.manifest.representations = {
      ...this.manifest.representations,
      [name]: representation,
    };
    return this;
  }

  createdBy(createdBy: string): this {
    this.manifest.createdBy = createdBy;
    return this;
  }

  build(): ContentManifest {
    const now = new Date().toISOString();
    return {
      ...this.manifest,
      elements: this.manifest.elements || [],
      createdAt: this.manifest.createdAt || now,
      updatedAt: this.manifest.updatedAt || now,
    } as ContentManifest;
  }
}

/**
 * Builder class for creating Elements
 * Supports both known and unknown element types
 */
export class ElementBuilder<K extends Element['kind']> {
  private element: Partial<Element> = {};

  constructor(id: string, kind: K) {
    this.element.id = id;
    this.element.kind = kind;
  }

  content(content: ContentForUnknownElementKind<K>): this {
    this.element.content = content;
    return this;
  }

  primary(primary: PayloadSource): this {
    if (!this.element.content) {
      this.element.content = { primary };
    } else {
      this.element.content.primary = primary;
    }
    return this;
  }

  source(source: PayloadSource): this {
    if (!this.element.content) {
      throw new Error('Must set primary content before source');
    }
    this.element.content.source = source;
    return this;
  }

  addAlternative(alternative: PayloadSource): this {
    if (!this.element.content) {
      throw new Error('Must set primary content before alternatives');
    }
    this.element.content.alternatives = [...(this.element.content.alternatives || []), alternative];
    return this;
  }

  addVariant(variant: ElementVariant): this {
    if (!this.element.content) {
      throw new Error('Must set primary content before variants');
    }
    this.element.content.variants = [...(this.element.content.variants || []), variant];
    return this;
  }

  addTransform(transform: TransformConfig): this {
    if (!this.element.content) {
      throw new Error('Must set primary content before transforms');
    }
    this.element.content.transforms = [...(this.element.content.transforms || []), transform];
    return this;
  }

  eventId(eventId: string): this {
    this.element.eventId = eventId;
    return this;
  }

  metadata(metadata: ElementMetadata): this {
    this.element.metadata = { ...this.element.metadata, ...metadata };
    return this;
  }

  build(): Element {
    if (!this.element.content?.primary) {
      throw new Error('Element must have primary content');
    }
    return this.element as Element;
  }
}

/**
 * Builder class for creating PayloadSources
 */
export class PayloadSourceBuilder {
  private payloadSource: Partial<PayloadSource> = {};

  constructor(type: 'inline' | 'external', mediaType: string) {
    this.payloadSource.type = type;
    this.payloadSource.mediaType = mediaType;
  }

  static inline(mediaType: string): PayloadSourceBuilder {
    return new PayloadSourceBuilder('inline', mediaType);
  }

  static external(mediaType: string): PayloadSourceBuilder {
    return new PayloadSourceBuilder('external', mediaType);
  }

  source(source: string): this {
    if (this.payloadSource.type !== 'inline') {
      throw new Error('Source can only be set for inline payload sources');
    }
    this.payloadSource.source = source;
    return this;
  }

  uri(uri: string): this {
    if (this.payloadSource.type !== 'external') {
      throw new Error('URI can only be set for external payload sources');
    }
    this.payloadSource.uri = uri;
    return this;
  }

  dimensions(width: number, height: number): this {
    this.payloadSource.width = width;
    this.payloadSource.height = height;
    return this;
  }

  build(): PayloadSource {
    if (this.payloadSource.type === 'inline' && !this.payloadSource.source) {
      throw new Error('Inline payload source must have source content');
    }
    if (this.payloadSource.type === 'external' && !this.payloadSource.uri) {
      throw new Error('External payload source must have URI');
    }
    return this.payloadSource as PayloadSource;
  }
}
