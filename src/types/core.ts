/**
 * @fileoverview Core data model interfaces for the Portable Content System
 */

/**
 * Represents a complete content item with metadata and blocks
 */
export interface ContentItem {
  /** Unique identifier for the content item */
  id: string;
  /** Content type identifier */
  type: string;
  /** Optional title for the content */
  title?: string;
  /** Optional summary or description */
  summary?: string;
  /** Array of content blocks */
  blocks: Block[];
  /** Optional representations for different formats */
  representations?: Record<string, Representation>;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Creator identifier */
  createdBy?: string;
}

/**
 * Represents a single content block with variants
 */
export interface Block {
  /** Unique identifier for the block */
  id: string;
  /** Block type/kind identifier */
  kind: string;
  /** Block-specific payload data */
  payload: unknown;
  /** Available variants for this block */
  variants: Variant[];
}

/**
 * Represents a specific variant of a block
 */
export interface Variant {
  /** MIME type of the variant */
  mediaType: string;
  /** Optional URI for accessing the variant */
  uri?: string;
  /** Optional width in pixels */
  width?: number;
  /** Optional height in pixels */
  height?: number;
  /** Optional size in bytes */
  bytes?: number;
  /** Optional content hash for integrity */
  contentHash?: string;
  /** Optional generator tool identifier */
  generatedBy?: string;
  /** Optional tool version */
  toolVersion?: string;
  /** Creation timestamp */
  createdAt?: string;
}

/**
 * Represents a content representation (e.g., PDF, EPUB)
 */
export interface Representation {
  /** MIME type of the representation */
  mediaType: string;
  /** URI for accessing the representation */
  uri: string;
  /** Optional size in bytes */
  bytes?: number;
  /** Optional content hash for integrity */
  contentHash?: string;
  /** Creation timestamp */
  createdAt?: string;
}
