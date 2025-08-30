/**
 * @fileoverview Validation utility functions
 */

import { z } from 'zod';
import {
  ContentManifestSchema,
  BlockSchema,
  BlockContentSchema,
  PayloadSourceSchema,
  CapabilitiesSchema,
} from './schemas';
import type {
  ContentManifest,
  Block,
  PayloadSource,
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
 * Validate a ContentManifest
 */
export function validateContentManifest(data: unknown): ValidationResult<ContentManifest> {
  try {
    const result = ContentManifestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * @deprecated Use validateContentManifest instead
 */
export const validateContentItem = validateContentManifest;

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
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate a PayloadSource
 */
export function validatePayloadSource(data: unknown): ValidationResult<PayloadSource> {
  try {
    const result = PayloadSourceSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * @deprecated Use validatePayloadSource instead
 */
export const validateVariant = validatePayloadSource;

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
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate block content structure
 */
export function validateBlockContent(content: unknown): ValidationResult<unknown> {
  try {
    const result = BlockContentSchema.parse(content);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}
