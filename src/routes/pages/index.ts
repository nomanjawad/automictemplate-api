import { Router } from 'express'
import {
  getAllPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getPageHistory,
  restorePageVersion
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
 * GET /api/pages/:id/history
 * Get page version history
 * Returns: All versions with who changed it and when
 */
router.get('/:id/history', requireAuth, getPageHistory)

/**
 * POST /api/pages
 * Create a new page
 * Body: { title, slug, meta_data? }
 * Auto-sets author_id and status to 'draft'
 * Content data can be added/updated later
 */
router.post('/', requireAuth, createPage)

/**
 * PUT /api/pages/:id
 * Update a page by ID
 * Body: { title?, slug?, data?, meta_data?, status? }
 * Auto-sets last_modified_by and tracks changes in content_history
 * Status can be: 'draft', 'review', 'scheduled', 'published', 'archived'
 */
router.put('/:id', requireAuth, updatePage)

/**
 * POST /api/pages/:id/restore/:version
 * Restore a page to a previous version
 * Returns: Updated page with restored content
 */
router.post('/:id/restore/:version', requireAuth, restorePageVersion)

/**
 * DELETE /api/pages/:id
 * Delete page by ID
 */
router.delete('/:id', requireAuth, deletePage)

export default router
