/**
 * @fileoverview Utility types and builder classes
 */

import type { ContentManifest, Block, BlockContent, PayloadSource } from './core';
import type { BlockTypeMap } from './blocks';

/**
 * Utility type to extract content type from block kind
 * Uses BlockTypeMap for extensibility
 */
export type ContentForKind<K extends keyof BlockTypeMap> = BlockTypeMap[K]['content'];

/**
 * Utility type for unknown block kinds (fallback)
 */
export type ContentForUnknownKind<K extends string> = K extends keyof BlockTypeMap
  ? ContentForKind<K>
  : BlockContent;

/**
 * Utility type for partial updates
 */
export type PartialContentManifest = Partial<Omit<ContentManifest, 'id' | 'blocks'>> & {
  id: string;
  blocks?: Partial<Block>[];
};

/**
 * Builder class for creating ContentManifests
 */
export class ContentManifestBuilder {
  private manifest: Partial<ContentManifest> = {
    blocks: [],
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

  addBlock(block: Block): this {
    this.manifest.blocks = [...(this.manifest.blocks || []), block];
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
      blocks: this.manifest.blocks || [],
      createdAt: this.manifest.createdAt || now,
      updatedAt: this.manifest.updatedAt || now,
    } as ContentManifest;
  }
}

/**
 * Builder class for creating Blocks
 * Supports both known and unknown block types
 */
export class BlockBuilder<K extends string> {
  private block: Partial<Block> = {};

  constructor(id: string, kind: K) {
    this.block.id = id;
    this.block.kind = kind;
  }

  content(content: ContentForUnknownKind<K>): this {
    this.block.content = content;
    return this;
  }

  primary(primary: PayloadSource): this {
    if (!this.block.content) {
      this.block.content = { primary };
    } else {
      this.block.content.primary = primary;
    }
    return this;
  }

  source(source: PayloadSource): this {
    if (!this.block.content) {
      throw new Error('Must set primary content before source');
    }
    this.block.content.source = source;
    return this;
  }

  addAlternative(alternative: PayloadSource): this {
    if (!this.block.content) {
      throw new Error('Must set primary content before alternatives');
    }
    this.block.content.alternatives = [...(this.block.content.alternatives || []), alternative];
    return this;
  }

  build(): Block {
    if (!this.block.content?.primary) {
      throw new Error('Block must have primary content');
    }
    return this.block as Block;
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
