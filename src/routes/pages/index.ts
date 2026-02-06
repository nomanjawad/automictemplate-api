import { Router } from 'express'
import {
  getAllPages,
  getPageById,
  createPage,
  updatePage,
  deletePage
} from '@controllers'
import { requireAuth } from '@middleware'

const router = Router()

// ============================================================================
// All Routes Require Authentication
// ============================================================================

/**
 * GET /api/pages
 * Get all pages with basic metadata and author information
 * Returns: id, title, slug, status, meta_data, created_at, author name
 * No pagination - returns ALL pages for dashboard filtering/sorting
 */
router.get('/', requireAuth, getAllPages)

/**
 * GET /api/pages/:id
 * Get page by ID with full dataset
 * Returns: Complete page data including JSONB content, author info
 */
router.get('/:id', requireAuth, getPageById)

/**
 * POST /api/pages
 * Create a new page
 * Body: { title, slug, data, meta_data?, status? }
 * Auto-sets author_id from authenticated user
 */
router.post('/', requireAuth, createPage)

/**
 * PUT /api/pages/:id
 * Update a page by ID
 * Body: { title?, slug?, data?, meta_data?, status? }
 * Auto-sets last_modified_by from authenticated user
 * No authorization check - any authenticated user can update any page
 */
router.put('/:id', requireAuth, updatePage)

/**
 * DELETE /api/pages/:id
 * Delete page by ID
 */
router.delete('/:id', requireAuth, deletePage)

export default router
