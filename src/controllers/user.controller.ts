import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger, asyncHandler, BadRequestError, ApiNotFoundError, InternalServerError, ApiDatabaseError } from '../utils/index.js'

/**
 * Get all users with full details
 * Returns ALL user data (internal use only for admins)
 * Frontend will handle filtering based on role
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get all users from public.users table
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch users', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  logger.info('Fetched all users', { count: users?.length || 0 })

  return res.json({
    users: users || [],
    total: users?.length || 0
  })
})

/**
 * Get all users public (limited fields)
 * Returns only: full_name, email, role, created_at
 * For public listing without exposing sensitive data
 */
export const getAllUsersPublic = asyncHandler(async (req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get all users with limited fields
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch users', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  logger.info('Fetched all users (public)', { count: users?.length || 0 })

  return res.json({
    users: users || [],
    total: users?.length || 0
  })
})

/**
 * Get user by ID
 * Returns all user info: email, full_name, role, bio, avatar_url, metadata, created_at, updated_at
 * Frontend will control visibility based on user role
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id) {
    throw new BadRequestError('User ID is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('User not found')
    }
    logger.error('Failed to fetch user by ID', { error: error.message, userId: id })
    throw new ApiDatabaseError(error)
  }

  logger.info('Fetched user by ID', { userId: id })

  return res.json({ user })
})

/**
 * Update own profile (authenticated user only)
 * Users can only update their own profile
 * Can update: full_name, bio, avatar_url, metadata
 * Cannot update: email, password, role (frontend controls visibility)
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new Error('User not authenticated')
  }

  const { full_name, bio, avatar_url, metadata } = req.body

  // Validate at least one field is being updated
  if (full_name === undefined && bio === undefined && avatar_url === undefined && metadata === undefined) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Build update object with only provided fields
  const updateData: any = {}
  if (full_name !== undefined) updateData.full_name = full_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (metadata !== undefined) updateData.metadata = metadata

  // Update user in public.users table
  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update profile', { error: error.message, userId })
    throw new ApiDatabaseError(error)
  }

  logger.info('Profile updated successfully', { userId })

  return res.json({
    message: 'Profile updated successfully',
    user
  })
})

/**
 * Delete own account (authenticated user only)
 * Default soft delete (sets deleted_at)
 * Permanently deletes from auth.users which cascades to public.users
 */
export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new Error('User not authenticated')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Delete from auth.users - cascades to public.users
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    logger.error('Failed to delete user account', { error: authError.message, userId })
    throw new InternalServerError('Failed to delete account')
  }

  logger.info('User account deleted', { userId })

  return res.json({
    message: 'Account deleted successfully'
  })
})

/**
 * Check active session
 * Returns current user's session info with role
 */
export const checkSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    return res.json({
      session: null,
      user: null
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get current user session
  const { data: sessionData } = await supabase.auth.getSession()

  // Get user profile with role
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    logger.error('Failed to fetch user profile', { error: error.message, userId })
    throw new ApiDatabaseError(error)
  }

  logger.info('Session checked', { userId })

  return res.json({
    session: sessionData?.session || null,
    user: user || null
  })
})
