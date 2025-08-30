/**
 * @fileoverview Zod schemas for runtime validation
 */

import { z } from 'zod';

/**
 * Schema for PayloadSource interface
 */
export const PayloadSourceSchema = z.object({
  type: z.enum(['inline', 'external']),
  mediaType: z.string().min(1, 'Media type is required'),
  source: z.string().optional(),
  uri: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
}).refine((data) => {
  // Inline sources must have source content
  if (data.type === 'inline' && !data.source) {
    return false;
  }
  // External sources must have URI
  if (data.type === 'external' && !data.uri) {
    return false;
  }
  return true;
}, {
  message: "Inline sources must have 'source', external sources must have 'uri'"
});

/**
 * Schema for BlockContent interface
 */
export const BlockContentSchema = z.object({
  primary: PayloadSourceSchema,
  source: PayloadSourceSchema.optional(),
  alternatives: z.array(PayloadSourceSchema).optional(),
});

/**
 * Schema for Block interface
 */
export const BlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  kind: z.string().min(1, 'Block kind is required'),
  content: BlockContentSchema,
});

/**
 * @deprecated Use PayloadSourceSchema instead
 */
export const VariantSchema = PayloadSourceSchema;

/**
 * Schema for Representation interface
 */
export const RepresentationSchema = z.object({
  blocks: z.array(z.string().min(1)).min(1, 'At least one block ID is required'),
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
  blocks: z.array(BlockSchema).default([]),
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
