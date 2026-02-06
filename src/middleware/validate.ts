/**
 * @module middleware/validate
 * @description Request validation middleware using Zod schemas
 * Validates request body, params, and query against schemas
 */

import { ZodSchema, ZodError } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { UnprocessableEntityError } from '../utils/index.js'

/**
 * Request validation middleware factory
 * Validates request body, params, and/or query against a Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 * @example
 * import { CreateBlogPostValidator } from '@validators'
 * router.post('/posts', validate(CreateBlogPostValidator), createPost)
 */
export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query
      })

      if (!result.success) {
        const errors = formatZodErrors(result.error)
        throw new UnprocessableEntityError('Validation failed', errors)
      }

      // Replace req properties with validated data
      if (result.data.body) req.body = result.data.body
      if (result.data.params) req.params = result.data.params
      if (result.data.query) req.query = result.data.query

      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Format Zod validation errors into a readable structure
 * @param {ZodError} error - Zod error object
 * @returns {Record<string, string[]>} Formatted errors
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  })

  return formatted
}
