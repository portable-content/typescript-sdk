# API Reference

Complete API reference for the Portable Content TypeScript SDK.

## Core Classes

### VariantSelector

Intelligently selects the best content variant based on client capabilities.

```typescript
class VariantSelector {
  selectBestVariant(variants: Variant[], capabilities: Capabilities): Variant | null;
}
```

**Methods:**

- `selectBestVariant(variants, capabilities)` - Returns the optimal variant or null if none suitable

**Example:**

```typescript
const selector = new VariantSelector();
const best = selector.selectBestVariant(block.variants, capabilities);
```

### DefaultRendererRegistry

Manages block renderers with priority-based selection.

```typescript
class DefaultRendererRegistry implements RendererRegistry {
  register<TProps, TResult>(renderer: BlockRenderer<TProps, TResult>): void;
  unregister(kind: string, priority?: number): void;
  getRenderer(block: Block, context: RenderContext): BlockRenderer | null;
  getRenderers(kind: string): BlockRenderer[];
  canRender(kind: string): boolean;
}
```

**Methods:**

- `register(renderer)` - Register a renderer (inserted by priority order)
- `unregister(kind, priority?)` - Remove renderer(s) for a block kind
- `getRenderer(block, context)` - Get best renderer for a block
- `getRenderers(kind)` - Get all renderers for a kind (priority ordered)
- `canRender(kind)` - Check if kind can be rendered

### DefaultContentProcessor

Processes content for optimal rendering.

```typescript
class DefaultContentProcessor implements ContentProcessor {
  processContent(
    content: ContentItem,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<ContentItem>;
  processBlock(
    block: Block,
    capabilities: Capabilities,
    options?: Record<string, unknown>
  ): Promise<Block>;
}
```

**Methods:**

- `processContent(content, capabilities, options?)` - Process entire content item
- `processBlock(block, capabilities, options?)` - Process individual block

**Options:**

- `representation: string` - Apply representation filtering

### CapabilityDetector

Detects client capabilities automatically.

```typescript
class CapabilityDetector {
  detectCapabilities(): Capabilities;
}
```

**Methods:**

- `detectCapabilities()` - Returns detected client capabilities

**Detected capabilities:**

- Supported media types (WebP, AVIF, SVG)
- Screen dimensions and pixel density
- Network type (FAST, SLOW, CELLULAR)
- Interactive features

## Base Renderer Classes

### BaseBlockRenderer

Abstract base class for all renderers.

```typescript
abstract class BaseBlockRenderer<TProps = unknown, TResult = unknown>
  implements BlockRenderer<TProps, TResult>
{
  abstract readonly kind: string;
  abstract readonly priority: number;

  abstract render(
    block: Block,
    props: TProps,
    context: RenderContext
  ): Promise<RenderResult<TResult>>;

  canRender(block: Block, context: RenderContext): boolean;
  getDefaultProps(): Partial<TProps>;
  validateProps(props: TProps): string[];

  protected selectVariant(block: Block, context: RenderContext): Variant | null;
  protected handleError(error: Error, context: RenderContext): void;
  protected setLoading(loading: boolean, context: RenderContext): void;
}
```

### BaseTextRenderer

Specialized base class for text content.

```typescript
abstract class BaseTextRenderer<TProps = unknown, TResult = unknown> extends BaseBlockRenderer<
  TProps,
  TResult
> {
  protected async getTextContent(variant: Variant): Promise<string>;
}
```

**Additional methods:**

- `getTextContent(variant)` - Fetch text content from variant URI

### BaseImageRenderer

Specialized base class for image content.

```typescript
abstract class BaseImageRenderer<TProps = unknown, TResult = unknown> extends BaseBlockRenderer<
  TProps,
  TResult
> {
  protected isImageVariant(variant: Variant): boolean;
  protected getImageDimensions(variant: Variant): { width?: number; height?: number };
}
```

**Additional methods:**

- `isImageVariant(variant)` - Check if variant is an image
- `getImageDimensions(variant)` - Get image dimensions from variant

## Interfaces

### BlockRenderer

Interface that all renderers must implement.

```typescript
interface BlockRenderer<TProps = unknown, TResult = unknown> {
  readonly kind: string;
  readonly priority: number;

  canRender(block: Block, context: RenderContext): boolean;
  render(block: Block, props: TProps, context: RenderContext): Promise<RenderResult<TResult>>;
  getDefaultProps?(): Partial<TProps>;
  validateProps?(props: TProps): string[];
}
```

### RenderContext

Context passed to renderers.

```typescript
interface RenderContext {
  capabilities: Capabilities;
  options?: Record<string, unknown>;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}
```

### RenderResult

Result returned by renderers.

```typescript
interface RenderResult<T = unknown> {
  content: T;
  variant: Variant | null;
  metadata?: Record<string, unknown>;
  errors?: string[];
}
```

## Type Definitions

### Core Types

```typescript
interface ContentItem {
  id: string;
  type: string;
  title?: string;
  summary?: string;
  blocks: Block[];
  representations?: Record<string, { blocks: string[] }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

interface Block {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  variants: Variant[];
}

interface Variant {
  mediaType: string;
  uri?: string;
  bytes?: number;
  width?: number;
  height?: number;
}
```

### Capability Types

```typescript
interface Capabilities {
  accept: string[];
  hints?: CapabilityHints;
}

interface CapabilityHints {
  width?: number;
  height?: number;
  density?: number;
  network?: NetworkType;
  maxBytes?: number;
  interactive?: boolean;
}

type NetworkType = 'FAST' | 'SLOW' | 'CELLULAR';
```

## Utility Functions

### MockContentFactory

Factory for creating test content.

```typescript
class MockContentFactory {
  static createImageBlock(variants?: Partial<Variant>[]): Block;
  static createMarkdownBlock(source?: string): Block;
  static createMermaidBlock(source?: string, theme?: string): Block;
  static createContentItem(options?: ContentOptions): ContentItem;
  static createCapabilities(scenario?: CapabilityScenario): Capabilities;
  static createOptimizedVariants(scenario: OptimizationScenario): Variant[];
  static createUnrenderableBlock(): Block;
  static createEdgeCaseBlock(scenario: EdgeCaseScenario): Block;
}
```

**Scenarios:**

- Capability scenarios: `'desktop' | 'mobile' | 'slow-network' | 'high-density'`
- Optimization scenarios: `'size-optimized' | 'quality-optimized' | 'format-variety'`
- Edge case scenarios: `'empty-variants' | 'no-uri' | 'huge-file' | 'tiny-file'`

## Error Handling

### Common Error Patterns

```typescript
// Renderer error handling
try {
  const result = await renderer.render(block, props, context);
  if (result.errors) {
    console.warn('Rendering warnings:', result.errors);
  }
} catch (error) {
  console.error('Rendering failed:', error);
}

// Variant selection fallback
const variant = selector.selectBestVariant(variants, capabilities);
if (!variant) {
  // Handle no suitable variant case
  return fallbackContent;
}

// Content processing error handling
try {
  const processed = await processor.processContent(content, capabilities);
} catch (error) {
  // Handle processing error
  return originalContent;
}
```

## Performance Considerations

### Optimization Tips

1. **Variant Selection**: Results are deterministic and can be cached
2. **Content Processing**: Process once, render many times
3. **Renderer Registry**: Renderers are sorted by priority once at registration
4. **Capability Detection**: Detect once per session, reuse results
5. **Memory Usage**: Process content in streaming fashion for large datasets

### Bundle Size

- Core rendering system: ~15KB gzipped
- No UI framework dependencies
- Tree-shakeable exports
- Minimal runtime overhead

## Migration Guide

### From Mock Data to Real API

```typescript
// Development with mocks
const content = MockContentFactory.createContentItem();

// Production with real API
const content = await apiClient.getContent(contentId);

// Processing remains the same
const processed = await processor.processContent(content, capabilities);
```

### Adding Custom Block Types

```typescript
// 1. Define your block type
interface CustomBlock extends Block {
  kind: 'custom';
  payload: {
    customData: string;
  };
}

// 2. Create renderer
class CustomRenderer extends BaseBlockRenderer<CustomProps, CustomResult> {
  readonly kind = 'custom';
  readonly priority = 1;

  async render(block: CustomBlock, props, context) {
    // Implementation
  }
}

// 3. Register renderer
registry.register(new CustomRenderer());
```

This API reference covers all public interfaces and classes in the SDK. For implementation examples, see the [Renderer Guide](./RENDERER_GUIDE.md).
