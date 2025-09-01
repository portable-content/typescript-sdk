# Blocks to Elements Migration Plan

This document outlines the comprehensive changes needed to migrate the TypeScript SDK from the current Block-based architecture to the new Element-based architecture with event-driven capabilities.

## Current State Analysis

### Existing Block Architecture
The current SDK is built around:
- **Block Interface**: `{ id: string, kind: string, content: BlockContent }`
- **Block Types**: `MarkdownBlock`, `MermaidBlock`, `ImageBlock`, `DocumentBlock`, `CodeBlock`
- **Block Content**: `{ primary: PayloadSource, source?: PayloadSource, alternatives?: PayloadSource[] }`
- **Rendering System**: Framework-agnostic renderers with React/React Native implementations
- **No Event System**: Pure rendering/processing SDK with no dynamic updates

### Missing Capabilities
1. **Event-driven updates**: No way to dynamically update content
2. **Transport layer**: No communication with external systems
3. **Element lifecycle**: No registration/unregistration system
4. **Real-time updates**: No WebSocket/GraphQL subscription support
5. **AI integration**: No MCP transport or AI agent communication

## Migration Strategy

### Phase 1: Core Type System Migration (Week 1)

#### 1.1 Rename Block → Element
**Files to Update:**
- `src/types/core.ts` - Rename `Block` → `Element`
- `src/types/blocks.ts` → `src/types/elements.ts`
- `src/types/index.ts` - Update all exports
- All renderer files in `src/renderers/`
- All example files in `examples/`

**Changes Required:**
```typescript
// OLD: src/types/core.ts
export interface Block {
  id: string;
  kind: string;
  content: BlockContent;
}

// NEW: src/types/core.ts  
export interface Element {
  id: string; // Now dynamic UUID, not static
  kind: 'markdown' | 'image' | 'mermaid' | 'video' | 'document';
  content: ElementContent;
  // New event-related properties
  eventId?: string; // For event targeting
  metadata?: ElementMetadata;
}
```

#### 1.2 Update Element Content Structure
**Files to Update:**
- `src/types/core.ts` - Rename `BlockContent` → `ElementContent`

**Changes Required:**
```typescript
// NEW: Enhanced content structure
export interface ElementContent {
  primary: PayloadSource;
  source?: PayloadSource;
  alternatives?: PayloadSource[];
  // New properties for event system
  variants?: ElementVariant[];
  transforms?: TransformConfig[];
}
```

#### 1.3 Create Element-Specific Types
**New File:** `src/types/elements.ts`
```typescript
export interface MarkdownElement extends Element {
  kind: 'markdown';
  content: ElementContent & {
    primary: TextPayloadSource;
    source?: TextPayloadSource;
  };
}

export interface ImageElement extends Element {
  kind: 'image';
  content: ElementContent & {
    primary: ImagePayloadSource;
    source?: ImagePayloadSource;
  };
}

// ... other element types
```

### Phase 2: Event System Foundation (Week 1-2)

#### 2.1 Create Event Type Definitions
**New File:** `src/types/events.ts`
```typescript
export interface ElementEvent {
  elementId: string;
  elementType: 'markdown' | 'image' | 'mermaid' | 'video' | 'document';
  eventType: ElementEventType;
  data: ElementEventData;
  metadata: ElementEventMetadata;
  persistChange?: boolean;
  triggerTransforms?: boolean;
  validateFirst?: boolean;
}

export type ElementEventType = 
  | 'updatePayload'
  | 'updateProps'
  | 'updateVariants'
  | 'updateStyle'
  | 'refreshTransforms'
  | 'validateContent';
```

#### 2.2 Create Element Event Manager
**New File:** `src/events/ElementEventManager.ts`
```typescript
export class ElementEventManager {
  private elements = new Map<string, ElementUpdateFunction>();
  private eventHistory: ElementEventHistoryEntry[] = [];
  private subscribers = new Map<string, ElementEventSubscriber[]>();
  private transportManager: ElementTransportManager;

  constructor(transportManager?: ElementTransportManager) {
    this.transportManager = transportManager || new ElementTransportManager(this);
  }

  // Element registration
  registerElement(id: string, updateFn: ElementUpdateFunction): void;
  unregisterElement(id: string): void;

  // Event handling
  async sendEvent(event: ElementEvent): Promise<ElementEventResult>;
  async sendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult>;

  // External event handling (from transports)
  async handleExternalEvent(event: ElementEvent): Promise<ElementEventResult>;
}
```

### Phase 3: Transport Layer Implementation (Week 2)

#### 3.1 Create Transport Interfaces
**New File:** `src/transport/interfaces.ts`
```typescript
export interface ElementTransport {
  readonly name: string;
  readonly capabilities: TransportCapabilities;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  sendEvent(event: ElementEvent): Promise<ElementEventResult>;
  sendBatchEvents(events: ElementEvent[]): Promise<BatchElementEventResult>;
  
  onEvent(callback: ElementEventCallback): UnsubscribeFunction;
  onBatchEvent(callback: BatchElementEventCallback): UnsubscribeFunction;
}
```

#### 3.2 Implement Transport Manager
**New File:** `src/transport/ElementTransportManager.ts`
```typescript
export class ElementTransportManager {
  private transports = new Map<string, ElementTransport>();
  private activeTransports = new Set<string>();
  private eventManager: ElementEventManager;

  registerTransport(transport: ElementTransport): void;
  async connectTransport(name: string): Promise<void>;
  async broadcastEvent(event: ElementEvent, transportNames?: string[]): Promise<Map<string, ElementEventResult>>;
}
```

#### 3.3 Create Transport Implementations
**New Files:**
- `src/transport/GraphQLTransport.ts` - For web clients
- `src/transport/WebSocketTransport.ts` - For real-time updates  
- `src/transport/MCPTransport.ts` - For AI agents
- `src/transport/HTTPTransport.ts` - Fallback transport

### Phase 4: Renderer Migration (Week 2-3)

#### 4.1 Update Base Renderer
**File to Update:** `src/rendering/base-renderers.ts`
```typescript
// OLD
export abstract class BaseBlockRenderer<TProps, TResult>
  implements BlockRenderer<TProps, TResult>

// NEW  
export abstract class BaseElementRenderer<TProps, TResult>
  implements ElementRenderer<TProps, TResult>
{
  // Add event integration
  protected eventManager?: ElementEventManager;
  
  setEventManager(eventManager: ElementEventManager): void {
    this.eventManager = eventManager;
  }
}
```

#### 4.2 Update All Renderer Components
**Files to Update:**
- `src/renderers/web/MermaidComponent.tsx`
- `src/renderers/react-native/MarkdownRenderer.tsx`
- `src/renderers/react-native/MermaidRenderer.tsx`
- All other renderer files

**Changes Required:**
1. Rename `block` prop → `element`
2. Add `eventId` prop support
3. Integrate with event system
4. Add dynamic update capabilities

### Phase 5: Framework Integration (Week 3)

#### 5.1 Create React Integration
**New Files:**
- `src/integrations/react/ElementEventContext.tsx`
- `src/integrations/react/useElementEvents.ts`
- `src/integrations/react/ElementEventProvider.tsx`

#### 5.2 Update React Components
Add event integration to all React components:
```typescript
export const MarkdownElement: React.FC<MarkdownElementProps> = ({
  element,
  eventId,
  ...props
}) => {
  const { dynamicProps, isUpdating } = useElementEvents(eventId);
  
  // Merge static and dynamic props
  const finalProps = {
    ...props,
    ...dynamicProps,
    style: { ...props.style, ...dynamicProps.style }
  };

  // Rest of component logic
};
```

### Phase 6: Integration Examples (Week 3-4)

#### 6.1 Create Integration Examples
**New Files:**
- `examples/ai-agent-integration.ts` - MCP transport example
- `examples/gui-controls-integration.ts` - WebSocket transport example
- `examples/graphql-integration.ts` - GraphQL transport example
- `examples/event-driven-rendering.tsx` - Complete React example

#### 6.2 Update Documentation
**Files to Update:**
- `docs/API_REFERENCE.md` - Update all Block → Element references
- `docs/EXAMPLES.md` - Add event system examples
- `docs/RENDERER_GUIDE.md` - Update for Element architecture
- `README.md` - Update overview and examples

## Breaking Changes Summary

### Type Changes
- `Block` → `Element`
- `BlockContent` → `ElementContent`  
- `BlockRenderer` → `ElementRenderer`
- All block-specific types renamed to element-specific

### API Changes
- All renderer props: `block` → `element`
- New required props: `eventId` for event-enabled components
- New context providers: `ElementEventProvider`
- New hooks: `useElementEvents`

### New Dependencies
- Transport layer dependencies (WebSocket, GraphQL subscriptions)
- Event queue dependencies (RxJS or similar)
- MCP client dependencies for AI integration

## Migration Timeline

**Week 1**: Core type migration + Event system foundation
**Week 2**: Transport layer + Base renderer updates  
**Week 3**: Framework integration + Component updates
**Week 4**: Examples + Documentation + Testing

## Compatibility Strategy

### Gradual Migration Support
Create compatibility layer during transition:
```typescript
// src/compatibility/block-element-adapter.ts
export function blockToElement(block: Block): Element {
  return {
    ...block,
    eventId: undefined,
    metadata: {}
  };
}

export function elementToBlock(element: Element): Block {
  const { eventId, metadata, ...blockProps } = element;
  return blockProps;
}
```

### Version Strategy
- v0.3.0: Add Element types alongside Block types (deprecated)
- v0.4.0: Remove Block types, Element-only API
- v1.0.0: Stable Element + Event system API

This migration plan provides a comprehensive roadmap for transforming the SDK from a static Block-based system to a dynamic, event-driven Element-based architecture while maintaining the existing strengths of framework independence and type safety.

## Detailed Implementation Requirements

### New Files to Create

#### Core Event System
```
src/events/
├── ElementEventManager.ts          # Central event dispatcher
├── EventQueue.ts                   # High-frequency event batching
├── interfaces.ts                   # Event system interfaces
└── index.ts                        # Event system exports

src/transport/
├── interfaces.ts                   # Transport interfaces
├── ElementTransportManager.ts      # Transport coordination
├── GraphQLTransport.ts            # GraphQL subscription transport
├── WebSocketTransport.ts          # WebSocket real-time transport
├── MCPTransport.ts                # AI agent MCP transport
├── HTTPTransport.ts               # Fallback HTTP transport
└── index.ts                       # Transport exports

src/integrations/
├── react/
│   ├── ElementEventContext.tsx    # React context for events
│   ├── ElementEventProvider.tsx   # React provider component
│   ├── useElementEvents.ts        # React hook for element events
│   └── index.ts                   # React integration exports
├── vue/
│   ├── useElementEvents.ts        # Vue composition API
│   └── index.ts                   # Vue integration exports
└── vanilla/
    ├── ElementEventIntegration.ts # Vanilla JS integration
    └── index.ts                   # Vanilla integration exports
```

#### Updated Type System
```
src/types/
├── elements.ts                     # Element-specific types (renamed from blocks.ts)
├── events.ts                       # Event system types
├── transport.ts                    # Transport layer types
└── integrations.ts                 # Framework integration types
```

### Files to Update

#### Core Type Updates
- `src/types/core.ts` - Block → Element migration
- `src/types/index.ts` - Update all exports
- `src/index.ts` - Add event system exports

#### Rendering System Updates
- `src/rendering/interfaces.ts` - BlockRenderer → ElementRenderer
- `src/rendering/base-renderers.ts` - Add event integration
- `src/rendering/renderer-registry.ts` - Update for elements
- `src/rendering/content-processor.ts` - Element processing
- `src/rendering/variant-selector.ts` - Update for elements

#### Component Updates
- `src/renderers/web/MermaidComponent.tsx` - Add event support
- `src/renderers/react-native/MarkdownRenderer.tsx` - Add event support
- `src/renderers/react-native/MermaidRenderer.tsx` - Add event support

#### Client Updates
- `src/client/interfaces.ts` - Add event-related client methods
- `src/client/portable-content-client.ts` - Event system integration
- `src/client/transports/graphql-transport.ts` - Add subscription support

### Configuration Updates

#### Package.json Dependencies
```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "rxjs": "^7.8.0",           // For event queuing
    "ws": "^8.14.0",            // WebSocket transport
    "graphql-ws": "^5.14.0"     // GraphQL subscriptions
  },
  "peerDependencies": {
    "graphql": "^16.0.0",
    "react": "^18.0.0",         // For React integration
    "vue": "^3.0.0"             // For Vue integration
  }
}
```

#### TypeScript Configuration
No changes needed - existing tsconfig.json supports the new architecture.

### Testing Strategy

#### New Test Files
```
tests/unit/events/
├── ElementEventManager.test.ts
├── EventQueue.test.ts
└── transport/
    ├── GraphQLTransport.test.ts
    ├── WebSocketTransport.test.ts
    └── MCPTransport.test.ts

tests/integration/
├── event-system-integration.test.ts
├── transport-integration.test.ts
└── framework-integration.test.ts
```

#### Updated Test Files
- All existing renderer tests need Block → Element updates
- All type tests need updates
- Integration tests need event system coverage

### Documentation Updates

#### New Documentation
- `docs/EVENT_SYSTEM.md` - Complete event system guide
- `docs/TRANSPORT_LAYER.md` - Transport implementation guide
- `docs/AI_INTEGRATION.md` - AI agent integration guide
- `docs/MIGRATION_GUIDE.md` - Block to Element migration guide

#### Updated Documentation
- `docs/API_REFERENCE.md` - Complete API overhaul
- `docs/EXAMPLES.md` - Add event-driven examples
- `docs/RENDERER_GUIDE.md` - Update for Element architecture
- `README.md` - Update overview and quick start

### Performance Considerations

#### Event System Optimizations
1. **Event Batching**: Use RxJS for high-frequency event batching
2. **Memory Management**: Implement event history size limits
3. **Transport Pooling**: Reuse transport connections
4. **Selective Updates**: Only update changed properties

#### Bundle Size Impact
- Core event system: ~15KB gzipped
- Transport layer: ~25KB gzipped (with all transports)
- Framework integrations: ~5KB each gzipped
- Total increase: ~45KB gzipped for full feature set

### Security Considerations

#### Event System Security
1. **Event Validation**: Validate all incoming events
2. **Transport Security**: Use secure WebSocket/HTTPS connections
3. **Access Control**: Implement element-level permissions
4. **Rate Limiting**: Prevent event flooding

#### AI Integration Security
1. **MCP Validation**: Validate all MCP messages
2. **Sandboxing**: Isolate AI-generated content
3. **Audit Logging**: Log all AI interactions

This comprehensive plan ensures a smooth migration from Blocks to Elements while adding powerful event-driven capabilities that enable real-time updates, AI integration, and multi-protocol communication.
