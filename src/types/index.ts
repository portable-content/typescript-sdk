/**
 * @fileoverview Type definitions for the Portable Content System
 * Updated for Element-based architecture with event system support
 */

// Core types
export type {
  ContentManifest,
  Element,
  ElementContent,
  ElementMetadata,
  ElementVariant,
  TransformConfig,
  PayloadSource,
  InlinePayloadSource,
  ExternalPayloadSource,
  TextPayloadSource,
  ImagePayloadSource,
  Representation,
} from './core';

// Element-specific types
export type {
  MarkdownElement,
  MermaidElement,
  ImageElement,
  DocumentElement,
  VideoElement,
  ElementTypeMap,
  TypedElement,
} from './elements';

// Element type guards and utilities
export {
  isMarkdownElement,
  isMermaidElement,
  isImageElement,
  isDocumentElement,
  isVideoElement,
  getTypedContent,
  getPrimaryContent,
  getSourceContent,
  getAlternativeContent,
  getBestAlternative,
  getElementVariants,
  getVariantById,
  getTransformConfigs,
} from './elements';

// Event system types
export type {
  ElementEvent,
  ElementEventType,
  ElementEventData,
  ElementEventMetadata,
  ElementEventResult,
  BatchElementEventResult,
  ElementUpdateFunction,
  ElementEventHistoryEntry,
  ElementEventSubscriber,
  ElementEventCallback,
  BatchElementEventCallback,
  UnsubscribeFunction,
  EventQueueOptions,
  EventManagerOptions,
} from './events';

export { DEFAULT_EVENT_QUEUE_OPTIONS, DEFAULT_EVENT_MANAGER_OPTIONS } from './events';

// Capability types
export type { Capabilities, CapabilityHints, NetworkType } from './capabilities';

export { DEFAULT_CAPABILITIES } from './capabilities';

// Styling types
export type {
  Theme,
  ShadowStyle,
  StyleCapabilities,
  StyleAdapter,
  StyleFromAdapter,
  ThemeFromAdapter,
} from './styling';

export { defaultTheme, darkTheme } from './styling';

// Utility types and builders
export type {
  ContentForElementKind,
  ContentForUnknownElementKind,
  PartialContentManifest,
} from './utils';

export { ContentManifestBuilder, ElementBuilder, PayloadSourceBuilder } from './utils';
