/**
 * @fileoverview Base renderer implementations
 *
 * This module contains base renderer classes that can be extended
 * by framework-specific implementations.
 */

import type { Block, PayloadSource } from '../types';
import type { BlockRenderer, RenderContext, RenderResult } from './interfaces';
import type { ContentResolver, RenderingContent } from './content-resolution';
import { PayloadSourceSelector } from './variant-selector';
import { DefaultContentResolver } from './resolver';

/**
 * Abstract base class for block renderers
 */
export abstract class BaseBlockRenderer<TProps = unknown, TResult = unknown>
  implements BlockRenderer<TProps, TResult>
{
  protected payloadSourceSelector = new PayloadSourceSelector();
  protected contentResolver: ContentResolver = new DefaultContentResolver();

  abstract readonly kind: string;
  abstract readonly priority: number;

  /**
   * Default implementation checks if block kind matches
   */
  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === this.kind && this.hasRenderablePayloadSource(block, context);
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
   * Select best payload source for rendering
   */
  protected selectPayloadSource(block: Block, context: RenderContext): PayloadSource | null {
    return this.payloadSourceSelector.selectBestPayloadSource(block, context.capabilities);
  }

  /**
   * Resolve content for rendering from the best payload source
   */
  protected async resolveRenderingContent(block: Block, context: RenderContext): Promise<RenderingContent> {
    return this.contentResolver.resolveBlockContent(block, context.capabilities);
  }

  /**
   * Set the content resolver to use
   */
  setContentResolver(resolver: ContentResolver): void {
    this.contentResolver = resolver;
  }

  /**
   * Check if block has at least one renderable payload source
   */
  protected hasRenderablePayloadSource(block: Block, context: RenderContext): boolean {
    return this.selectPayloadSource(block, context) !== null;
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
export abstract class BaseTextRenderer<
  TProps = unknown,
  TResult = unknown,
> extends BaseBlockRenderer<TProps, TResult> {
  /**
   * Extract text content from payload source
   */
  protected async getTextContent(payloadSource: PayloadSource): Promise<string> {
    if (payloadSource.type === 'inline') {
      return payloadSource.source || '';
    }

    if (!payloadSource.uri) {
      throw new Error('External payload source has no URI for text content');
    }

    try {
      const response = await fetch(payloadSource.uri);
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
export abstract class BaseImageRenderer<
  TProps = unknown,
  TResult = unknown,
> extends BaseBlockRenderer<TProps, TResult> {
  /**
   * Check if payload source is an image
   */
  protected isImagePayloadSource(payloadSource: PayloadSource): boolean {
    return payloadSource.mediaType.startsWith('image/');
  }

  /**
   * Get image dimensions from payload source
   */
  protected getImageDimensions(payloadSource: PayloadSource): { width?: number; height?: number } {
    return {
      width: payloadSource.width,
      height: payloadSource.height,
    };
  }
}
