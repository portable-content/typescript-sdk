/**
 * @fileoverview Renderer registry implementation
 *
 * This module contains the registry for managing block renderers
 * and dispatching rendering to the appropriate renderer.
 */

import type { Block } from '../types';
import type { BlockRenderer, RendererRegistry, RenderContext } from './interfaces';

/**
 * Default implementation of renderer registry
 */
export class DefaultRendererRegistry implements RendererRegistry {
  private renderers = new Map<string, BlockRenderer[]>();

  /**
   * Register a renderer for a block kind
   */
  register<TProps, TResult>(renderer: BlockRenderer<TProps, TResult>): void {
    const existing = this.renderers.get(renderer.kind) || [];

    // Insert in priority order (highest first)
    const insertIndex = existing.findIndex((r) => r.priority < renderer.priority);
    if (insertIndex === -1) {
      existing.push(renderer);
    } else {
      existing.splice(insertIndex, 0, renderer);
    }

    this.renderers.set(renderer.kind, existing);
  }

  /**
   * Unregister a renderer
   */
  unregister(kind: string, priority?: number): void {
    const existing = this.renderers.get(kind);
    if (!existing) return;

    if (priority !== undefined) {
      // Remove specific renderer by priority
      const filtered = existing.filter((r) => r.priority !== priority);
      if (filtered.length === 0) {
        this.renderers.delete(kind);
      } else {
        this.renderers.set(kind, filtered);
      }
    } else {
      // Remove all renderers for kind
      this.renderers.delete(kind);
    }
  }

  /**
   * Get the best renderer for a block
   */
  getRenderer(block: Block, context: RenderContext): BlockRenderer | null {
    const renderers = this.renderers.get(block.kind);
    if (!renderers) return null;

    // Find first renderer that can handle this block
    for (const renderer of renderers) {
      if (renderer.canRender(block, context)) {
        return renderer;
      }
    }

    return null;
  }

  /**
   * Get all renderers for a kind
   */
  getRenderers(kind: string): BlockRenderer[] {
    return this.renderers.get(kind) || [];
  }

  /**
   * Check if a kind can be rendered
   */
  canRender(kind: string): boolean {
    return this.renderers.has(kind);
  }

  /**
   * Get all registered kinds
   */
  getRegisteredKinds(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Clear all renderers
   */
  clear(): void {
    this.renderers.clear();
  }
}
