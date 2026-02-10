import { Router } from 'express'
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag
} from '@controllers'
import { requireAuth } from '@middleware'

// ============================================================================
// Categories Router (for /api/categories)
// ============================================================================

const categoriesRouter = Router()

/**
 * GET /api/categories
 * Get all categories (public)
 */
categoriesRouter.get('/', getAllCategories)

/**
 * GET /api/categories/:slug
 * Get category by slug (public)
 */
categoriesRouter.get('/:slug', getCategoryBySlug)

/**
 * POST /api/categories
 * Create new category (requires auth)
 */
categoriesRouter.post('/', requireAuth, createCategory)

/**
 * PUT /api/categories/:slug
 * Update category (requires auth)
 */
categoriesRouter.put('/:slug', requireAuth, updateCategory)

/**
 * DELETE /api/categories/:slug
 * Delete category (requires auth)
 */
categoriesRouter.delete('/:slug', requireAuth, deleteCategory)

// ============================================================================
// Tags Router (for /api/tags)
// ============================================================================

const tagsRouter = Router()

/**
 * GET /api/tags
 * Get all tags (public)
 */
tagsRouter.get('/', getAllTags)

/**
 * GET /api/tags/:slug
 * Get tag by slug (public)
 */
tagsRouter.get('/:slug', getTagBySlug)

/**
 * POST /api/tags
 * Create new tag (requires auth)
 */
tagsRouter.post('/', requireAuth, createTag)

/**
 * PUT /api/tags/:slug
 * Update tag (requires auth)
 */
tagsRouter.put('/:slug', requireAuth, updateTag)

/**
 * DELETE /api/tags/:slug
 * Delete tag (requires auth)
 */
tagsRouter.delete('/:slug', requireAuth, deleteTag)

// Export both routers
export { categoriesRouter, tagsRouter }
