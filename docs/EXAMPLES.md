# Usage Examples

Comprehensive examples showing how to use the Portable Content TypeScript SDK in different scenarios.

## Basic Usage

### 1. Simple Payload Source Selection

```typescript
import { PayloadSourceSelector, CapabilityDetector } from '@portable-content/typescript-sdk';

// Detect what the client supports
const detector = new CapabilityDetector();
const capabilities = detector.detectCapabilities();
console.log(capabilities);
// {
//   accept: ['text/html', 'image/webp', 'image/png', 'image/jpeg'],
//   hints: { width: 1920, height: 1080, density: 2.0, network: 'FAST' }
// }

// Create a block with multiple payload sources
const block = {
  id: 'image-1',
  kind: 'image',
  content: {
    primary: { type: 'external', mediaType: 'image/webp', uri: 'image.webp' },
    alternatives: [
      { type: 'external', mediaType: 'image/avif', uri: 'image.avif' },
      { type: 'external', mediaType: 'image/jpeg', uri: 'image.jpg' }
    ]
  }
};

const selector = new PayloadSourceSelector();
const bestSource = selector.selectBestPayloadSource(block, capabilities);
console.log(bestSource);
// { type: 'external', mediaType: 'image/webp', uri: 'image.webp' }
```

### 2. Content Processing

```typescript
import { DefaultContentProcessor, MockContentFactory } from '@portable-content/typescript-sdk';

// Create or fetch content
const manifest = MockContentFactory.createContentManifest();

// Process for optimal delivery
const processor = new DefaultContentProcessor();
const optimized = await processor.processContent(manifest, capabilities);

// Each block now has optimal payload sources available
optimized.blocks.forEach((block) => {
  console.log(`Block ${block.id}: ${block.content.primary.mediaType}`);
});

// Apply representation filtering
const summary = await processor.processContent(manifest, capabilities, {
  representation: 'summary',
});
console.log(`Summary has ${summary.blocks.length} blocks`);
```

## Framework Integration Examples

### React Native App

```typescript
// components/ContentRenderer.tsx
import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import {
  DefaultRendererRegistry,
  BaseImageRenderer,
  BaseTextRenderer,
  CapabilityDetector
} from '@portable-content/typescript-sdk';

// Image renderer for React Native
class RNImageRenderer extends BaseImageRenderer {
  readonly kind = 'image';
  readonly priority = 1;

  async render(block, props, context) {
    const payloadSource = this.selectPayloadSource(block, context);

    if (!payloadSource || !this.isImagePayloadSource(payloadSource)) {
      return { content: <Text>Image unavailable</Text>, payloadSource: null };
    }

    const { width, height } = this.getImageDimensions(payloadSource);
    const screenWidth = context.capabilities.hints?.width || 375;
    const displayWidth = Math.min(width || screenWidth, screenWidth - 32);

    const imageUri = payloadSource.type === 'external' ? payloadSource.uri : payloadSource.source;

    return {
      content: (
        <View style={{ padding: 16 }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: displayWidth, height: displayWidth * 0.6 }}
            resizeMode="cover"
          />
          {props.caption && (
            <Text style={{ marginTop: 8, color: '#666' }}>
              {props.caption}
            </Text>
          )}
        </View>
      ),
      payloadSource
    };
  }
}

// Markdown renderer for React Native
class RNMarkdownRenderer extends BaseTextRenderer {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block, props, context) {
    const payloadSource = this.selectPayloadSource(block, context);
    const text = await this.getTextContent(payloadSource);

    // Simple markdown to React Native (you'd use a real markdown library)
    const lines = text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <Text key={index} style={{ fontSize: 24, fontWeight: 'bold' }}>{line.slice(2)}</Text>;
      }
      return <Text key={index}>{line}</Text>;
    });

    return {
      content: <View style={{ padding: 16 }}>{lines}</View>,
      payloadSource
    };
  }
}

// Main content component
export const ContentRenderer: React.FC<{ content: ContentManifest }> = ({ content }) => {
  const [renderedBlocks, setRenderedBlocks] = React.useState([]);

  React.useEffect(() => {
    const renderContent = async () => {
      // Set up rendering system
      const detector = new CapabilityDetector();
      const capabilities = detector.detectCapabilities();

      const registry = new DefaultRendererRegistry();
      registry.register(new RNImageRenderer());
      registry.register(new RNMarkdownRenderer());

      const context = { capabilities };

      // Render each block
      const rendered = await Promise.all(
        content.blocks.map(async (block) => {
          const renderer = registry.getRenderer(block, context);
          if (renderer) {
            const result = await renderer.render(block, {}, context);
            return result.content;
          }
          return <Text key={block.id}>Unsupported block type: {block.kind}</Text>;
        })
      );

      setRenderedBlocks(rendered);
    };

    renderContent();
  }, [content]);

  return (
    <ScrollView>
      {renderedBlocks.map((block, index) => (
        <View key={index}>{block}</View>
      ))}
    </ScrollView>
  );
};
```

### Vue 3 App

```typescript
// composables/useContentRenderer.ts
import { ref, computed } from 'vue';
import {
  DefaultRendererRegistry,
  DefaultContentProcessor,
  CapabilityDetector,
} from '@portable-content/typescript-sdk';
import { createImageRenderer, createMarkdownRenderer } from './renderers';

export function useContentRenderer() {
  const registry = new DefaultRendererRegistry();
  const processor = new DefaultContentProcessor();
  const detector = new CapabilityDetector();

  // Register Vue-specific renderers
  registry.register(createImageRenderer());
  registry.register(createMarkdownRenderer());

  const capabilities = detector.detectCapabilities();

  const renderContent = async (content: ContentManifest) => {
    // Process content for optimal delivery
    const optimized = await processor.processContent(content, capabilities);

    // Render each block
    const context = { capabilities };
    const rendered = await Promise.all(
      optimized.blocks.map(async (block) => {
        const renderer = registry.getRenderer(block, context);
        if (renderer) {
          const result = await renderer.render(block, {}, context);
          return {
            id: block.id,
            content: result.content,
            payloadSource: result.payloadSource,
          };
        }
        return null;
      })
    );

    return rendered.filter(Boolean);
  };

  return {
    renderContent,
    capabilities: computed(() => capabilities),
  };
}

// renderers/index.ts
import { h } from 'vue';
import { BaseImageRenderer, BaseTextRenderer } from '@portable-content/typescript-sdk';

export function createImageRenderer() {
  return new (class extends BaseImageRenderer {
    readonly kind = 'image';
    readonly priority = 1;

    async render(block, props, context) {
      const payloadSource = this.selectPayloadSource(block, context);

      if (!payloadSource || !this.isImagePayloadSource(payloadSource)) {
        return {
          content: h('div', { class: 'error' }, 'Image not available'),
          payloadSource: null,
        };
      }

      const { width, height } = this.getImageDimensions(payloadSource);
      const imageSrc = payloadSource.type === 'external' ? payloadSource.uri : payloadSource.source;

      return {
        content: h('figure', { class: 'image-block' }, [
          h('img', {
            src: imageSrc,
            alt: props.alt || 'Image',
            style: {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
            },
          }),
          props.caption && h('figcaption', props.caption),
        ]),
        payloadSource,
        metadata: { originalWidth: width, originalHeight: height },
      };
    }
  })();
}

export function createMarkdownRenderer() {
  return new (class extends BaseTextRenderer {
    readonly kind = 'markdown';
    readonly priority = 1;

    async render(block, props, context) {
      const payloadSource = this.selectPayloadSource(block, context);
      const markdown = await this.getTextContent(payloadSource);

      // Convert markdown to HTML (use your preferred markdown library)
      const html = await convertMarkdownToHTML(markdown);

      return {
        content: h('div', {
          class: ['markdown-content', props.theme],
          innerHTML: html,
        }),
        payloadSource,
        metadata: { wordCount: markdown.split(' ').length },
      };
    }
  })();
}
```

### Next.js App

```typescript
// components/ContentRenderer.tsx
import React from 'react';
import {
  DefaultRendererRegistry,
  DefaultContentProcessor,
  CapabilityDetector
} from '@portable-content/typescript-sdk';

// Server-side content processing
export async function getServerSideProps(context) {
  const detector = new CapabilityDetector();
  const processor = new DefaultContentProcessor();

  // Get content from your API
  const content = await fetchContent(context.params.id);

  // Detect capabilities from request headers
  const capabilities = {
    accept: context.req.headers.accept?.split(',') || ['text/html'],
    hints: {
      width: 1200, // Default desktop width
      network: 'FAST' // Assume fast for SSR
    }
  };

  // Process content server-side
  const optimized = await processor.processContent(content, capabilities);

  return {
    props: {
      content: optimized,
      capabilities
    }
  };
}

// Client-side renderer component
const ContentRenderer: React.FC<{ content: ContentManifest, capabilities: Capabilities }> = ({
  content,
  capabilities
}) => {
  const [renderedContent, setRenderedContent] = React.useState(null);

  React.useEffect(() => {
    const renderContent = async () => {
      const registry = new DefaultRendererRegistry();

      // Register React renderers
      registry.register(new ReactImageRenderer());
      registry.register(new ReactMarkdownRenderer());

      const context = { capabilities };

      const rendered = await Promise.all(
        content.blocks.map(async (block) => {
          const renderer = registry.getRenderer(block, context);
          if (renderer) {
            const result = await renderer.render(block, {}, context);
            return (
              <div key={block.id} className="content-block">
                {result.content}
              </div>
            );
          }
          return null;
        })
      );

      setRenderedContent(rendered.filter(Boolean));
    };

    renderContent();
  }, [content, capabilities]);

  return (
    <div className="content-container">
      {renderedContent}
    </div>
  );
};

export default ContentRenderer;
```

## Advanced Usage Patterns

### Custom Block Type

```typescript
// Define custom block type
interface CodeBlock extends Block {
  kind: 'code';
  payload: {
    language: string;
    code: string;
    theme?: string;
  };
}

// Create custom renderer
class CodeRenderer extends BaseBlockRenderer<CodeProps, HTMLElement> {
  readonly kind = 'code';
  readonly priority = 1;

  async render(block: CodeBlock, props, context) {
    const { language, code, theme } = block.payload;

    // Use syntax highlighting library
    const highlighted = await highlightCode(code, language);

    const element = document.createElement('div');
    element.className = `code-block theme-${theme || 'default'}`;
    element.innerHTML = `
      <div class="code-header">
        <span class="language">${language}</span>
        <button class="copy-btn">Copy</button>
      </div>
      <pre><code>${highlighted}</code></pre>
    `;

    return {
      content: element,
      payloadSource: null, // No payload sources for code blocks
      metadata: { language, lines: code.split('\n').length },
    };
  }
}
```

### Network-Aware Rendering

```typescript
class NetworkAwareImageRenderer extends BaseImageRenderer {
  async render(block, props, context) {
    const payloadSource = this.selectPayloadSource(block, context);
    const network = context.capabilities.hints?.network;

    // Adjust quality based on network
    let quality = 'high';
    if (network === 'SLOW') quality = 'medium';
    if (network === 'CELLULAR') quality = 'low';

    // Progressive loading for slow networks
    if (network !== 'FAST') {
      return this.renderProgressiveImage(payloadSource, quality);
    }

    return this.renderStandardImage(payloadSource);
  }

  private async renderProgressiveImage(payloadSource, quality) {
    // Load low-quality placeholder first
    const placeholder = await this.generatePlaceholder(payloadSource);
    const imageUri = payloadSource.type === 'external' ? payloadSource.uri : payloadSource.source;

    return {
      content: createProgressiveImage(placeholder, imageUri),
      payloadSource,
      metadata: { loadingStrategy: 'progressive', quality },
    };
  }
}
```

### Error Handling and Fallbacks

```typescript
class RobustRenderer extends BaseBlockRenderer {
  async render(block, props, context) {
    try {
      // Attempt primary rendering
      return await this.renderPrimary(block, props, context);
    } catch (primaryError) {
      console.warn('Primary rendering failed:', primaryError);

      try {
        // Attempt fallback rendering
        return await this.renderFallback(block, props, context);
      } catch (fallbackError) {
        console.error('Fallback rendering failed:', fallbackError);

        // Return error state
        return {
          content: this.createErrorContent(primaryError.message),
          payloadSource: null,
          errors: [primaryError.message, fallbackError.message],
        };
      }
    }
  }

  private createErrorContent(message: string) {
    return `<div class="error-block">Failed to render content: ${message}</div>`;
  }
}
```

### Testing with Mock Data

```typescript
import { MockContentFactory } from '@portable-content/typescript-sdk/tests';

describe('Content Rendering', () => {
  it('should render different content types', async () => {
    // Create test content
    const content = MockContentFactory.createContentManifest({
      includeMarkdown: true,
      includeImage: true,
      includeMermaid: true,
    });

    // Test with different capability scenarios
    const scenarios = ['desktop', 'mobile', 'slow-network', 'high-density'];

    for (const scenario of scenarios) {
      const capabilities = MockContentFactory.createCapabilities(scenario);
      const processor = new DefaultContentProcessor();

      const processed = await processor.processContent(content, capabilities);

      // Verify optimization worked
      expect(processed.blocks).toHaveLength(3);
      processed.blocks.forEach((block) => {
        expect(block.content.primary).toBeDefined();
        expect(block.content.primary.mediaType).toBeDefined(); // Best payload source selected
      });
    }
  });

  it('should handle edge cases gracefully', async () => {
    const edgeCases = ['empty-alternatives', 'no-uri', 'huge-file', 'tiny-file'];

    for (const edgeCase of edgeCases) {
      const block = MockContentFactory.createEdgeCaseBlock(edgeCase);
      const capabilities = MockContentFactory.createCapabilities('desktop');

      const renderer = new MyRenderer();
      const context = { capabilities };

      // Should not throw
      const result = await renderer.render(block, {}, context);
      expect(result).toBeDefined();
    }
  });
});
```

These examples demonstrate the flexibility and power of the Portable Content SDK across different frameworks and use cases. The key is leveraging the framework-agnostic core with framework-specific renderers.
