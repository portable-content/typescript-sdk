/**
 * @fileoverview Core data model interfaces for the Portable Content System
 */

/**
 * Core content item representing a piece of portable content
 */
export interface ContentItem {
  /** Unique identifier for the content item */
  id: string;
  /** Content type (e.g., 'note', 'article', 'document') */
  type: string;
  /** Optional human-readable title */
  title?: string;
  /** Optional summary or description */
  summary?: string;
  /** Array of content blocks that make up this item */
  blocks: Block[];
  /** Named representations defining which blocks to include */
  representations?: Record<string, Representation>;
  /** ISO 8601 timestamp when this item was created */
  createdAt?: string;
  /** ISO 8601 timestamp when this item was last updated */
  updatedAt?: string;
  /** Identifier of the user/system that created this item */
  createdBy?: string;
}

/**
 * Base interface for all content blocks
 */
export interface Block {
  /** Unique identifier for the block */
  id: string;
  /** Block type identifier (e.g., 'markdown', 'mermaid', 'image') */
  kind: string;
  /** Block-specific payload data */
  payload: unknown;
  /** Available variants for this block */
  variants: Variant[];
}

/**
 * Represents a specific variant of a block (e.g., different formats, sizes)
 */
export interface Variant {
  /** MIME type of this variant (e.g., 'text/html', 'image/png') */
  mediaType: string;
  /** Optional URI where this variant can be accessed */
  uri?: string;
  /** Optional width in pixels (for visual content) */
  width?: number;
  /** Optional height in pixels (for visual content) */
  height?: number;
  /** Optional size in bytes */
  bytes?: number;
  /** Optional content hash for integrity verification */
  contentHash?: string;
  /** Optional identifier of the tool that generated this variant */
  generatedBy?: string;
  /** Optional version of the tool that generated this variant */
  toolVersion?: string;
  /** ISO 8601 timestamp when this variant was created */
  createdAt?: string;
}

/**
 * Named representation defining which blocks to include
 */
export interface Representation {
  /** Array of block IDs to include in this representation */
  blocks: string[];
  /** Optional metadata for the representation */
  metadata?: Record<string, unknown>;
}
