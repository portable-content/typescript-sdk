/**
 * @fileoverview Zod schemas for runtime validation
 */

import { z } from 'zod';

/**
 * Schema for PayloadSource interface
 */
export const PayloadSourceSchema = z
  .object({
    type: z.enum(['inline', 'external']),
    mediaType: z.string().min(1, 'Media type is required'),
    source: z.string().optional(),
    uri: z.string().url().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Inline sources must have source content
      if (data.type === 'inline' && !data.source) {
        return false;
      }
      // External sources must have URI
      if (data.type === 'external' && !data.uri) {
        return false;
      }
      return true;
    },
    {
      message: "Inline sources must have 'source', external sources must have 'uri'",
    }
  );

/**
 * Schema for ElementContent interface
 */
export const ElementContentSchema = z.object({
  primary: PayloadSourceSchema,
  source: PayloadSourceSchema.optional(),
  alternatives: z.array(PayloadSourceSchema).optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        payloadSource: PayloadSourceSchema,
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  transforms: z
    .array(
      z.object({
        type: z.string(),
        params: z.record(z.unknown()).optional(),
        outputFormats: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

/**
 * Schema for Element interface
 */
export const ElementSchema = z.object({
  id: z.string().min(1, 'Element ID is required'),
  kind: z.enum(['markdown', 'image', 'mermaid', 'video', 'document']),
  content: ElementContentSchema,
  eventId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @deprecated Use PayloadSourceSchema instead
 */
export const VariantSchema = PayloadSourceSchema;

/**
 * Schema for Representation interface
 */
export const RepresentationSchema = z.object({
  elements: z.array(z.string().min(1)).min(1, 'At least one element ID is required'),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schema for ContentManifest interface
 */
export const ContentManifestSchema = z.object({
  id: z.string().min(1, 'Content ID is required'),
  type: z.string().min(1, 'Content type is required'),
  title: z.string().optional(),
  summary: z.string().optional(),
  elements: z.array(ElementSchema).default([]),
  representations: z.record(RepresentationSchema).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().optional(),
});

/**
 * @deprecated Use ContentManifestSchema instead
 */
export const ContentItemSchema = ContentManifestSchema;

/**
 * Schema for Capabilities interface
 */
export const CapabilitiesSchema = z.object({
  accept: z.array(z.string().min(1)).min(1, 'At least one accepted media type is required'),
  hints: z
    .object({
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      density: z.number().positive().optional(),
      network: z.enum(['FAST', 'SLOW', 'CELLULAR']).optional(),
    })
    .optional(),
});
