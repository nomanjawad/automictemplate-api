/**
 * Upload Routes
 * Handles file upload routes for Supabase Storage
 */
import { Router } from 'express'
import * as uploadController from '../../controllers/index.js'
import { requireAuth } from '../../middleware/index.js'

const router = Router()

/**
 * POST /api/upload/image
 * Upload single image (requires auth)
 * Body: multipart/form-data with 'file' field
 * Optional query: ?folder=blog
 */
router.post(
  '/image',
  requireAuth,
  uploadController.upload.single('file'),
  uploadController.uploadImage
)

/**
 * POST /api/upload/images
 * Upload multiple images (requires auth)
 * Body: multipart/form-data with 'files' field (multiple)
 * Optional query: ?folder=gallery
 */
router.post(
  '/images',
  requireAuth,
  uploadController.upload.array('files', 10), // Max 10 files
  uploadController.uploadImages
)

/**
 * DELETE /api/upload/image
 * Delete image from storage (requires auth)
 * Body: { path: 'folder/filename.jpg' }
 */
router.delete('/image', requireAuth, uploadController.deleteImage)

/**
 * GET /api/upload/images
 * GET /api/upload/images/:folder
 * List images in folder (requires auth)
 */
router.get('/list', requireAuth, uploadController.listImages)
router.get('/list/:folder', requireAuth, uploadController.listImages)

export default router
