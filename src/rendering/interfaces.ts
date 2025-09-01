/**
 * @fileoverview Framework-agnostic rendering interfaces
 */

import type { Element, PayloadSource, Capabilities } from '../types';

/**
 * Result of rendering an element
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
 * Base interface for element renderers
 */
export interface ElementRenderer<TProps = unknown, TResult = unknown> {
  /** Element kind this renderer handles */
  readonly kind: string;

  /** Priority for renderer selection (higher = preferred) */
  readonly priority: number;

  /**
   * Check if this renderer can handle the given element
   */
  canRender(element: Element, context: RenderContext): boolean;

  /**
   * Render the element with given props
   */
  render(element: Element, props: TProps, context: RenderContext): Promise<RenderResult<TResult>>;

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
 * @deprecated Use ElementRenderer instead. Will be removed in v0.4.0
 */
export interface BlockRenderer<TProps = unknown, TResult = unknown>
  extends ElementRenderer<TProps, TResult> {}

/**
 * Registry for managing element renderers
 */
export interface RendererRegistry {
  /**
   * Register a renderer for an element kind
   */
  register<TProps, TResult>(renderer: ElementRenderer<TProps, TResult>): void;

  /**
   * Unregister a renderer
   */
  unregister(kind: string, priority?: number): void;

  /**
   * Get the best renderer for an element
   */
  getRenderer(element: Element, context: RenderContext): ElementRenderer | null;

  /**
   * Get all renderers for a kind
   */
  getRenderers(kind: string): ElementRenderer[];

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
   * Process individual element
   */
  processElement(
    element: Element,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<Element>;
}
