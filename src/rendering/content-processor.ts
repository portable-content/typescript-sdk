/**
 * @fileoverview Content processing utilities
 *
 * This module contains utilities for processing content items
 * and preparing them for rendering.
 */

import type { ContentManifest, Element, Capabilities } from '../types';
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

    // Process each element (formerly blocks)
    const processedElements = await Promise.all(
      processedContent.elements.map((element) =>
        this.processElement(element, capabilities, options)
      )
    );

    return {
      ...processedContent,
      elements: processedElements,
    };
  }

  /**
   * Process individual element (formerly block)
   */
  async processElement(
    element: Element,
    _capabilities: Capabilities,
    _options?: Record<string, unknown>
  ): Promise<Element> {
    // The element content structure already contains primary/source/alternatives
    // No need to modify it - the selector will choose the best one at render time
    return element;
  }

  /**
   * Apply representation filtering to content
   */
  private applyRepresentation(content: ContentManifest, representation: string): ContentManifest {
    const repr = content.representations?.[representation];
    if (!repr) {
      return content;
    }

    const allowedElementIds = new Set(repr.elements);
    const filteredElements = content.elements.filter((element) =>
      allowedElementIds.has(element.id)
    );

    return {
      ...content,
      elements: filteredElements,
    };
  }
}
