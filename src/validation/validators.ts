/**
 * @fileoverview Validation utility functions
 */

import { z } from 'zod';
import {
  ContentItemSchema,
  BlockSchema,
  VariantSchema,
  MarkdownBlockPayloadSchema,
  MermaidBlockPayloadSchema,
  ImageBlockPayloadSchema,
  CapabilitiesSchema,
} from './schemas';
import type {
  ContentItem,
  Block,
  Variant,
  MarkdownBlockPayload,
  MermaidBlockPayload,
  ImageBlockPayload,
  Capabilities,
} from '../types';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate a ContentItem
 */
export function validateContentItem(data: unknown): ValidationResult<ContentItem> {
  try {
    const result = ContentItemSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate a Block
 */
export function validateBlock(data: unknown): ValidationResult<Block> {
  try {
    const result = BlockSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate a Variant
 */
export function validateVariant(data: unknown): ValidationResult<Variant> {
  try {
    const result = VariantSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate Capabilities
 */
export function validateCapabilities(data: unknown): ValidationResult<Capabilities> {
  try {
    const result = CapabilitiesSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Type guard for MarkdownBlockPayload
 */
export function isMarkdownBlockPayload(payload: unknown): payload is MarkdownBlockPayload {
  return MarkdownBlockPayloadSchema.safeParse(payload).success;
}

/**
 * Type guard for MermaidBlockPayload
 */
export function isMermaidBlockPayload(payload: unknown): payload is MermaidBlockPayload {
  return MermaidBlockPayloadSchema.safeParse(payload).success;
}

/**
 * Type guard for ImageBlockPayload
 */
export function isImageBlockPayload(payload: unknown): payload is ImageBlockPayload {
  return ImageBlockPayloadSchema.safeParse(payload).success;
}

/**
 * Validate block payload based on kind
 */
export function validateBlockPayload(kind: string, payload: unknown): ValidationResult<unknown> {
  try {
    let schema: z.ZodSchema;

    switch (kind) {
      case 'markdown':
        schema = MarkdownBlockPayloadSchema;
        break;
      case 'mermaid':
        schema = MermaidBlockPayloadSchema;
        break;
      case 'image':
        schema = ImageBlockPayloadSchema;
        break;
      default:
        // For unknown block types, accept any payload
        return { success: true, data: payload };
    }

    const result = schema.parse(payload);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}
