/**
 * @module validators/content
 * @description Content validation schemas using @atomictemplate/validations
 * Ensures frontend/backend validation sync through shared package
 */

import { z } from 'zod'
// Import schemas from @atomictemplate/validations for type safety
// These schemas are shared between frontend and backend
import {
  BannerSchema,
  CtaSchema,
  FAQSchema,
  GallerySchema
} from '@atomictemplate/validations/common'

import {
  HomePageSchema,
  ContactPageSchema,
  GalleryPageSchema
} from '@atomictemplate/validations/pages'

/**
 * Common Content Request Validators
 */

export const UpsertCommonContentValidator = z.object({
  params: z.object({
    key: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Key must be lowercase letters and underscores only')
  }),
  body: z.object({
    data: z.record(z.string(), z.any()) // JSONB - validated by specific schema based on key
  })
})

export const GetCommonContentValidator = z.object({
  params: z.object({
    key: z.string().min(1)
  })
})

/**
 * Page Content Request Validators
 */

export const UpsertPageContentValidator = z.object({
  params: z.object({
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
  }),
  body: z.object({
    title: z.string().min(1).max(200),
    data: z.record(z.string(), z.any()), // JSONB - validated by page-specific schema
    meta_data: z.object({
      metaTitle: z.string().max(100).optional(),
      metaDescription: z.string().max(200).optional()
    }).optional().nullable(),
    published: z.boolean().optional().default(false)
  })
})

export const GetPageContentValidator = z.object({
  params: z.object({
    slug: z.string().min(1)
  })
})

export const ListPagesValidator = z.object({
  query: z.object({
    published: z.enum(['true', 'false']).optional()
  }).optional()
})

/**
 * Helper function to validate common content data based on key
 * Uses schemas from @atomictemplate/validations/common
 */
export function validateCommonContentData(key: string, data: any) {
  const schemaMap: Record<string, z.ZodSchema> = {
    banner: BannerSchema,
    cta: CtaSchema,
    faq: FAQSchema,
    gallery: GallerySchema
  }

  const schema = schemaMap[key]
  if (schema) {
    return schema.parse(data)
  }

  // If no specific schema, allow any object
  return data
}

/**
 * Helper function to validate page content data based on slug
 * Uses schemas from @atomictemplate/validations/pages
 */
export function validatePageContentData(slug: string, data: any) {
  const schemaMap: Record<string, z.ZodSchema> = {
    home: HomePageSchema,
    contact: ContactPageSchema,
    gallery: GalleryPageSchema
  }

  const schema = schemaMap[slug]
  if (schema) {
    return schema.parse(data)
  }

  // If no specific schema, allow any object
  return data
}

// Export type inference
export type UpsertCommonContentInput = z.infer<typeof UpsertCommonContentValidator>
export type UpsertPageContentInput = z.infer<typeof UpsertPageContentValidator>
