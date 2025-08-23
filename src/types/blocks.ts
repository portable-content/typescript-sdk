/**
 * @fileoverview Block-specific payload type definitions
 */

import { Block } from './core';

/**
 * Payload for markdown content blocks
 */
export interface MarkdownBlockPayload {
  /** Raw markdown source text */
  source: string;
}

/**
 * Payload for Mermaid diagram blocks
 */
export interface MermaidBlockPayload {
  /** Mermaid diagram source code */
  source: string;
  /** Optional theme name (default, dark, forest, etc.) */
  theme?: string;
}

/**
 * Payload for image blocks
 */
export interface ImageBlockPayload {
  /** URI to the original image */
  uri: string;
  /** Alternative text for accessibility */
  alt?: string;
  /** Original image width in pixels */
  width?: number;
  /** Original image height in pixels */
  height?: number;
}

/**
 * Typed block interfaces for each kind
 */
export interface MarkdownBlock extends Block {
  kind: 'markdown';
  payload: MarkdownBlockPayload;
}

export interface MermaidBlock extends Block {
  kind: 'mermaid';
  payload: MermaidBlockPayload;
}

export interface ImageBlock extends Block {
  kind: 'image';
  payload: ImageBlockPayload;
}

/**
 * Block type map for extensibility via module augmentation
 * External modules can extend this interface to add custom block types
 */
export interface BlockTypeMap {
  markdown: MarkdownBlock;
  mermaid: MermaidBlock;
  image: ImageBlock;
}

/**
 * Union type for all registered block types
 * Automatically includes any types added via module augmentation
 */
export type TypedBlock = BlockTypeMap[keyof BlockTypeMap];

/**
 * Type guard to check if a block is a markdown block
 */
export function isMarkdownBlock(block: Block): block is MarkdownBlock {
  return block.kind === 'markdown';
}

/**
 * Type guard to check if a block is a mermaid block
 */
export function isMermaidBlock(block: Block): block is MermaidBlock {
  return block.kind === 'mermaid';
}

/**
 * Type guard to check if a block is an image block
 */
export function isImageBlock(block: Block): block is ImageBlock {
  return block.kind === 'image';
}

/**
 * Generic payload extraction with optional validation
 * Supports both known and custom block types
 */
export function getTypedPayload<T>(
  block: Block,
  validator?: (payload: unknown) => payload is T
): T | null {
  if (validator && !validator(block.payload)) {
    return null;
  }
  return block.payload as T;
}

/**
 * Type-safe payload extraction for known block types
 * Uses the BlockTypeMap for compile-time type safety
 */
export function getKnownPayload<K extends keyof BlockTypeMap>(
  block: Block,
  kind: K
): BlockTypeMap[K]['payload'] | null {
  return block.kind === kind ? (block.payload as BlockTypeMap[K]['payload']) : null;
}
