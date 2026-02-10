import { Router } from 'express'
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostHistory,
  restoreBlogPostVersion,
  getBlogPostsByCategory,
  getBlogPostsByTag
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
 * GET /api/blog-pages/category/:slug
 * Get all blog posts filtered by category slug (public)
 */
router.get('/category/:slug', getBlogPostsByCategory)

/**
 * GET /api/blog-pages/tag/:slug
 * Get all blog posts filtered by tag slug (public)
 */
router.get('/tag/:slug', getBlogPostsByTag)

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
