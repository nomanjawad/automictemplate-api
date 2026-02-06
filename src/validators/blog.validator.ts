/**
 * @module validators/blog
 * @description Blog validation schemas using @atomictemplate/validations
 * Ensures frontend/backend validation sync through shared package
 */

import { z } from 'zod'
import { BlogPostSchema } from '@atomictemplate/validations'

/**
 * Create Blog Post Request Validator
 * Validates request body for creating a new blog post
 */
export const CreateBlogPostValidator = z.object({
  body: z.object({
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    title: z.string().min(1).max(500),
    excerpt: z.string().max(1000).optional(),
    content: z.record(z.string(), z.any()), // JSONB - will be validated by BlogPostSchema on response
    featured_image: z.string().url().optional().nullable(),
    tags: z.array(z.string()).optional(),
    meta_data: z.record(z.string(), z.any()).optional().nullable(),
    published: z.boolean().optional().default(false)
  })
})

/**
 * Update Blog Post Request Validator
 * Validates request body for updating a blog post
 */
export const UpdateBlogPostValidator = z.object({
  params: z.object({
    slug: z.string().min(1)
  }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    excerpt: z.string().max(1000).optional().nullable(),
    content: z.record(z.string(), z.any()).optional(),
    featured_image: z.string().url().optional().nullable(),
    tags: z.array(z.string()).optional(),
    meta_data: z.record(z.string(), z.any()).optional().nullable(),
    published: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
})

/**
 * Get Blog Post by Slug Validator
 */
export const GetBlogPostValidator = z.object({
  params: z.object({
    slug: z.string().min(1)
  })
})

/**
 * List Blog Posts Query Validator
 */
export const ListBlogPostsValidator = z.object({
  query: z.object({
    published: z.enum(['true', 'false']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default(0)
  }).optional()
})

// Export type inference
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostValidator>['body']
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostValidator>['body']
