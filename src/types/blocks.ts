/**
 * @fileoverview Block-specific payload type definitions
 */

/**
 * Payload for markdown content blocks
 */
export interface MarkdownBlockPayload {
  /** Markdown source content */
  source: string;
}

/**
 * Payload for Mermaid diagram blocks
 */
export interface MermaidBlockPayload {
  /** Mermaid diagram source */
  source: string;
  /** Optional theme for rendering */
  theme?: string;
}

/**
 * Payload for image blocks
 */
export interface ImageBlockPayload {
  /** Image URI */
  uri: string;
  /** Optional alt text for accessibility */
  alt?: string;
  /** Optional original width */
  width?: number;
  /** Optional original height */
  height?: number;
}

/**
 * Union type for all known block payload types
 */
export type BlockPayload = MarkdownBlockPayload | MermaidBlockPayload | ImageBlockPayload;

/**
 * Block kind constants
 */
export const BLOCK_KINDS = {
  MARKDOWN: 'markdown',
  MERMAID: 'mermaid',
  IMAGE: 'image',
} as const;

/**
 * Type for block kind values
 */
export type BlockKind = (typeof BLOCK_KINDS)[keyof typeof BLOCK_KINDS];
