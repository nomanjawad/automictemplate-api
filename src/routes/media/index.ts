/**
 * Media Routes
 * Handles media upload and library management
 */

import { Router } from 'express'
import {
  createMediaFolder,
  deleteMediaFolder,
  getMediaFolders,
  getMediaByFolder,
  uploadMedia,
  getMedia,
  getMediaById,
  updateMedia,
  moveMedia,
  deleteMedia,
  deleteMediaBulk,
  mediaUpload
} from '@controllers'
import { requireAuth } from '@middleware'

const router = Router()

// Folder management
router.get('/folders', getMediaFolders)
router.post('/folders', requireAuth, createMediaFolder)
router.delete('/folders/:name', requireAuth, deleteMediaFolder)
router.get('/folders/:name/images', getMediaByFolder)

// Upload
router.post('/upload', requireAuth, mediaUpload.single('file'), uploadMedia)

// Media list/filter
router.get('/', getMedia)

// Bulk delete
router.delete('/', requireAuth, deleteMediaBulk)

// Media by ID
router.get('/:id', getMediaById)
router.put('/:id', requireAuth, updateMedia)
router.patch('/:id/move', requireAuth, moveMedia)
router.delete('/:id', requireAuth, deleteMedia)

export default router
