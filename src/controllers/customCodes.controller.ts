/**
 * Custom Codes Controller
 * Handles CRUD operations for custom codes (analytics, meta tags, tracking, etc.)
 */

import { Request, Response } from 'express'
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
import { CodeType, CodePosition } from '../types/index.js'

const validTypes: CodeType[] = ['analytics', 'meta', 'tracking', 'verification', 'custom']
const validPositions: CodePosition[] = ['head', 'body_start', 'body_end']

/**
 * Get all custom codes
 */
export const getAllCustomCodes = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: codes, error } = await supabase
    .from('custom_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch custom codes', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    codes: codes || [],
    total: codes?.length || 0
  })
})

/**
 * Get custom code by ID
 */
export const getCustomCodeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id) {
    throw new BadRequestError('Code ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: code, error } = await supabase
    .from('custom_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Custom code not found')
    }
    logger.error('Failed to fetch custom code by ID', {
      error: error.message,
      code: error.code,
      id
    })
    throw new ApiDatabaseError(error)
  }

  return res.json({ code })
})

/**
 * Get custom codes by type
 */
export const getCustomCodesByType = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params

  if (!type || !validTypes.includes(type as CodeType)) {
    throw new BadRequestError(`Invalid type. Must be one of: ${validTypes.join(', ')}`)
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: codes, error } = await supabase
    .from('custom_codes')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch custom codes by type', { error: error.message, type })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    type,
    codes: codes || [],
    total: codes?.length || 0
  })
})

/**
 * Get active custom codes (for public/frontend use)
 */
export const getActiveCustomCodes = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: codes, error } = await supabase
    .from('custom_codes')
    .select('*')
    .eq('status', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch active custom codes', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  // Group by position for frontend convenience
  const codesByPosition = {
    head: (codes || []).filter(c => c.position === 'head'),
    body_start: (codes || []).filter(c => c.position === 'body_start'),
    body_end: (codes || []).filter(c => c.position === 'body_end')
  }

  return res.json({
    codes: codesByPosition,
    total: codes?.length || 0
  })
})

/**
 * Create a new custom code
 */
export const createCustomCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  const userName = req.user?.user_metadata?.full_name || req.user?.email || 'Unknown'

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { name, code, type, position, author_name, status } = req.body

  if (!name || !code || !type || !position) {
    throw new BadRequestError('Missing required fields: name, code, type, and position are required')
  }

  if (!validTypes.includes(type)) {
    throw new BadRequestError(`Invalid type. Must be one of: ${validTypes.join(', ')}`)
  }

  if (!validPositions.includes(position)) {
    throw new BadRequestError(`Invalid position. Must be one of: ${validPositions.join(', ')}`)
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: newCode, error } = await supabase
    .from('custom_codes')
    .insert({
      name,
      code,
      type,
      position,
      author_name: author_name || userName,
      status: status !== false // default to true
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create custom code', {
      error: error.message,
      code: error.code,
      name,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Custom code created successfully', {
    codeId: newCode.id,
    name,
    type,
    position,
    userId
  })

  return res.status(201).json({
    message: 'Custom code created successfully',
    code: newCode
  })
})

/**
 * Update a custom code by ID
 */
export const updateCustomCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  const userName = req.user?.user_metadata?.full_name || req.user?.email || 'Unknown'

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params
  const { name, code, type, position, author_name, status } = req.body

  if (!id) {
    throw new BadRequestError('Code ID is required')
  }

  if (!name && !code && !type && !position && author_name === undefined && status === undefined) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (type && !validTypes.includes(type)) {
    throw new BadRequestError(`Invalid type. Must be one of: ${validTypes.join(', ')}`)
  }

  if (position && !validPositions.includes(position)) {
    throw new BadRequestError(`Invalid position. Must be one of: ${validPositions.join(', ')}`)
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Verify code exists first
  const { data: existingCode, error: fetchError } = await supabase
    .from('custom_codes')
    .select('id, name')
    .eq('id', id)
    .single()

  if (fetchError || !existingCode) {
    logger.warn('Custom code not found for update', { id, userId })
    throw new ApiNotFoundError('Custom code not found')
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (code !== undefined) updateData.code = code
  if (type !== undefined) updateData.type = type
  if (position !== undefined) updateData.position = position
  if (author_name !== undefined) updateData.author_name = author_name
  if (status !== undefined) updateData.status = status

  const { data: updatedCode, error } = await supabase
    .from('custom_codes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update custom code', {
      error: error.message,
      code: error.code,
      id,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Custom code updated successfully', {
    codeId: id,
    name: updatedCode.name,
    userId
  })

  return res.json({
    message: 'Custom code updated successfully',
    code: updatedCode
  })
})

/**
 * Delete a custom code by ID
 */
export const deleteCustomCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params

  if (!id) {
    throw new BadRequestError('Code ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Verify code exists first
  const { data: code, error: fetchError } = await supabase
    .from('custom_codes')
    .select('id, name')
    .eq('id', id)
    .single()

  if (fetchError || !code) {
    logger.warn('Custom code not found for deletion', { id, userId })
    throw new ApiNotFoundError('Custom code not found')
  }

  const { error: deleteError } = await supabase
    .from('custom_codes')
    .delete()
    .eq('id', id)

  if (deleteError) {
    logger.error('Failed to delete custom code', {
      error: deleteError.message,
      code: deleteError.code,
      id,
      userId
    })
    throw new ApiDatabaseError(deleteError)
  }

  logger.warn('Custom code deleted', { codeId: id, codeName: code.name, deletedBy: userId })

  return res.json({
    message: 'Custom code deleted successfully',
    deleted_code: {
      id: code.id,
      name: code.name
    }
  })
})

/**
 * Toggle custom code status (active/inactive)
 */
export const toggleCustomCodeStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { id } = req.params

  if (!id) {
    throw new BadRequestError('Code ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get current status
  const { data: code, error: fetchError } = await supabase
    .from('custom_codes')
    .select('id, name, status')
    .eq('id', id)
    .single()

  if (fetchError || !code) {
    logger.warn('Custom code not found for toggle', { id, userId })
    throw new ApiNotFoundError('Custom code not found')
  }

  const newStatus = !code.status

  const { data: updatedCode, error } = await supabase
    .from('custom_codes')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to toggle custom code status', {
      error: error.message,
      id,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Custom code status toggled', {
    codeId: id,
    name: updatedCode.name,
    newStatus: updatedCode.status,
    userId
  })

  return res.json({
    message: `Custom code ${newStatus ? 'enabled' : 'disabled'} successfully`,
    code: updatedCode
  })
})
