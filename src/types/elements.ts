/**
 * @fileoverview Element-specific type definitions using ElementContent structure
 * Migrated from blocks.ts for the new Element-based architecture
 */

import {
  Element,
  ElementContent,
  PayloadSource,
  TextPayloadSource,
  ImagePayloadSource,
} from './core';

/**
 * Typed element interfaces for each kind using ElementContent structure
 */
export interface MarkdownElement extends Element {
  kind: 'markdown';
  content: ElementContent & {
    primary: TextPayloadSource;
    source?: TextPayloadSource;
  };
}

export interface MermaidElement extends Element {
  kind: 'mermaid';
  content: ElementContent & {
    primary: PayloadSource; // Usually SVG/PNG delivery format
    source?: TextPayloadSource & { theme?: string }; // Mermaid source with optional theme
  };
}

export interface ImageElement extends Element {
  kind: 'image';
  content: ElementContent & {
    primary: ImagePayloadSource;
    source?: ImagePayloadSource; // Original/raw image
    alternatives?: ImagePayloadSource[]; // Different sizes/formats
  };
}

export interface DocumentElement extends Element {
  kind: 'document';
  content: ElementContent & {
    primary: PayloadSource & { pages?: number }; // Usually PDF
    alternatives?: PayloadSource[]; // Thumbnails, different formats
  };
}

export interface VideoElement extends Element {
  kind: 'video';
  content: ElementContent & {
    primary: PayloadSource & {
      duration?: number;
      width?: number;
      height?: number;
    };
    alternatives?: PayloadSource[]; // Different qualities/formats
    source?: PayloadSource; // Original video file
  };
}

/**
 * Element type map for extensibility via module augmentation
 * External modules can extend this interface to add custom element types
 */
export interface ElementTypeMap {
  markdown: MarkdownElement;
  mermaid: MermaidElement;
  image: ImageElement;
  document: DocumentElement;
  video: VideoElement;
}

/**
 * Union type for all registered element types
 * Automatically includes any types added via module augmentation
 */
export type TypedElement = ElementTypeMap[keyof ElementTypeMap];

/**
 * Type guard to check if an element is a markdown element
 */
export function isMarkdownElement(element: Element): element is MarkdownElement {
  return element.kind === 'markdown';
}

/**
 * Type guard to check if an element is a mermaid element
 */
export function isMermaidElement(element: Element): element is MermaidElement {
  return element.kind === 'mermaid';
}

/**
 * Type guard to check if an element is an image element
 */
export function isImageElement(element: Element): element is ImageElement {
  return element.kind === 'image';
}

/**
 * Type guard to check if an element is a document element
 */
export function isDocumentElement(element: Element): element is DocumentElement {
  return element.kind === 'document';
}

/**
 * Type guard to check if an element is a video element
 */
export function isVideoElement(element: Element): element is VideoElement {
  return element.kind === 'video';
}

/**
 * Get typed content for an element based on its kind
 * Returns the ElementContent with proper typing
 */
export function getTypedContent<K extends keyof ElementTypeMap>(
  element: Element,
  kind: K
): ElementTypeMap[K]['content'] | null {
  return element.kind === kind ? (element.content as ElementTypeMap[K]['content']) : null;
}

/**
 * Get the primary content source for an element
 */
export function getPrimaryContent(element: Element): PayloadSource {
  return element.content.primary;
}

/**
 * Get the source content for editing (if available)
 */
export function getSourceContent(element: Element): PayloadSource | null {
  return element.content.source || null;
}

/**
 * Get alternative content formats
 */
export function getAlternativeContent(element: Element): PayloadSource[] {
  return element.content.alternatives || [];
}

/**
 * Find the best alternative content based on accepted media types
 */
export function getBestAlternative(
  element: Element,
  acceptedTypes: string[]
): PayloadSource | null {
  const alternatives = getAlternativeContent(element);
  return alternatives.find((alt) => acceptedTypes.includes(alt.mediaType)) || null;
}

/**
 * Get element variants (if available)
 */
export function getElementVariants(element: Element): ElementVariant[] {
  return element.content.variants || [];
}

/**
 * Find a specific variant by ID
 */
export function getVariantById(element: Element, variantId: string): ElementVariant | null {
  const variants = getElementVariants(element);
  return variants.find((variant) => variant.id === variantId) || null;
}

/**
 * Get transform configurations for an element
 */
export function getTransformConfigs(element: Element): TransformConfig[] {
  return element.content.transforms || [];
}

// Import and re-export core types for convenience
import type { ElementVariant, TransformConfig } from './core';
export type {
  Element,
  ElementContent,
  ElementMetadata,
  ElementVariant,
  TransformConfig,
} from './core';
