/**
 * Blog Routes
 * Handles routes for blog posts CRUD with validation
 */
import { Router } from 'express'
import * as blogController from '../../controllers/blog.controller.js'
import { requireAuth, optionalAuth, validate } from '../../middleware/index.js'
import {
  CreateBlogPostValidator,
  UpdateBlogPostValidator,
  GetBlogPostValidator,
  ListBlogPostsValidator
} from '../../validators/index.js'

const router = Router()

/**
 * GET /api/blog
 * List all blog posts (public - published only, auth - all)
 */
router.get(
  '/',
  optionalAuth,
  validate(ListBlogPostsValidator),
  blogController.list
)

/**
 * GET /api/blog/:slug
 * Get blog post by slug (public - published only, auth - all)
 */
router.get(
  '/:slug',
  optionalAuth,
  validate(GetBlogPostValidator),
  blogController.get
)

/**
 * POST /api/blog
 * Create new blog post (requires auth + validation)
 */
router.post(
  '/',
  requireAuth,
  validate(CreateBlogPostValidator),
  blogController.create
)

/**
 * PUT /api/blog/:slug
 * Update blog post by slug (requires auth + validation)
 */
router.put(
  '/:slug',
  requireAuth,
  validate(UpdateBlogPostValidator),
  blogController.update
)

/**
 * DELETE /api/blog/:slug
 * Delete blog post by slug (requires auth)
 */
router.delete(
  '/:slug',
  requireAuth,
  validate(GetBlogPostValidator),
  blogController.remove
)

export default router
