/**
 * @fileoverview Type definitions for the Portable Content System
 */

// Core types
export type {
  ContentManifest,
  Block,
  BlockContent,
  PayloadSource,
  InlinePayloadSource,
  ExternalPayloadSource,
  TextPayloadSource,
  ImagePayloadSource,
  Representation
} from './core';

// Block-specific types
export type {
  MarkdownBlock,
  MermaidBlock,
  ImageBlock,
  DocumentBlock,
  CodeBlock,
  BlockTypeMap,
  TypedBlock,
} from './blocks';

// Block type guards and utilities
export {
  isMarkdownBlock,
  isMermaidBlock,
  isImageBlock,
  isDocumentBlock,
  isCodeBlock,
  getTypedContent,
  getPrimaryContent,
  getSourceContent,
  getAlternativeContent,
  getBestAlternative,
} from './blocks';

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
export type { ContentForKind, ContentForUnknownKind, PartialContentManifest } from './utils';

export { ContentManifestBuilder, BlockBuilder, PayloadSourceBuilder } from './utils';
