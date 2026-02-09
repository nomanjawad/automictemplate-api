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
 * GET /api/pages/:slug
 * Get page by slug with full dataset
 * Returns: Complete page data including JSONB content, author info
 */
router.get('/:slug', requireAuth, getPageById)

/**
 * GET /api/pages/:slug/history
 * Get page version history by slug
 * Returns: All versions with who changed it and when
 */
router.get('/:slug/history', requireAuth, getPageHistory)

/**
 * POST /api/pages
 * Create a new page
 * Body: { title, slug, meta_data? }
 * Auto-sets author_id and status to 'draft'
 * Content data can be added/updated later
 */
router.post('/', requireAuth, createPage)

/**
 * PUT /api/pages/:slug
 * Update a page by slug
 * Body: { title?, slug?, data?, meta_data?, status? }
 * Auto-sets last_modified_by and tracks changes in content_history
 * Status can be: 'draft', 'review', 'scheduled', 'published', 'archived'
 */
router.put('/:slug', requireAuth, updatePage)

/**
 * POST /api/pages/:slug/restore/:version
 * Restore a page to a previous version by slug
 * Returns: Updated page with restored content
 */
router.post('/:slug/restore/:version', requireAuth, restorePageVersion)

/**
 * DELETE /api/pages/:slug
 * Delete page by slug
 */
router.delete('/:slug', requireAuth, deletePage)

export default router
