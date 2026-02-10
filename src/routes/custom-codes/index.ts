/**
 * Custom Codes Routes
 * API endpoints for managing custom codes (analytics, meta tags, tracking, etc.)
 */

import { Router } from 'express'
import { requireAuth } from '@middleware'
import {
  getAllCustomCodes,
  getCustomCodeById,
  getCustomCodesByType,
  getActiveCustomCodes,
  createCustomCode,
  updateCustomCode,
  deleteCustomCode,
  toggleCustomCodeStatus
} from '@controllers'

const router = Router()

/**
 * @route GET /api/custom-codes
 * @description Get all custom codes (paginated)
 * @access Public
 */
router.get('/', getAllCustomCodes)

/**
 * @route GET /api/custom-codes/active
 * @description Get active custom codes grouped by position (for frontend injection)
 * @access Public
 */
router.get('/active', getActiveCustomCodes)

/**
 * @route GET /api/custom-codes/type/:type
 * @description Get custom codes filtered by type
 * @access Public
 */
router.get('/type/:type', getCustomCodesByType)

/**
 * @route GET /api/custom-codes/:id
 * @description Get a specific custom code by ID
 * @access Public
 */
router.get('/:id', getCustomCodeById)

/**
 * @route POST /api/custom-codes
 * @description Create a new custom code
 * @access Private (Authenticated)
 */
router.post('/', requireAuth, createCustomCode)

/**
 * @route PUT /api/custom-codes/:id
 * @description Update a custom code
 * @access Private (Authenticated)
 */
router.put('/:id', requireAuth, updateCustomCode)

/**
 * @route PATCH /api/custom-codes/:id/toggle
 * @description Toggle the status of a custom code (active/inactive)
 * @access Private (Authenticated)
 */
router.patch('/:id/toggle', requireAuth, toggleCustomCodeStatus)

/**
 * @route DELETE /api/custom-codes/:id
 * @description Delete a custom code
 * @access Private (Authenticated)
 */
router.delete('/:id', requireAuth, deleteCustomCode)

export default router
