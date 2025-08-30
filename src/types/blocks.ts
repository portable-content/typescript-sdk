/**
 * @fileoverview Block-specific type definitions using BlockContent structure
 */

import { Block, BlockContent, PayloadSource, TextPayloadSource, ImagePayloadSource } from './core';

/**
 * Typed block interfaces for each kind using BlockContent structure
 */
export interface MarkdownBlock extends Block {
  kind: 'markdown';
  content: BlockContent & {
    primary: TextPayloadSource;
    source?: TextPayloadSource;
  };
}

export interface MermaidBlock extends Block {
  kind: 'mermaid';
  content: BlockContent & {
    primary: PayloadSource; // Usually SVG/PNG delivery format
    source?: TextPayloadSource & { theme?: string }; // Mermaid source with optional theme
  };
}

export interface ImageBlock extends Block {
  kind: 'image';
  content: BlockContent & {
    primary: ImagePayloadSource;
    source?: ImagePayloadSource; // Original/raw image
    alternatives?: ImagePayloadSource[]; // Different sizes/formats
  };
}

export interface DocumentBlock extends Block {
  kind: 'document';
  content: BlockContent & {
    primary: PayloadSource & { pages?: number }; // Usually PDF
    alternatives?: PayloadSource[]; // Thumbnails, different formats
  };
}

export interface CodeBlock extends Block {
  kind: 'code';
  content: BlockContent & {
    primary: TextPayloadSource & {
      language?: string;
      lineNumbers?: boolean;
    };
    source?: TextPayloadSource;
  };
}

/**
 * Block type map for extensibility via module augmentation
 * External modules can extend this interface to add custom block types
 */
export interface BlockTypeMap {
  markdown: MarkdownBlock;
  mermaid: MermaidBlock;
  image: ImageBlock;
  document: DocumentBlock;
  code: CodeBlock;
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
 * Type guard to check if a block is a document block
 */
export function isDocumentBlock(block: Block): block is DocumentBlock {
  return block.kind === 'document';
}

/**
 * Type guard to check if a block is a code block
 */
export function isCodeBlock(block: Block): block is CodeBlock {
  return block.kind === 'code';
}

/**
 * Get typed content for a block based on its kind
 * Returns the BlockContent with proper typing
 */
export function getTypedContent<K extends keyof BlockTypeMap>(
  block: Block,
  kind: K
): BlockTypeMap[K]['content'] | null {
  return block.kind === kind ? (block.content as BlockTypeMap[K]['content']) : null;
}

/**
 * Get the primary content source for a block
 */
export function getPrimaryContent(block: Block): PayloadSource {
  return block.content.primary;
}

/**
 * Get the source content for editing (if available)
 */
export function getSourceContent(block: Block): PayloadSource | null {
  return block.content.source || null;
}

/**
 * Get alternative content formats
 */
export function getAlternativeContent(block: Block): PayloadSource[] {
  return block.content.alternatives || [];
}

/**
 * Find the best alternative content based on accepted media types
 */
export function getBestAlternative(block: Block, acceptedTypes: string[]): PayloadSource | null {
  const alternatives = getAlternativeContent(block);
  return alternatives.find((alt) => acceptedTypes.includes(alt.mediaType)) || null;
}
