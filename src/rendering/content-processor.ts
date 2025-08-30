/**
 * @fileoverview Content processing utilities
 *
 * This module contains utilities for processing content items
 * and preparing them for rendering.
 */

import type { ContentManifest, Block, PayloadSource, Capabilities } from '../types';
import type { ContentProcessor } from './interfaces';
import { PayloadSourceSelector } from './variant-selector';

/**
 * Processes content for optimal rendering
 */
export class DefaultContentProcessor implements ContentProcessor {
  private payloadSourceSelector = new PayloadSourceSelector();

  /**
   * Process content before rendering
   */
  async processContent(
    content: ContentManifest,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<ContentManifest> {
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
    // Select best payload source for this block
    const bestPayloadSource = this.payloadSourceSelector.selectBestPayloadSource(block, capabilities);

    // The block content structure already contains primary/source/alternatives
    // No need to modify it - the selector will choose the best one at render time
    return block;
  }

  /**
   * Apply representation filtering to content
   */
  private applyRepresentation(content: ContentManifest, representation: string): ContentManifest {
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
}
