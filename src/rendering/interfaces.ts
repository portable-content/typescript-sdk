/**
 * @fileoverview Framework-agnostic rendering interfaces
 */

import { Block, Capabilities } from '../types';

/**
 * Interface for block renderers
 */
export interface BlockRenderer<TProps = Record<string, unknown>> {
  /** Block kind this renderer handles */
  kind: string;

  /** Check if this renderer can handle the given block */
  canRender(block: Block, capabilities: Capabilities): boolean;

  /** Render the block with given props */
  render(block: Block, props: TProps): unknown;
}

/**
 * Interface for renderer registry
 */
export interface RendererRegistry {
  /** Register a block renderer */
  register<T>(renderer: BlockRenderer<T>): void;

  /** Get renderer for a specific block kind */
  getRenderer(kind: string): BlockRenderer | null;

  /** Render a block using the appropriate renderer */
  renderBlock(block: Block, capabilities: Capabilities): unknown;
}

/**
 * Processed content ready for rendering
 */
export interface ProcessedContent {
  /** Original content item */
  original: Block;
  /** Processed blocks with selected variants */
  blocks: ProcessedBlock[];
  /** Applied capabilities */
  capabilities: Capabilities;
}

/**
 * Processed block with selected variant
 */
export interface ProcessedBlock {
  /** Original block */
  original: Block;
  /** Selected variant for rendering */
  selectedVariant: import('../types').Variant;
  /** Processing metadata */
  metadata: {
    processingTime: number;
    selectionReason: string;
  };
}
