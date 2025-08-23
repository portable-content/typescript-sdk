/**
 * @fileoverview Base renderer implementations
 *
 * This module contains base renderer classes that can be extended
 * by framework-specific implementations.
 */

import type { Block, Variant } from '../types';
import type { BlockRenderer, RenderContext, RenderResult } from './interfaces';
import { VariantSelector } from './variant-selector';

/**
 * Abstract base class for block renderers
 */
export abstract class BaseBlockRenderer<TProps = unknown, TResult = unknown>
  implements BlockRenderer<TProps, TResult> {

  protected variantSelector = new VariantSelector();

  abstract readonly kind: string;
  abstract readonly priority: number;

  /**
   * Default implementation checks if block kind matches
   */
  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === this.kind && this.hasRenderableVariant(block, context);
  }

  /**
   * Abstract render method to be implemented by subclasses
   */
  abstract render(
    block: Block,
    props: TProps,
    context: RenderContext
  ): Promise<RenderResult<TResult>>;

  /**
   * Get default props (override in subclasses)
   */
  getDefaultProps(): Partial<TProps> {
    return {};
  }

  /**
   * Validate props (override in subclasses)
   */
  validateProps(_props: TProps): string[] {
    return [];
  }

  /**
   * Select best variant for rendering
   */
  protected selectVariant(block: Block, context: RenderContext): Variant | null {
    return this.variantSelector.selectBestVariant(block.variants, context.capabilities);
  }

  /**
   * Check if block has at least one renderable variant
   */
  protected hasRenderableVariant(block: Block, context: RenderContext): boolean {
    return this.selectVariant(block, context) !== null;
  }

  /**
   * Handle rendering errors consistently
   */
  protected handleError(error: Error, context: RenderContext): void {
    if (context.onError) {
      context.onError(error);
    } else {
      console.error(`Rendering error in ${this.kind} renderer:`, error);
    }
  }

  /**
   * Update loading state
   */
  protected setLoading(loading: boolean, context: RenderContext): void {
    if (context.onLoading) {
      context.onLoading(loading);
    }
  }
}

/**
 * Base renderer for text-based content
 */
export abstract class BaseTextRenderer<TProps = unknown, TResult = unknown>
  extends BaseBlockRenderer<TProps, TResult> {

  /**
   * Extract text content from variant
   */
  protected async getTextContent(variant: Variant): Promise<string> {
    if (!variant.uri) {
      throw new Error('Variant has no URI for text content');
    }

    try {
      const response = await fetch(variant.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch text content: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load text content: ${error}`);
    }
  }
}

/**
 * Base renderer for image-based content
 */
export abstract class BaseImageRenderer<TProps = unknown, TResult = unknown>
  extends BaseBlockRenderer<TProps, TResult> {

  /**
   * Check if variant is an image
   */
  protected isImageVariant(variant: Variant): boolean {
    return variant.mediaType.startsWith('image/');
  }

  /**
   * Get image dimensions from variant
   */
  protected getImageDimensions(variant: Variant): { width?: number; height?: number } {
    return {
      width: variant.width,
      height: variant.height
    };
  }
}
