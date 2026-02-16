/**
 * Media Controller
 * Handles image uploads and media metadata stored in Supabase Storage
 */

import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { supabase } from '../db/supabaseClient.js'
import {
  logger,
  asyncHandler,
  ApiDatabaseError,
  ApiNotFoundError,
  BadRequestError,
  ApiUnauthorizedError,
  InternalServerError
} from '../utils/index.js'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'images'
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

const storage = multer.memoryStorage()

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error('Invalid file type. Only images are allowed.'))
  }
}

export const mediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES }
})

const normalizeFolderName = (name: string) => name.trim().toLowerCase()
const isValidFolderName = (name: string) => /^[a-z0-9][a-z0-9_-]*$/.test(name)

const ensureFolderExists = async (folderName: string) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data, error } = await supabase
    .from('media_folders')
    .select('name')
    .eq('name', folderName)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new BadRequestError('Invalid type. Folder does not exist.')
    }
    throw new ApiDatabaseError(error)
  }

  return data
}

const buildPublicUrl = (pathValue: string) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathValue)
  return data.publicUrl
}

const uploadPlaceholderFile = async (folderName: string) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const placeholderPath = `${folderName}/.keep`
  const { error } = await supabase.storage.from(BUCKET).upload(placeholderPath, Buffer.from(''), {
    contentType: 'text/plain',
    cacheControl: '3600',
    upsert: true
  })

  if (error) {
    logger.warn('Failed to create placeholder file for folder', {
      folderName,
      error: error.message
    })
  }
}

/**
 * Get all media folders
 * GET /api/media/folders
 */
export const getMediaFolders = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data, error } = await supabase
    .from('media_folders')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to fetch media folders', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    folders: data || [],
    total: data?.length || 0
  })
})

/**
 * Create a media folder
 * POST /api/media/folders
 */
export const createMediaFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { name } = req.body

  if (!name || typeof name !== 'string') {
    throw new BadRequestError('Folder name is required')
  }

  const folderName = normalizeFolderName(name)

  if (!isValidFolderName(folderName)) {
    throw new BadRequestError('Folder name must be lowercase and URL-safe (letters, numbers, dash, underscore)')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data, error } = await supabase
    .from('media_folders')
    .insert({ name: folderName })
    .select('*')
    .single()

  if (error) {
    logger.error('Failed to create media folder', { error: error.message, folderName })
    throw new ApiDatabaseError(error)
  }

  await uploadPlaceholderFile(folderName)

  return res.status(201).json({
    message: 'Folder created successfully',
    folder: data
  })
})

/**
 * Delete a media folder and all its contents
 * DELETE /api/media/folders/:name
 */
export const deleteMediaFolder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { name } = req.params

  if (!name) {
    throw new BadRequestError('Folder name is required')
  }

  const folderName = normalizeFolderName(name)

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  await ensureFolderExists(folderName)

  const { data: mediaItems, error: fetchError } = await supabase
    .from('media')
    .select('id, path')
    .eq('type', folderName)

  if (fetchError) {
    logger.error('Failed to fetch media items for folder deletion', {
      error: fetchError.message,
      folderName
    })
    throw new ApiDatabaseError(fetchError)
  }

  const pathsToDelete = (mediaItems || []).map(item => item.path)
  pathsToDelete.push(`${folderName}/.keep`)

  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(pathsToDelete)

    if (storageError) {
      logger.error('Failed to delete folder files from storage', {
        error: storageError.message,
        folderName
      })
      throw new ApiDatabaseError(storageError)
    }
  }

  const { error: deleteMediaError } = await supabase
    .from('media')
    .delete()
    .eq('type', folderName)

  if (deleteMediaError) {
    logger.error('Failed to delete media records for folder', {
      error: deleteMediaError.message,
      folderName
    })
    throw new ApiDatabaseError(deleteMediaError)
  }

  const { error: deleteFolderError } = await supabase
    .from('media_folders')
    .delete()
    .eq('name', folderName)

  if (deleteFolderError) {
    logger.error('Failed to delete media folder record', {
      error: deleteFolderError.message,
      folderName
    })
    throw new ApiDatabaseError(deleteFolderError)
  }

  return res.json({
    message: 'Folder deleted successfully',
    deleted_folder: folderName,
    deleted_items: mediaItems?.length || 0
  })
})

/**
 * Upload a single image and store metadata
 * POST /api/media/upload
 * Body: multipart/form-data with file, title, description, alt_text, type
 */
export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  const authorName = req.user?.user_metadata?.full_name || req.user?.email || 'Unknown'

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  if (!req.file) {
    throw new BadRequestError('No file uploaded')
  }

  const { title, description, alt_text, type } = req.body

  if (!title || !type) {
    throw new BadRequestError('Missing required fields: title and type are required')
  }

  const folderName = normalizeFolderName(String(type))

  if (!isValidFolderName(folderName)) {
    throw new BadRequestError('Invalid type. Use a valid folder name')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  await ensureFolderExists(folderName)

  const file = req.file
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const ext = path.extname(file.originalname) || ''
  const filename = `${folderName}/${timestamp}-${randomString}${ext}`

  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  })

  if (error) {
    logger.error('Failed to upload media', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  const publicUrl = buildPublicUrl(data.path)

  const { data: mediaItem, error: insertError } = await supabase
    .from('media')
    .insert({
      title,
      description: description || null,
      alt_text: alt_text || null,
      type: folderName,
      author_name: authorName,
      upload_date: new Date().toISOString(),
      path: data.path,
      url: publicUrl,
      size: file.size,
      mime_type: file.mimetype
    })
    .select('*')
    .single()

  if (insertError) {
    logger.error('Failed to save media metadata', { error: insertError.message })
    throw new ApiDatabaseError(insertError)
  }

  return res.status(201).json({
    message: 'Media uploaded successfully',
    media: mediaItem
  })
})

/**
 * Get media items with optional filters
 * GET /api/media
 */
export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type ? normalizeFolderName(String(req.query.type)) : undefined
  const author = req.query.author ? String(req.query.author) : undefined
  const dateFrom = req.query.date_from ? String(req.query.date_from) : undefined
  const dateTo = req.query.date_to ? String(req.query.date_to) : undefined
  const mode = req.query.mode ? String(req.query.mode) : 'multi'

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const hasDateFilter = Boolean(dateFrom || dateTo)
  const activeFilterCount = [type ? 1 : 0, author ? 1 : 0, hasDateFilter ? 1 : 0].reduce(
    (sum, val) => sum + val,
    0
  )

  if (mode === 'single' && activeFilterCount > 1) {
    throw new BadRequestError('Only one filter is allowed when mode=single')
  }

  let query = supabase.from('media').select('*').order('upload_date', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  if (author) {
    query = query.ilike('author_name', `%${author}%`)
  }

  if (dateFrom) {
    query = query.gte('upload_date', dateFrom)
  }

  if (dateTo) {
    query = query.lte('upload_date', dateTo)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Failed to fetch media items', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    media: data || [],
    total: data?.length || 0
  })
})

/**
 * Get all media items within a folder
 * GET /api/media/folders/:name/images
 */
export const getMediaByFolder = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params

  if (!name) {
    throw new BadRequestError('Folder name is required')
  }

  const folderName = normalizeFolderName(name)

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('type', folderName)
    .order('upload_date', { ascending: false })

  if (error) {
    logger.error('Failed to fetch media items by folder', { error: error.message, folderName })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    folder: folderName,
    media: data || [],
    total: data?.length || 0
  })
})

/**
 * Get media item by ID
 * GET /api/media/:id
 */
export const getMediaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id) {
    throw new BadRequestError('Media ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data, error } = await supabase.from('media').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Media item not found')
    }
    throw new ApiDatabaseError(error)
  }

  return res.json({ media: data })
})

/**
 * Update media metadata
 * PUT /api/media/:id
 */
export const updateMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params
  const { title, description, alt_text, type } = req.body

  if (!id) {
    throw new BadRequestError('Media ID is required')
  }

  if (type !== undefined) {
    throw new BadRequestError('Use the move endpoint to change the media folder type')
  }

  if (title === undefined && description === undefined && alt_text === undefined) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: existingItem, error: fetchError } = await supabase
    .from('media')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existingItem) {
    throw new ApiNotFoundError('Media item not found')
  }

  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (alt_text !== undefined) updateData.alt_text = alt_text

  const { data, error } = await supabase
    .from('media')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    logger.error('Failed to update media', { error: error.message, id })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    message: 'Media updated successfully',
    media: data
  })
})

/**
 * Move media item to a different folder
 * PATCH /api/media/:id/move
 */
export const moveMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params
  const { type } = req.body

  if (!id || !type) {
    throw new BadRequestError('Media ID and destination type are required')
  }

  const destinationFolder = normalizeFolderName(String(type))

  if (!isValidFolderName(destinationFolder)) {
    throw new BadRequestError('Invalid destination type')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  await ensureFolderExists(destinationFolder)

  const { data: mediaItem, error: fetchError } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !mediaItem) {
    throw new ApiNotFoundError('Media item not found')
  }

  const filename = path.posix.basename(mediaItem.path)
  const newPath = `${destinationFolder}/${filename}`

  const { error: moveError } = await supabase.storage.from(BUCKET).move(mediaItem.path, newPath)

  if (moveError) {
    logger.error('Failed to move media in storage', { error: moveError.message, id })
    throw new ApiDatabaseError(moveError)
  }

  const newUrl = buildPublicUrl(newPath)

  const { data: updatedItem, error: updateError } = await supabase
    .from('media')
    .update({
      type: destinationFolder,
      path: newPath,
      url: newUrl
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    logger.error('Failed to update media after move', { error: updateError.message, id })
    throw new ApiDatabaseError(updateError)
  }

  return res.json({
    message: 'Media moved successfully',
    media: updatedItem
  })
})

/**
 * Delete media by ID
 * DELETE /api/media/:id
 */
export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params

  if (!id) {
    throw new BadRequestError('Media ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: mediaItem, error: fetchError } = await supabase
    .from('media')
    .select('id, path')
    .eq('id', id)
    .single()

  if (fetchError || !mediaItem) {
    throw new ApiNotFoundError('Media item not found')
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([mediaItem.path])

  if (storageError) {
    logger.error('Failed to delete media from storage', { error: storageError.message, id })
    throw new ApiDatabaseError(storageError)
  }

  const { error: deleteError } = await supabase.from('media').delete().eq('id', id)

  if (deleteError) {
    logger.error('Failed to delete media record', { error: deleteError.message, id })
    throw new ApiDatabaseError(deleteError)
  }

  return res.json({
    message: 'Media deleted successfully',
    deleted_id: id
  })
})

/**
 * Bulk delete media items by IDs
 * DELETE /api/media
 */
export const deleteMediaBulk = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { ids } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('Media IDs are required for bulk delete')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: mediaItems, error: fetchError } = await supabase
    .from('media')
    .select('id, path')
    .in('id', ids)

  if (fetchError) {
    logger.error('Failed to fetch media items for bulk delete', { error: fetchError.message })
    throw new ApiDatabaseError(fetchError)
  }

  const pathsToDelete = (mediaItems || []).map(item => item.path)

  if (pathsToDelete.length === 0) {
    throw new ApiNotFoundError('No media items found for the provided IDs')
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove(pathsToDelete)

  if (storageError) {
    logger.error('Failed to delete media from storage (bulk)', { error: storageError.message })
    throw new ApiDatabaseError(storageError)
  }

  const { error: deleteError } = await supabase.from('media').delete().in('id', ids)

  if (deleteError) {
    logger.error('Failed to delete media records (bulk)', { error: deleteError.message })
    throw new ApiDatabaseError(deleteError)
  }

  return res.json({
    message: 'Media deleted successfully',
    deleted_count: pathsToDelete.length
  })
})
