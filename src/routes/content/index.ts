/**
 * Content Routes
 * Handles routes for common components and page content with validation
 */
import { Router } from 'express'
import * as contentController from '../../controllers/content.controller.js'
import { requireAuth, optionalAuth, validate } from '../../middleware/index.js'
import {
  UpsertCommonContentValidator,
  GetCommonContentValidator,
  UpsertPageContentValidator,
  GetPageContentValidator,
  ListPagesValidator
} from '../../validators/index.js'

const router = Router()

// ============================================================================
// Common Content Routes
// ============================================================================

/**
 * GET /api/content/common
 * List all common content (public)
 */
router.get('/common', contentController.listCommonContent)

/**
 * GET /api/content/common/:key
 * Get common content by key (public)
 */
router.get(
  '/common/:key',
  validate(GetCommonContentValidator),
  contentController.getCommonContent
)

/**
 * PUT /api/content/common/:key
 * Create or update common content by key (requires auth + validation)
 */
router.put(
  '/common/:key',
  requireAuth,
  validate(UpsertCommonContentValidator),
  contentController.upsertCommonContent
)

/**
 * DELETE /api/content/common/:key
 * Delete common content by key (requires auth)
 */
router.delete(
  '/common/:key',
  requireAuth,
  validate(GetCommonContentValidator),
  contentController.deleteCommonContent
)

// ============================================================================
// Page Content Routes
// ============================================================================

/**
 * GET /api/content/pages
 * List all pages (public - published only, auth - all)
 */
router.get(
  '/pages',
  optionalAuth,
  validate(ListPagesValidator),
  contentController.listPages
)

/**
 * GET /api/content/pages/:slug
 * Get page by slug (public - published only, auth - all)
 */
router.get(
  '/pages/:slug',
  optionalAuth,
  validate(GetPageContentValidator),
  contentController.getPage
)

/**
 * PUT /api/content/pages/:slug
 * Create or update page by slug (requires auth + validation)
 */
router.put(
  '/pages/:slug',
  requireAuth,
  validate(UpsertPageContentValidator),
  contentController.upsertPage
)

/**
 * DELETE /api/content/pages/:slug
 * Delete page by slug (requires auth)
 */
router.delete(
  '/pages/:slug',
  requireAuth,
  validate(GetPageContentValidator),
  contentController.deletePage
)

export default router
