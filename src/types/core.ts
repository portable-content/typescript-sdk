/**
 * @fileoverview Core data model interfaces for the Portable Content System
 * Updated for Element-based architecture with event system support
 */

/**
 * Core content manifest representing a piece of portable content
 */
export interface ContentManifest {
  /** Unique identifier for the content manifest */
  id: string;
  /** Content type (e.g., 'note', 'article', 'document') */
  type: string;
  /** Optional human-readable title */
  title?: string;
  /** Optional summary for search and AI processing */
  summary?: string;
  /** Array of content elements */
  elements: Element[];
  /** Named representations for different views */
  representations?: Record<string, Representation>;
  /** ISO 8601 creation timestamp */
  createdAt?: string;
  /** ISO 8601 last update timestamp */
  updatedAt?: string;
  /** Creator identifier */
  createdBy?: string;
}

/**
 * Base interface for all content elements (formerly blocks)
 */
export interface Element {
  /** Unique identifier for the element (dynamic UUID) */
  id: string;
  /** Element type identifier */
  kind: 'markdown' | 'image' | 'mermaid' | 'video' | 'document';
  /** Structured content with primary delivery format */
  content: ElementContent;
  /** Optional event targeting ID for dynamic updates */
  eventId?: string;
  /** Element metadata for event system and processing */
  metadata?: ElementMetadata;
}

/**
 * Structured content for elements with primary delivery format and alternatives
 */
export interface ElementContent {
  /** Primary content format for delivery to clients */
  primary: PayloadSource;
  /** Optional source format for storage/editing (backend use) */
  source?: PayloadSource;
  /** Optional alternative delivery formats */
  alternatives?: PayloadSource[];
  /** Optional variants for different contexts */
  variants?: ElementVariant[];
  /** Optional transform configurations */
  transforms?: TransformConfig[];
}

/**
 * Element metadata for event system and processing
 */
export interface ElementMetadata {
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Creator identifier */
  createdBy?: string;
  /** Element version for optimistic updates */
  version?: number;
  /** Custom metadata */
  [key: string]: unknown;
}

/**
 * Element variant definition
 */
export interface ElementVariant {
  /** Variant identifier */
  id: string;
  /** Variant name/label */
  name: string;
  /** Variant payload source */
  payloadSource: PayloadSource;
  /** Variant metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transform configuration
 */
export interface TransformConfig {
  /** Transform type/pipeline to run */
  type: string;
  /** Transform parameters */
  params?: Record<string, unknown>;
  /** Target output formats */
  outputFormats?: string[];
}

/**
 * Base interface for all payload sources
 */
export interface PayloadSource {
  /** Content location type */
  type: 'inline' | 'external';
  /** MIME media type of the content */
  mediaType: string;
  /** Raw content data (for inline content) */
  source?: string;
  /** URI where content can be accessed (for external content) */
  uri?: string;
  /** Width in pixels (for visual content) */
  width?: number;
  /** Height in pixels (for visual content) */
  height?: number;
}

/**
 * Inline content stored within the payload
 */
export interface InlinePayloadSource extends PayloadSource {
  type: 'inline';
  /** Raw content data (text or base64 for binary) */
  source: string;
}

/**
 * External content referenced by URI
 */
export interface ExternalPayloadSource extends PayloadSource {
  type: 'external';
  /** URI where content can be accessed */
  uri: string;
  /** Size in bytes */
  bytes?: number;
  /** SHA-256 content hash */
  contentHash?: string;
  /** Tool that generated this content */
  generatedBy?: string;
  /** Version of the generation tool */
  toolVersion?: string;
  /** ISO 8601 creation timestamp */
  createdAt?: string;
}

/**
 * PayloadSource for text-based content
 */
export interface TextPayloadSource extends PayloadSource {
  /** Character encoding */
  encoding?: string;
  /** Language code (ISO 639-1) */
  language?: string;
}

/**
 * PayloadSource for image content
 */
export interface ImagePayloadSource extends PayloadSource {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Alternative text for accessibility */
  alt?: string;
}

/**
 * Named representation defining which elements to include
 */
export interface Representation {
  /** Array of element IDs to include in this representation */
  elements: string[];
  /** Optional metadata for the representation */
  metadata?: Record<string, unknown>;
}
