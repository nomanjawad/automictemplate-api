import { Router } from 'express'
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostHistory,
  restoreBlogPostVersion
} from '@controllers'
import { requireAuth } from '@middleware'

const router = Router()

// ============================================================================
// All Routes Require Authentication
// ============================================================================

/**
 * GET /api/blog-pages
 * Get all blog posts with basic metadata and author information
 */
router.get('/', requireAuth, getAllBlogPosts)

/**
 * GET /api/blog-pages/:slug
 * Get blog post by slug with full dataset
 */
router.get('/:slug', requireAuth, getBlogPostBySlug)

/**
 * GET /api/blog-pages/:slug/history
 * Get blog post version history by slug
 */
router.get('/:slug/history', requireAuth, getBlogPostHistory)

/**
 * POST /api/blog-pages
 * Create a new blog post
 */
router.post('/', requireAuth, createBlogPost)

/**
 * PUT /api/blog-pages/:slug
 * Update a blog post by slug
 */
router.put('/:slug', requireAuth, updateBlogPost)

/**
 * POST /api/blog-pages/:slug/restore/:version
 * Restore a blog post to a previous version by slug
 */
router.post('/:slug/restore/:version', requireAuth, restoreBlogPostVersion)

/**
 * DELETE /api/blog-pages/:slug
 * Delete blog post by slug
 */
router.delete('/:slug', requireAuth, deleteBlogPost)

export default router
