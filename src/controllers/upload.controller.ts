/**
 * Upload Controller
 * Handles file uploads to Supabase Storage
 */
import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger } from '../utils/index.js'
import multer from 'multer'
import path from 'path'

// Configure multer for memory storage (files will be uploaded directly to Supabase)
const storage = multer.memoryStorage()

// File filter - only allow images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error('Invalid file type. Only images are allowed.'))
  }
}

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
})

/**
 * Upload single image to Supabase Storage
 * POST /api/upload/image
 * Body: multipart/form-data with 'file' field
 * Optional query param: ?folder=blog (to organize files)
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage service unavailable' })
    }

    const file = req.file
    const folder = (req.query.folder as string) || 'general'

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(file.originalname)
    const filename = `${folder}/${timestamp}-${randomString}${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logger.error('Failed to upload image', { error: error.message })
      return res.status(500).json({ error: 'Failed to upload image' })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
      .getPublicUrl(data.path)

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        path: data.path,
        url: urlData.publicUrl,
        size: file.size,
        mimetype: file.mimetype
      }
    })
  } catch (err: any) {
    logger.error('Upload image error', { error: err.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Upload multiple images to Supabase Storage
 * POST /api/upload/images
 * Body: multipart/form-data with 'files' field (multiple files)
 * Optional query param: ?folder=gallery
 */
export async function uploadImages(req: Request, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage service unavailable' })
    }

    const files = req.files as Express.Multer.File[]
    const folder = (req.query.folder as string) || 'general'
    const uploadedFiles: any[] = []
    const errors: any[] = []

    // Upload each file
    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const ext = path.extname(file.originalname)
        const filename = `${folder}/${timestamp}-${randomString}${ext}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
          .getPublicUrl(data.path)

        uploadedFiles.push({
          originalName: file.originalname,
          path: data.path,
          url: urlData.publicUrl,
          size: file.size,
          mimetype: file.mimetype
        })
      } catch (err: any) {
        errors.push({
          filename: file.originalname,
          error: err.message || 'Unknown error'
        })
      }
    }

    return res.status(201).json({
      success: true,
      message: `Uploaded ${uploadedFiles.length} of ${files.length} files`,
      data: {
        uploaded: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (err: any) {
    logger.error('Upload images error', { error: err.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Delete image from Supabase Storage
 * DELETE /api/upload/image
 * Body: { path: 'folder/filename.jpg' }
 */
export async function deleteImage(req: Request, res: Response) {
  try {
    const { path: filePath } = req.body

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage service unavailable' })
    }

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
      .remove([filePath])

    if (error) {
      logger.error('Failed to delete image', { error: error.message })
      return res.status(500).json({ error: 'Failed to delete image' })
    }

    return res.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (err: any) {
    logger.error('Delete image error', { error: err.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * List images in a folder
 * GET /api/upload/images/:folder?
 */
export async function listImages(req: Request, res: Response) {
  try {
    const folder = req.params.folder || ''

    if (!supabase) {
      return res.status(500).json({ error: 'Storage service unavailable' })
    }

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      logger.error('Failed to list images', { error: error.message })
      return res.status(500).json({ error: 'Failed to list images' })
    }

    // Get public URLs for each file
    const filesWithUrls = data.map(file => {
      const { data: urlData } = supabase!.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'images')
        .getPublicUrl(`${folder}${folder ? '/' : ''}${file.name}`)

      return {
        name: file.name,
        url: urlData.publicUrl,
        size: file.metadata?.size,
        contentType: file.metadata?.mimetype,
        createdAt: file.created_at,
        updatedAt: file.updated_at
      }
    })

    return res.json({
      success: true,
      data: filesWithUrls
    })
  } catch (err: any) {
    logger.error('List images error', { error: err.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
