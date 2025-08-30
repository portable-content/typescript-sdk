# Content Resolution Architecture

## Overview

The Content Resolution system provides a normalized workflow for converting raw `PayloadSource` data into `RenderingContent` that's ready for block renderers. This architecture bridges the gap between the content manifest structure and the actual data needed for rendering.

## Key Concepts

### RenderingContent vs PayloadSource

- **`PayloadSource`**: Raw content structure from the ContentManifest (inline/external references)
- **`RenderingContent`**: Normalized content with actual data, metadata, and ready for rendering

```typescript
// PayloadSource (raw structure)
const payloadSource: PayloadSource = {
  type: 'external',
  mediaType: 'text/plain',
  uri: 'https://example.com/content.txt'
};

// RenderingContent (normalized for rendering)
const renderingContent: RenderingContent = {
  data: 'Hello, world!', // Actual content data
  mediaType: 'text/plain',
  source: payloadSource, // Original source reference
  metadata: {
    size: 13,
    loadedAt: new Date(),
    loadDuration: 150,
    fromCache: false
  }
};
```

## Architecture Components

### ContentResolver

The central coordinator for content loading and normalization:

```typescript
import { DefaultContentResolver } from '@portable-content/typescript-sdk';

const resolver = new DefaultContentResolver();

// Resolve content for a block
const content = await resolver.resolveBlockContent(block, capabilities);

// Resolve a specific payload source
const content = await resolver.resolvePayloadSource(source, capabilities, {
  timeout: 5000,
  useCache: true,
  maxSize: 1024 * 1024 // 1MB
});
```

### LoadingStrategy

Defines how content is loaded and processed:

```typescript
interface LoadingStrategy {
  readonly name: string;
  canHandle(source: PayloadSource): boolean;
  resolve(source: PayloadSource, capabilities: Capabilities, options?: ContentResolutionOptions): Promise<ContentResolutionResult>;
}
```

#### EagerLoadingStrategy

The default strategy that immediately loads all content:

```typescript
import { EagerLoadingStrategy } from '@portable-content/typescript-sdk';

const strategy = new EagerLoadingStrategy();
resolver.setLoadingStrategy(strategy);
```

### ContentCache

Optional caching layer for resolved content:

```typescript
import { MemoryContentCache } from '@portable-content/typescript-sdk';

const cache = new MemoryContentCache();
const resolver = new DefaultContentResolver(undefined, cache);

// Content will be cached automatically
const content1 = await resolver.resolveBlockContent(block, capabilities);
const content2 = await resolver.resolveBlockContent(block, capabilities); // From cache
```

## Usage in Block Renderers

### Updated BaseBlockRenderer

The base renderer now includes content resolution capabilities:

```typescript
class MyTextRenderer extends BaseBlockRenderer<TextProps, string> {
  readonly kind = 'text';
  readonly priority = 1;

  async render(block: Block, props: TextProps, context: RenderContext): Promise<RenderResult<string>> {
    // Resolve content using the new system
    const content = await this.resolveRenderingContent(block, context);
    
    // Content is now normalized and ready to use
    const text = content.data as string;
    
    return {
      content: `<p>${text}</p>`,
      payloadSource: content.source
    };
  }
}
```

### Custom Content Resolver

You can provide a custom resolver with different strategies:

```typescript
class MyRenderer extends BaseBlockRenderer {
  constructor() {
    super();
    
    // Use custom resolver with caching
    const cache = new MemoryContentCache();
    const resolver = new DefaultContentResolver(new EagerLoadingStrategy(), cache);
    this.setContentResolver(resolver);
  }
}
```

## Content Resolution Options

### Timeout Control

```typescript
const content = await resolver.resolvePayloadSource(source, capabilities, {
  timeout: 10000 // 10 second timeout for external content
});
```

### Size Limits

```typescript
const content = await resolver.resolvePayloadSource(source, capabilities, {
  maxSize: 5 * 1024 * 1024 // 5MB maximum content size
});
```

### Cache Control

```typescript
// Skip cache for this request
const content = await resolver.resolvePayloadSource(source, capabilities, {
  useCache: false
});
```

### Custom Headers

```typescript
const content = await resolver.resolvePayloadSource(source, capabilities, {
  headers: {
    'Authorization': 'Bearer token',
    'User-Agent': 'MyApp/1.0'
  }
});
```

## Error Handling

Content resolution provides structured error handling:

```typescript
try {
  const content = await resolver.resolveBlockContent(block, capabilities);
} catch (error) {
  if (error.message.includes('No suitable payload source found')) {
    // Handle case where no compatible content is available
  } else if (error.message.includes('Content resolution failed')) {
    // Handle loading/processing errors
    console.error('Resolution error:', error.cause);
  }
}
```

## Content Types and Processing

### Text Content

Automatically detected and returned as strings:

```typescript
// For text/* media types
const content = await resolver.resolvePayloadSource(textSource, capabilities);
console.log(typeof content.data); // 'string'
```

### Binary Content

Returned as ArrayBuffer for binary data:

```typescript
// For image/*, video/*, audio/* media types
const content = await resolver.resolvePayloadSource(imageSource, capabilities);
console.log(content.data instanceof ArrayBuffer); // true
```

### Unknown Content

Returned as Blob for unknown media types:

```typescript
// For unknown media types
const content = await resolver.resolvePayloadSource(unknownSource, capabilities);
console.log(content.data instanceof Blob); // true
```

## Migration from Direct PayloadSource Usage

### Before (Direct PayloadSource)

```typescript
class OldRenderer extends BaseBlockRenderer {
  async render(block: Block, props: any, context: RenderContext) {
    const source = this.selectPayloadSource(block, context);
    
    if (source?.type === 'inline') {
      const data = source.source;
      // Process inline data...
    } else if (source?.type === 'external') {
      const response = await fetch(source.uri);
      const data = await response.text();
      // Process external data...
    }
  }
}
```

### After (Content Resolution)

```typescript
class NewRenderer extends BaseBlockRenderer {
  async render(block: Block, props: any, context: RenderContext) {
    // Content is automatically resolved and normalized
    const content = await this.resolveRenderingContent(block, context);
    
    // Data is ready to use regardless of source type
    const data = content.data as string;
    
    // Additional metadata available
    console.log('Content size:', content.metadata?.size);
    console.log('Load duration:', content.metadata?.loadDuration);
    console.log('From cache:', content.metadata?.fromCache);
  }
}
```

## Benefits

1. **Unified Interface**: Same API for inline and external content
2. **Automatic Optimization**: Intelligent caching and network handling
3. **Type Safety**: Proper TypeScript types for all content operations
4. **Error Handling**: Structured error reporting with specific error codes
5. **Extensibility**: Plugin architecture for custom loading strategies
6. **Performance**: Built-in caching and size optimization
7. **Metadata**: Rich information about content loading and processing

## Future Extensions

The architecture supports future enhancements:

- **LazyLoadingStrategy**: Load content on-demand with placeholders
- **PriorityLoadingStrategy**: Load critical content first
- **OfflineStrategy**: Handle offline scenarios with cached content
- **CompressionStrategy**: Automatic content compression/decompression
- **ValidationStrategy**: Content integrity verification
