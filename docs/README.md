# Documentation

Complete documentation for the Portable Content TypeScript SDK.

## Quick Links

- **[Renderer Guide](./RENDERER_GUIDE.md)** - How to build custom renderers for any UI framework
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Examples](./EXAMPLES.md)** - Real-world usage examples and patterns
- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes

## Getting Started

### 1. Installation

```bash
npm install @portable-content/typescript-sdk
```

### 2. Basic Usage

```typescript
import {
  VariantSelector,
  CapabilityDetector,
  DefaultContentProcessor,
} from '@portable-content/typescript-sdk';

// Detect client capabilities
const detector = new CapabilityDetector();
const capabilities = detector.detectCapabilities();

// Process content for optimal delivery
const processor = new DefaultContentProcessor();
const optimized = await processor.processContent(content, capabilities);
```

### 3. Build a Custom Renderer

```typescript
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';

class MyRenderer extends BaseBlockRenderer {
  readonly kind = 'my-block-type';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);
    return {
      content: renderWithMyFramework(variant),
      variant,
    };
  }
}
```

## Architecture Overview

The SDK is built around these core concepts:

### Framework-Agnostic Core

- **No UI dependencies** - works with React Native, Vue, React Web, etc.
- **Intelligent variant selection** - automatically chooses optimal content
- **Network-aware optimization** - adapts to connection speed
- **Capability detection** - detects client support for formats, features

### Extensible Renderer System

- **Base renderer classes** for common functionality
- **Priority-based selection** for multiple renderers per block type
- **Error handling and fallbacks** built-in
- **Type-safe interfaces** with full TypeScript support

### Content Processing Pipeline

1. **Capability Detection** - what does the client support?
2. **Variant Selection** - which version is best for this client?
3. **Content Processing** - optimize the entire content structure
4. **Rendering** - framework-specific UI generation

## Key Features

### 🧠 Intelligent Variant Selection

Automatically selects the best content variant based on:

- **Media type support** (WebP, AVIF, SVG detection)
- **Network conditions** (4G=FAST, 3G=SLOW, 2G=CELLULAR)
- **Device characteristics** (screen size, pixel density)
- **Quality preferences** (Accept header q-values)

### 🎨 Framework Flexibility

Works seamlessly with:

- **React Native** - mobile app development
- **Vue 3** - progressive web apps
- **React Web** - traditional web applications
- **Any framework** - framework-agnostic core

### ⚡ Performance Optimized

- **Efficient algorithms** - O(n) variant selection
- **Minimal bundle size** - ~15KB gzipped core
- **Tree-shakeable** - only import what you use
- **Caching-friendly** - deterministic results

### 🧪 Well Tested

- **123+ tests** with comprehensive coverage
- **Mock data factory** for easy testing
- **Edge case handling** built-in
- **CI/CD integration** ready

## Documentation Structure

### For Developers Building Renderers

- **[Renderer Guide](./RENDERER_GUIDE.md)** - Step-by-step guide to building custom renderers
- **[Examples](./EXAMPLES.md)** - React Native, Vue, React Web examples
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation

### For Framework Integration

- **React Native** - See examples for Image, Text, and custom renderers
- **Vue 3** - Composition API patterns and component integration
- **React Web** - SSR-compatible patterns and Next.js integration
- **Custom Frameworks** - Base classes and interfaces to implement

### For Content System Architects

- **Architecture principles** - Framework-agnostic design patterns
- **Performance considerations** - Optimization strategies
- **Extension points** - How to add new capabilities
- **Testing strategies** - Mock-first development approach

## Common Use Cases

### Mobile App Development

```typescript
// React Native renderer for responsive images
class RNImageRenderer extends BaseImageRenderer {
  async render(block, props, context) {
    const variant = this.selectVariant(block, context);
    const screenWidth = context.capabilities.hints?.width || 375;

    return {
      content: (
        <Image
          source={{ uri: variant.uri }}
          style={{ width: screenWidth - 32, height: 200 }}
          resizeMode="cover"
        />
      ),
      variant
    };
  }
}
```

### Web Application

```typescript
// Vue renderer for markdown content
class VueMarkdownRenderer extends BaseTextRenderer {
  async render(block, props, context) {
    const variant = this.selectVariant(block, context);
    const markdown = await this.getTextContent(variant);
    const html = renderMarkdown(markdown);

    return {
      content: h('div', { innerHTML: html }),
      variant,
    };
  }
}
```

### Progressive Web App

```typescript
// Network-aware image loading
class PWAImageRenderer extends BaseImageRenderer {
  async render(block, props, context) {
    const variant = this.selectVariant(block, context);
    const network = context.capabilities.hints?.network;

    // Use progressive loading on slow networks
    if (network === 'SLOW' || network === 'CELLULAR') {
      return this.renderProgressiveImage(variant);
    }

    return this.renderStandardImage(variant);
  }
}
```

## Migration and Integration

### From Static Content

Replace static content references with dynamic variant selection:

```typescript
// Before: static image reference
<img src="image.jpg" alt="Static image" />

// After: intelligent variant selection
const variant = selector.selectBestVariant(block.variants, capabilities);
<img src={variant.uri} alt={block.payload.alt} />
```

### From Other CMSs

The SDK works with any content source:

```typescript
// Adapt your existing content structure
const adaptedContent = {
  id: cmsContent.id,
  blocks: cmsContent.sections.map((section) => ({
    id: section.id,
    kind: section.type,
    variants: section.assets.map((asset) => ({
      mediaType: asset.mimeType,
      uri: asset.url,
      bytes: asset.size,
    })),
  })),
};

// Process with SDK
const optimized = await processor.processContent(adaptedContent, capabilities);
```

## Support and Community

- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive guides and API reference
- **Examples** - Real-world implementation patterns
- **TypeScript Support** - Full type safety and IntelliSense

## Next Steps

1. **Read the [Renderer Guide](./RENDERER_GUIDE.md)** to understand how to build custom renderers
2. **Check out [Examples](./EXAMPLES.md)** for your specific framework
3. **Browse the [API Reference](./API_REFERENCE.md)** for detailed documentation
4. **Start building** your first renderer!

The Portable Content SDK provides everything you need to build intelligent, adaptive content rendering systems that work across all platforms and frameworks.
