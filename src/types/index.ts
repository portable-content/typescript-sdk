/**
 * @fileoverview Type definitions for the Portable Content System
 */

// Core types
export type {
  ContentItem,
  Block,
  Variant,
  Representation
} from './core';

// Block-specific types
export type {
  MarkdownBlockPayload,
  MermaidBlockPayload,
  ImageBlockPayload,
  MarkdownBlock,
  MermaidBlock,
  ImageBlock,
  BlockTypeMap,
  TypedBlock
} from './blocks';

// Block type guards and utilities
export {
  isMarkdownBlock,
  isMermaidBlock,
  isImageBlock,
  getTypedPayload,
  getKnownPayload
} from './blocks';

// Capability types
export type {
  Capabilities,
  CapabilityHints,
  NetworkType
} from './capabilities';

export { DEFAULT_CAPABILITIES } from './capabilities';

// Utility types and builders
export type {
  PayloadForKind,
  PayloadForUnknownKind,
  PartialContentItem
} from './utils';

export {
  ContentItemBuilder,
  BlockBuilder,
  VariantBuilder
} from './utils';
