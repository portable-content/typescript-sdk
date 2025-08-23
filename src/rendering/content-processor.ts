/**
 * @fileoverview Content processing utilities
 *
 * This module contains utilities for processing content items
 * and preparing them for rendering.
 */

import type { ContentItem, Block, Variant, Capabilities } from '../types';
import type { ContentProcessor } from './interfaces';
import { VariantSelector } from './variant-selector';

/**
 * Processes content for optimal rendering
 */
export class DefaultContentProcessor implements ContentProcessor {
  private variantSelector = new VariantSelector();

  /**
   * Process content before rendering
   */
  async processContent(
    content: ContentItem,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<ContentItem> {
    // Apply representation filtering if specified
    let processedContent = content;
    if (options?.representation && content.representations) {
      processedContent = this.applyRepresentation(content, options.representation as string);
    }

    // Process each block
    const processedBlocks = await Promise.all(
      processedContent.blocks.map((block) => this.processBlock(block, capabilities, options))
    );

    return {
      ...processedContent,
      blocks: processedBlocks,
    };
  }

  /**
   * Process individual block
   */
  async processBlock(
    block: Block,
    capabilities: Capabilities,
    _options?: Record<string, unknown>
  ): Promise<Block> {
    // Select best variant for this block
    const bestVariant = this.variantSelector.selectBestVariant(block.variants, capabilities);

    // Filter variants to only include the best one (and fallbacks)
    const filteredVariants = bestVariant
      ? [bestVariant, ...this.getFallbackVariants(block.variants, bestVariant)]
      : block.variants;

    return {
      ...block,
      variants: filteredVariants,
    };
  }

  /**
   * Apply representation filtering to content
   */
  private applyRepresentation(content: ContentItem, representation: string): ContentItem {
    const repr = content.representations?.[representation];
    if (!repr) {
      return content;
    }

    const allowedBlockIds = new Set(repr.blocks);
    const filteredBlocks = content.blocks.filter((block) => allowedBlockIds.has(block.id));

    return {
      ...content,
      blocks: filteredBlocks,
    };
  }

  /**
   * Get fallback variants for graceful degradation
   */
  private getFallbackVariants(allVariants: Variant[], selectedVariant: Variant): Variant[] {
    // Return a few fallback variants in case the selected one fails
    return allVariants.filter((v) => v !== selectedVariant).slice(0, 2); // Keep 2 fallbacks
  }
}
