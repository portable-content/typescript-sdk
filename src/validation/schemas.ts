/**
 * @fileoverview Zod schemas for runtime validation
 */

import { z } from 'zod';

/**
 * Schema for Variant interface
 */
export const VariantSchema = z.object({
  mediaType: z.string().min(1, 'Media type is required'),
  uri: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
  contentHash: z.string().optional(),
  generatedBy: z.string().optional(),
  toolVersion: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

/**
 * Schema for Block interface
 */
export const BlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  kind: z.string().min(1, 'Block kind is required'),
  payload: z.unknown(),
  variants: z.array(VariantSchema).default([]),
}).transform((data) => ({
  ...data,
  // Ensure payload is always present, even if undefined
  payload: data.payload ?? null,
}));

/**
 * Schema for Representation interface
 */
export const RepresentationSchema = z.object({
  blocks: z.array(z.string().min(1)).min(1, 'At least one block ID is required'),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schema for ContentItem interface
 */
export const ContentItemSchema = z.object({
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
 * Schema for MarkdownBlockPayload
 */
export const MarkdownBlockPayloadSchema = z.object({
  source: z.string().min(1, 'Markdown source is required'),
});

/**
 * Schema for MermaidBlockPayload
 */
export const MermaidBlockPayloadSchema = z.object({
  source: z.string().min(1, 'Mermaid source is required'),
  theme: z.string().optional(),
});

/**
 * Schema for ImageBlockPayload
 */
export const ImageBlockPayloadSchema = z.object({
  uri: z.string().url('Invalid image URI'),
  alt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/**
 * Schema for Capabilities interface
 */
export const CapabilitiesSchema = z.object({
  accept: z.array(z.string().min(1)).min(1, 'At least one accepted media type is required'),
  hints: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    density: z.number().positive().optional(),
    network: z.enum(['FAST', 'SLOW', 'CELLULAR']).optional(),
  }).optional(),
});
