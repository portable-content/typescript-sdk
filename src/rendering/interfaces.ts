/**
 * @fileoverview Framework-agnostic rendering interfaces
 */

import type { Block, PayloadSource, Capabilities } from '../types';

/**
 * Result of rendering a block
 */
export interface RenderResult<T = unknown> {
  /** Rendered content (framework-specific) */
  content: T;
  /** Selected payload source used for rendering */
  payloadSource: PayloadSource | null;
  /** Any metadata about the rendering */
  metadata?: Record<string, unknown>;
  /** Errors that occurred during rendering */
  errors?: string[];
}

/**
 * Context passed to renderers
 */
export interface RenderContext {
  /** Client capabilities */
  capabilities: Capabilities;
  /** Additional rendering options */
  options?: Record<string, unknown>;
  /** Callback for handling errors */
  onError?: (error: Error) => void;
  /** Callback for loading states */
  onLoading?: (loading: boolean) => void;
}

/**
 * Base interface for block renderers
 */
export interface BlockRenderer<TProps = unknown, TResult = unknown> {
  /** Block kind this renderer handles */
  readonly kind: string;

  /** Priority for renderer selection (higher = preferred) */
  readonly priority: number;

  /**
   * Check if this renderer can handle the given block
   */
  canRender(block: Block, context: RenderContext): boolean;

  /**
   * Render the block with given props
   */
  render(block: Block, props: TProps, context: RenderContext): Promise<RenderResult<TResult>>;

  /**
   * Get default props for this renderer
   */
  getDefaultProps?(): Partial<TProps>;

  /**
   * Validate props before rendering
   */
  validateProps?(props: TProps): string[];
}

/**
 * Registry for managing block renderers
 */
export interface RendererRegistry {
  /**
   * Register a renderer for a block kind
   */
  register<TProps, TResult>(renderer: BlockRenderer<TProps, TResult>): void;

  /**
   * Unregister a renderer
   */
  unregister(kind: string, priority?: number): void;

  /**
   * Get the best renderer for a block
   */
  getRenderer(block: Block, context: RenderContext): BlockRenderer | null;

  /**
   * Get all renderers for a kind
   */
  getRenderers(kind: string): BlockRenderer[];

  /**
   * Check if a kind can be rendered
   */
  canRender(kind: string): boolean;
}

/**
 * Content processor interface
 */
export interface ContentProcessor {
  /**
   * Process content before rendering
   */
  processContent(
    content: unknown,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<unknown>;

  /**
   * Process individual block
   */
  processBlock(
    block: Block,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<Block>;
}
