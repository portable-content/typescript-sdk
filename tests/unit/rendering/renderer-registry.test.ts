/**
 * @fileoverview Tests for DefaultRendererRegistry
 */

import { DefaultRendererRegistry } from '../../../src/rendering/renderer-registry';
import type { Block, Capabilities } from '../../../src/types';
import type { BlockRenderer, RenderContext, RenderResult } from '../../../src/rendering/interfaces';

// Mock renderer for testing
class MockRenderer implements BlockRenderer {
  constructor(
    public readonly kind: string,
    public readonly priority: number = 1
  ) {}

  canRender(block: Block, context: RenderContext): boolean {
    return block.kind === this.kind;
  }

  async render(block: Block, props: any, context: RenderContext): Promise<RenderResult> {
    return {
      content: `Rendered ${block.kind}`,
      variant: block.variants[0] || null
    };
  }
}

// Mock renderer that can't render (for testing)
class FailingMockRenderer implements BlockRenderer {
  constructor(
    public readonly kind: string,
    public readonly priority: number = 1
  ) {}

  canRender(block: Block, context: RenderContext): boolean {
    return false; // Always fails
  }

  async render(block: Block, props: any, context: RenderContext): Promise<RenderResult> {
    throw new Error('Cannot render');
  }
}

describe('DefaultRendererRegistry', () => {
  let registry: DefaultRendererRegistry;
  let mockContext: RenderContext;

  beforeEach(() => {
    registry = new DefaultRendererRegistry();
    mockContext = {
      capabilities: { accept: ['text/html'] }
    };
  });

  describe('register', () => {
    it('should register a renderer', () => {
      const renderer = new MockRenderer('markdown');
      registry.register(renderer);

      expect(registry.canRender('markdown')).toBe(true);
      expect(registry.getRenderers('markdown')).toHaveLength(1);
    });

    it('should register multiple renderers for the same kind', () => {
      const renderer1 = new MockRenderer('markdown', 1);
      const renderer2 = new MockRenderer('markdown', 2);
      
      registry.register(renderer1);
      registry.register(renderer2);

      const renderers = registry.getRenderers('markdown');
      expect(renderers).toHaveLength(2);
      expect(renderers[0].priority).toBe(2); // Higher priority first
      expect(renderers[1].priority).toBe(1);
    });

    it('should maintain priority order when registering', () => {
      const renderer1 = new MockRenderer('markdown', 1);
      const renderer2 = new MockRenderer('markdown', 3);
      const renderer3 = new MockRenderer('markdown', 2);
      
      registry.register(renderer1);
      registry.register(renderer2);
      registry.register(renderer3);

      const renderers = registry.getRenderers('markdown');
      expect(renderers.map(r => r.priority)).toEqual([3, 2, 1]);
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      registry.register(new MockRenderer('markdown', 1));
      registry.register(new MockRenderer('markdown', 2));
      registry.register(new MockRenderer('image', 1));
    });

    it('should unregister all renderers for a kind', () => {
      registry.unregister('markdown');
      
      expect(registry.canRender('markdown')).toBe(false);
      expect(registry.getRenderers('markdown')).toHaveLength(0);
      expect(registry.canRender('image')).toBe(true); // Other kinds unaffected
    });

    it('should unregister specific renderer by priority', () => {
      registry.unregister('markdown', 2);
      
      const renderers = registry.getRenderers('markdown');
      expect(renderers).toHaveLength(1);
      expect(renderers[0].priority).toBe(1);
    });

    it('should handle unregistering non-existent kind', () => {
      expect(() => registry.unregister('nonexistent')).not.toThrow();
    });

    it('should handle unregistering non-existent priority', () => {
      expect(() => registry.unregister('markdown', 999)).not.toThrow();
      expect(registry.getRenderers('markdown')).toHaveLength(2); // No change
    });

    it('should remove kind when unregistering last renderer by priority', () => {
      // Register only one renderer for a new kind
      registry.register(new MockRenderer('video', 1));
      expect(registry.canRender('video')).toBe(true);

      // Unregister the only renderer by priority
      registry.unregister('video', 1);

      // Kind should be completely removed
      expect(registry.canRender('video')).toBe(false);
      expect(registry.getRenderers('video')).toHaveLength(0);
    });
  });

  describe('getRenderer', () => {
    it('should return the best renderer for a block', () => {
      const renderer1 = new MockRenderer('markdown', 1);
      const renderer2 = new MockRenderer('markdown', 2);
      
      registry.register(renderer1);
      registry.register(renderer2);

      const block: Block = {
        id: 'test',
        kind: 'markdown',
        payload: {},
        variants: []
      };

      const result = registry.getRenderer(block, mockContext);
      expect(result).toBe(renderer2); // Higher priority
    });

    it('should return null for unknown block kind', () => {
      const block: Block = {
        id: 'test',
        kind: 'unknown',
        payload: {},
        variants: []
      };

      const result = registry.getRenderer(block, mockContext);
      expect(result).toBeNull();
    });

    it('should skip renderers that cannot render the block', () => {
      const failingRenderer = new FailingMockRenderer('markdown', 2);
      const workingRenderer = new MockRenderer('markdown', 1);
      
      registry.register(failingRenderer);
      registry.register(workingRenderer);

      const block: Block = {
        id: 'test',
        kind: 'markdown',
        payload: {},
        variants: []
      };

      const result = registry.getRenderer(block, mockContext);
      expect(result).toBe(workingRenderer); // Should skip failing renderer
    });

    it('should return null if no renderer can handle the block', () => {
      const failingRenderer = new FailingMockRenderer('markdown', 1);
      registry.register(failingRenderer);

      const block: Block = {
        id: 'test',
        kind: 'markdown',
        payload: {},
        variants: []
      };

      const result = registry.getRenderer(block, mockContext);
      expect(result).toBeNull();
    });
  });

  describe('getRenderers', () => {
    it('should return empty array for unknown kind', () => {
      const renderers = registry.getRenderers('unknown');
      expect(renderers).toEqual([]);
    });

    it('should return all renderers for a kind in priority order', () => {
      const renderer1 = new MockRenderer('markdown', 1);
      const renderer2 = new MockRenderer('markdown', 3);
      const renderer3 = new MockRenderer('markdown', 2);
      
      registry.register(renderer1);
      registry.register(renderer2);
      registry.register(renderer3);

      const renderers = registry.getRenderers('markdown');
      expect(renderers).toHaveLength(3);
      expect(renderers.map(r => r.priority)).toEqual([3, 2, 1]);
    });
  });

  describe('canRender', () => {
    it('should return true for registered kinds', () => {
      registry.register(new MockRenderer('markdown'));
      expect(registry.canRender('markdown')).toBe(true);
    });

    it('should return false for unregistered kinds', () => {
      expect(registry.canRender('unknown')).toBe(false);
    });

    it('should return false after unregistering all renderers for a kind', () => {
      registry.register(new MockRenderer('markdown'));
      registry.unregister('markdown');
      expect(registry.canRender('markdown')).toBe(false);
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      registry.register(new MockRenderer('markdown'));
      registry.register(new MockRenderer('image'));
      registry.register(new MockRenderer('mermaid'));
    });

    it('should return all registered kinds', () => {
      const kinds = registry.getRegisteredKinds();
      expect(kinds).toContain('markdown');
      expect(kinds).toContain('image');
      expect(kinds).toContain('mermaid');
      expect(kinds).toHaveLength(3);
    });

    it('should clear all renderers', () => {
      registry.clear();
      
      expect(registry.getRegisteredKinds()).toHaveLength(0);
      expect(registry.canRender('markdown')).toBe(false);
      expect(registry.canRender('image')).toBe(false);
      expect(registry.canRender('mermaid')).toBe(false);
    });
  });
});
