/**
 * @fileoverview Validation utility functions
 */

import { z } from 'zod';
import {
  ContentManifestSchema,
  ElementSchema,
  ElementContentSchema,
  PayloadSourceSchema,
  CapabilitiesSchema,
} from './schemas';
import type {
  ContentManifest,
  Element,
  ElementContent,
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
 * Validate an Element
 */
export function validateElement(data: unknown): ValidationResult<Element> {
  try {
    const result = ElementSchema.parse(data);
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
 * Validate ElementContent
 */
export function validateElementContent(data: unknown): ValidationResult<ElementContent> {
  try {
    const result = ElementContentSchema.parse(data);
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
