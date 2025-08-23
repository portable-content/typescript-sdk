/**
 * @fileoverview Utility types and builder classes
 */

import type { ContentItem, Block, Variant } from './core';
import type { BlockTypeMap } from './blocks';

/**
 * Utility type to extract payload type from block kind
 * Uses BlockTypeMap for extensibility
 */
export type PayloadForKind<K extends keyof BlockTypeMap> = BlockTypeMap[K]['payload'];

/**
 * Utility type for unknown block kinds (fallback)
 */
export type PayloadForUnknownKind<K extends string> = K extends keyof BlockTypeMap 
  ? PayloadForKind<K> 
  : unknown;

/**
 * Utility type for partial updates
 */
export type PartialContentItem = Partial<Omit<ContentItem, 'id' | 'blocks'>> & {
  id: string;
  blocks?: Partial<Block>[];
};

/**
 * Builder class for creating ContentItems
 */
export class ContentItemBuilder {
  private item: Partial<ContentItem> = {
    blocks: []
  };

  constructor(id: string, type: string) {
    this.item.id = id;
    this.item.type = type;
  }

  title(title: string): this {
    this.item.title = title;
    return this;
  }

  summary(summary: string): this {
    this.item.summary = summary;
    return this;
  }

  addBlock(block: Block): this {
    this.item.blocks = [...(this.item.blocks || []), block];
    return this;
  }

  addRepresentation(name: string, representation: import('./core').Representation): this {
    this.item.representations = {
      ...this.item.representations,
      [name]: representation
    };
    return this;
  }

  createdBy(createdBy: string): this {
    this.item.createdBy = createdBy;
    return this;
  }

  build(): ContentItem {
    const now = new Date().toISOString();
    return {
      ...this.item,
      blocks: this.item.blocks || [],
      createdAt: this.item.createdAt || now,
      updatedAt: this.item.updatedAt || now
    } as ContentItem;
  }
}

/**
 * Builder class for creating Blocks
 * Supports both known and unknown block types
 */
export class BlockBuilder<K extends string> {
  private block: Partial<Block> = {
    variants: []
  };

  constructor(id: string, kind: K) {
    this.block.id = id;
    this.block.kind = kind;
  }

  payload(payload: PayloadForUnknownKind<K>): this {
    this.block.payload = payload;
    return this;
  }

  addVariant(variant: Variant): this {
    this.block.variants = [...(this.block.variants || []), variant];
    return this;
  }

  build(): Block {
    return this.block as Block;
  }
}

/**
 * Builder class for creating Variants
 */
export class VariantBuilder {
  private variant: Partial<Variant> = {};

  constructor(mediaType: string) {
    this.variant.mediaType = mediaType;
  }

  uri(uri: string): this {
    this.variant.uri = uri;
    return this;
  }

  dimensions(width: number, height: number): this {
    this.variant.width = width;
    this.variant.height = height;
    return this;
  }

  bytes(bytes: number): this {
    this.variant.bytes = bytes;
    return this;
  }

  contentHash(hash: string): this {
    this.variant.contentHash = hash;
    return this;
  }

  generatedBy(tool: string, version?: string): this {
    this.variant.generatedBy = tool;
    if (version) {
      this.variant.toolVersion = version;
    }
    return this;
  }

  build(): Variant {
    const now = new Date().toISOString();
    return {
      ...this.variant,
      createdAt: this.variant.createdAt || now
    } as Variant;
  }
}
