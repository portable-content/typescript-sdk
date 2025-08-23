# Portable Content TypeScript SDK

A framework-agnostic TypeScript SDK for the Portable Content System, providing intelligent content rendering, variant selection, and type-safe data models.

[![codecov](https://codecov.io/gh/portable-content/typescript-sdk/graph/badge.svg?token=kny2WCQvHx)](https://codecov.io/gh/portable-content/typescript-sdk)

## Features

- 🎨 **Framework-Agnostic Rendering**: Works with React Native, Vue, React Web, and any UI framework
- 🧠 **Intelligent Variant Selection**: Automatically selects optimal content variants based on device capabilities
- � **Network-Aware Optimization**: Adapts content delivery for different network conditions
- 🔒 **Type-Safe**: Full TypeScript support with strict type checking
- 📱 **Capability Detection**: Automatic client capability detection (screen size, formats, network)
- 🎯 **Content Processing**: Advanced content optimization and representation filtering
- 🧪 **Well-Tested**: 95+ tests with comprehensive coverage
- ⚡ **Performance Focused**: Efficient algorithms with minimal bundle size

## Installation

```bash
npm install @portable-content/typescript-sdk
```

## Quick Start

### Framework-Agnostic Rendering

```typescript
import {
  VariantSelector,
  DefaultContentProcessor,
  CapabilityDetector,
  MockContentFactory
} from '@portable-content/typescript-sdk';

// Detect client capabilities automatically
const detector = new CapabilityDetector();
const capabilities = detector.detectCapabilities();

// Process content for optimal delivery
const processor = new DefaultContentProcessor();
const content = MockContentFactory.createContentItem(); // Or fetch from your API

const optimizedContent = await processor.processContent(content, capabilities);

// Each block now has the best variants selected for the client
console.log(optimizedContent.blocks[0].variants[0]); // Best variant for this client
```

### Custom Renderer Implementation

```typescript
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';

class MyMarkdownRenderer extends BaseBlockRenderer {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(block, props, context) {
    const variant = this.selectVariant(block, context);
    // Render with your framework (React Native, Vue, etc.)
    return {
      content: renderMarkdownWithMyFramework(variant),
      variant
    };
  }
}
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Build the package
npm run build

# Run linting
npm run lint
```

### Scripts

- `npm run build` - Build the package for distribution
- `npm run test` - Run the test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Architecture

This SDK is designed with a modular, framework-agnostic architecture:

### Core Components

- **🎨 Rendering System**: Framework-agnostic rendering foundation
  - `VariantSelector`: Intelligent variant selection with network awareness
  - `RendererRegistry`: Priority-based renderer management
  - `ContentProcessor`: Content optimization and representation filtering
  - Base renderer classes for different content types

- **📱 Capability Detection**: Automatic client capability detection
  - Media type support (WebP, AVIF, SVG)
  - Screen dimensions and pixel density
  - Network conditions (4G, 3G, 2G)
  - Interactive features

- **🔧 Core Infrastructure**:
  - **Types**: Comprehensive TypeScript definitions
  - **Client**: Base API client with transport abstraction
  - **Validation**: Runtime data validation with Zod
  - **Utils**: Common utility functions

### Design Principles

- **Framework Independence**: No UI framework dependencies
- **Mock-First Development**: Works without backend dependencies
- **Extensible Architecture**: Easy to add new block types and renderers
- **Performance Focused**: Efficient algorithms and minimal bundle size
- **Type Safety**: Full TypeScript support with strict checking

## What's New in v0.2.0

🎨 **Universal Styling System** - Framework-agnostic styling with adapter pattern

- ✅ **StyleAdapter Interface**: Works with any styling system (CSS-in-JS, utility frameworks, native styling)
- ✅ **Universal Theme System**: Design tokens with colors, spacing, typography, shadows
- ✅ **Comprehensive Documentation**: Step-by-step guides for any framework or styling system
- ✅ **224 Tests**: Extensive test coverage including edge cases and styling system
- ✅ **Production Ready**: Robust validation, error handling, and performance optimization

## What's New in v0.1.0

🎉 **Initial Release** - Complete framework-agnostic rendering system

- ✅ **Task 5A Complete**: Framework-Agnostic Rendering Base
- ✅ **95+ Tests**: Comprehensive test coverage
- ✅ **Production Ready**: Full TypeScript support with strict linting
- ✅ **Zero Dependencies**: No UI framework lock-in

### Key Features

- **Intelligent Variant Selection**: Automatically chooses the best content variant
- **Network Optimization**: Adapts to slow/fast/cellular networks
- **Capability Detection**: Detects WebP, AVIF, screen size, density
- **Content Processing**: Representation filtering and optimization
- **Extensible Renderers**: Easy to add custom block types

## Documentation

📚 **Complete documentation available in the [docs/](./docs/) directory:**

- **[Renderer Guide](./docs/RENDERER_GUIDE.md)** - Step-by-step guide to building custom renderers for any UI framework
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation with all classes and interfaces
- **[Examples](./docs/EXAMPLES.md)** - Real-world usage examples for React Native, Vue, React Web, and more
- **[Documentation Index](./docs/README.md)** - Complete documentation overview

📋 **Project Information:**
- [CHANGELOG.md](./CHANGELOG.md) - Release notes and version history
- [Task 5A Implementation](./phase-1c/task-5a-rendering-base.md) - Detailed technical specification
- [llms.txt](./llms.txt) - LLM-friendly project overview

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.