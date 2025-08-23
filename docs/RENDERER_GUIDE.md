# Renderer Implementation Guide

This guide shows you how to build custom renderers for the Portable Content TypeScript SDK. Renderers are framework-specific implementations that take content blocks and render them using your chosen UI framework.

## Quick Start

### 1. Basic Renderer Structure

Every renderer extends one of the base renderer classes and implements the required methods:

```typescript
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';
import type { Block, RenderContext, RenderResult } from '@portable-content/typescript-sdk';

class MyCustomRenderer extends BaseBlockRenderer<MyProps, MyResult> {
  readonly kind = 'my-block-type'; // Block type this renderer handles
  readonly priority = 1; // Higher priority = preferred renderer

  async render(
    block: Block,
    props: MyProps,
    context: RenderContext
  ): Promise<RenderResult<MyResult>> {
    // 1. Select best variant for client capabilities
    const variant = this.selectVariant(block, context);

    if (!variant) {
      return { content: null, variant: null, errors: ['No suitable variant'] };
    }

    // 2. Render using your framework
    const content = renderWithMyFramework(variant, props);

    // 3. Return result
    return {
      content,
      variant,
      metadata: { renderTime: Date.now() },
    };
  }
}
```

### 2. Register Your Renderer

```typescript
import { DefaultRendererRegistry } from '@portable-content/typescript-sdk';

const registry = new DefaultRendererRegistry();
registry.register(new MyCustomRenderer());

// Now you can render blocks
const renderer = registry.getRenderer(block, context);
if (renderer) {
  const result = await renderer.render(block, props, context);
}
```

## Base Renderer Classes

### BaseBlockRenderer

The foundation class for all renderers. Provides:

- Variant selection logic
- Error handling utilities
- Loading state management
- Common validation methods

```typescript
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';

class GenericRenderer extends BaseBlockRenderer<Props, Result> {
  readonly kind = 'generic';
  readonly priority = 1;

  async render(block, props, context) {
    // Automatic variant selection
    const variant = this.selectVariant(block, context);

    // Error handling
    try {
      const content = await processVariant(variant);
      return { content, variant };
    } catch (error) {
      this.handleError(error, context);
      return { content: null, variant, errors: [error.message] };
    }
  }
}
```

### BaseTextRenderer

Specialized for text-based content (markdown, HTML, plain text):

```typescript
import { BaseTextRenderer } from '@portable-content/typescript-sdk';

class MarkdownRenderer extends BaseTextRenderer<MarkdownProps, HTMLElement> {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);

    // Built-in text fetching
    const markdownText = await this.getTextContent(variant);

    // Render with your markdown processor
    const html = renderMarkdown(markdownText, props.theme);

    return {
      content: createHTMLElement(html),
      variant,
      metadata: { wordCount: markdownText.split(' ').length },
    };
  }
}
```

### BaseImageRenderer

Specialized for image content with dimension handling:

```typescript
import { BaseImageRenderer } from '@portable-content/typescript-sdk';

class ResponsiveImageRenderer extends BaseImageRenderer<ImageProps, ImageElement> {
  readonly kind = 'image';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);

    // Check if it's actually an image
    if (!this.isImageVariant(variant)) {
      return { content: null, variant, errors: ['Not an image variant'] };
    }

    // Get dimensions
    const { width, height } = this.getImageDimensions(variant);

    // Create responsive image
    const img = createImageElement({
      src: variant.uri,
      alt: props.alt,
      width: Math.min(width, context.capabilities.hints?.width || width),
      height: Math.min(height, context.capabilities.hints?.height || height),
    });

    return {
      content: img,
      variant,
      metadata: { originalWidth: width, originalHeight: height },
    };
  }
}
```

## Framework-Specific Examples

### React Native Renderer

```typescript
import React from 'react';
import { Image, Text, View } from 'react-native';
import { BaseImageRenderer } from '@portable-content/typescript-sdk';

class ReactNativeImageRenderer extends BaseImageRenderer<ImageProps, React.ReactElement> {
  readonly kind = 'image';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);

    if (!variant || !this.isImageVariant(variant)) {
      return {
        content: <Text>Image not available</Text>,
        variant: null,
        errors: ['No suitable image variant']
      };
    }

    const { width, height } = this.getImageDimensions(variant);
    const screenWidth = context.capabilities.hints?.width || 375;

    // Responsive sizing
    const aspectRatio = width && height ? width / height : 1;
    const displayWidth = Math.min(width || screenWidth, screenWidth - 32);
    const displayHeight = displayWidth / aspectRatio;

    return {
      content: (
        <View style={{ padding: 16 }}>
          <Image
            source={{ uri: variant.uri }}
            style={{
              width: displayWidth,
              height: displayHeight,
              borderRadius: 8
            }}
            resizeMode="cover"
          />
          {props.caption && (
            <Text style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              {props.caption}
            </Text>
          )}
        </View>
      ),
      variant,
      metadata: { displayWidth, displayHeight, aspectRatio }
    };
  }
}
```

### Vue 3 Renderer

```typescript
import { h, defineComponent } from 'vue';
import { BaseTextRenderer } from '@portable-content/typescript-sdk';

class VueMarkdownRenderer extends BaseTextRenderer<MarkdownProps, any> {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);

    if (!variant) {
      return {
        content: h('div', { class: 'error' }, 'Content not available'),
        variant: null,
      };
    }

    try {
      const markdown = await this.getTextContent(variant);
      const html = await renderMarkdownToHTML(markdown);

      return {
        content: h('div', {
          class: ['markdown-content', props.theme],
          innerHTML: html,
        }),
        variant,
        metadata: { length: markdown.length },
      };
    } catch (error) {
      this.handleError(error, context);
      return {
        content: h('div', { class: 'error' }, 'Failed to load content'),
        variant,
        errors: [error.message],
      };
    }
  }
}
```

### React Web Renderer

```typescript
import React from 'react';
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';

class ReactMermaidRenderer extends BaseBlockRenderer<MermaidProps, React.ReactElement> {
  readonly kind = 'mermaid';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);

    if (!variant) {
      return {
        content: <div className="error">Diagram not available</div>,
        variant: null
      };
    }

    // Prefer SVG variant for web
    const svgVariant = block.variants.find(v => v.mediaType === 'image/svg+xml') || variant;

    if (svgVariant.mediaType === 'image/svg+xml') {
      return {
        content: (
          <div className={`mermaid-diagram ${props.theme}`}>
            <img
              src={svgVariant.uri}
              alt="Mermaid diagram"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        ),
        variant: svgVariant
      };
    }

    // Fallback to rendering from source
    const source = block.payload?.source || await this.getTextContent(variant);

    return {
      content: (
        <div
          className={`mermaid ${props.theme}`}
          data-source={source}
        >
          {/* Mermaid will render this */}
        </div>
      ),
      variant,
      metadata: { renderMode: 'client-side' }
    };
  }
}
```

## Advanced Patterns

### Multi-Priority Renderers

Register multiple renderers for the same block type with different priorities:

```typescript
// High-quality renderer (requires specific capabilities)
class HighQualityRenderer extends BaseBlockRenderer {
  readonly kind = 'video';
  readonly priority = 10;

  canRender(block, context) {
    return super.canRender(block, context) && context.capabilities.hints?.network === 'FAST';
  }
}

// Fallback renderer (works everywhere)
class FallbackRenderer extends BaseBlockRenderer {
  readonly kind = 'video';
  readonly priority = 1;

  // Always can render (fallback)
}

registry.register(new HighQualityRenderer());
registry.register(new FallbackRenderer());
```

### Custom Capability Checking

```typescript
class WebGLRenderer extends BaseBlockRenderer {
  readonly kind = '3d-model';
  readonly priority = 1;

  canRender(block, context) {
    // Custom capability check
    const hasWebGL =
      context.capabilities.hints?.webgl || typeof WebGLRenderingContext !== 'undefined';

    return super.canRender(block, context) && hasWebGL;
  }

  async render(block, props, context) {
    // Render 3D model with WebGL
    const variant = this.selectVariant(block, context);
    const model = await loadModel(variant.uri);

    return {
      content: renderWebGLModel(model, props),
      variant,
      metadata: { triangles: model.triangleCount },
    };
  }
}
```

### Error Handling and Loading States

```typescript
class RobustRenderer extends BaseBlockRenderer {
  async render(block, props, context) {
    // Set loading state
    this.setLoading(true, context);

    try {
      const variant = this.selectVariant(block, context);
      const content = await loadAndRenderContent(variant);

      this.setLoading(false, context);

      return { content, variant };
    } catch (error) {
      this.setLoading(false, context);
      this.handleError(error, context);

      // Return fallback content
      return {
        content: createErrorFallback(error.message),
        variant: null,
        errors: [error.message],
      };
    }
  }
}
```

## Testing Your Renderers

```typescript
import { MockContentFactory } from '@portable-content/typescript-sdk/tests';

describe('MyRenderer', () => {
  let renderer: MyRenderer;
  let mockContext: RenderContext;

  beforeEach(() => {
    renderer = new MyRenderer();
    mockContext = {
      capabilities: MockContentFactory.createCapabilities('desktop'),
    };
  });

  it('should render markdown blocks', async () => {
    const block = MockContentFactory.createMarkdownBlock('# Test');
    const result = await renderer.render(block, {}, mockContext);

    expect(result.content).toBeDefined();
    expect(result.variant).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should handle missing variants gracefully', async () => {
    const block = MockContentFactory.createEdgeCaseBlock('empty-variants');
    const result = await renderer.render(block, {}, mockContext);

    expect(result.content).toBeNull();
    expect(result.errors).toContain('No suitable variant');
  });
});
```

This guide provides everything you need to build custom renderers for any UI framework. The key is extending the appropriate base class and implementing the `render` method with your framework-specific rendering logic.
