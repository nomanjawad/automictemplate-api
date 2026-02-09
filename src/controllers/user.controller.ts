import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger, asyncHandler, BadRequestError, ApiNotFoundError, InternalServerError, ApiDatabaseError, ApiConflictError } from '../utils/index.js'

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
 * Users can only update their own profile, not others.
 * Can update: email, full_name, bio, avatar_url, metadata, role
 * Password should be updated via auth endpoint
 * Frontend controls which fields to edit
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new Error('User not authenticated')
  }

  const { email, full_name, bio, avatar_url, metadata, role } = req.body

  // Validate at least one field is being updated
  if (
    email === undefined &&
    full_name === undefined &&
    bio === undefined &&
    avatar_url === undefined &&
    metadata === undefined &&
    role === undefined
  ) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  // Validate role if provided
  if (role && !['user', 'admin', 'moderator'].includes(role)) {
    throw new BadRequestError('Invalid role. Must be: user, admin, or moderator')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Build update object with only provided fields for public.users table
  const updateData: any = {}
  if (email !== undefined) updateData.email = email
  if (full_name !== undefined) updateData.full_name = full_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (metadata !== undefined) updateData.metadata = metadata
  if (role !== undefined) updateData.role = role

  // Update user in public.users table
  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation for email
    if (error.code === '23505') {
      logger.warn('Profile update failed - duplicate email', { email, userId })
      throw new ApiConflictError('This email is already in use by another account')
    }
    logger.error('Failed to update profile', { error: error.message, userId })
    throw new ApiDatabaseError(error)
  }

  // If email was updated, also update in auth.users via admin API
  if (email !== undefined && email !== req.user?.email) {
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: email,
        email_confirm: true // Auto-confirm email change
      })

      if (authError) {
        logger.warn('Email update in auth.users failed', { 
          error: authError.message, 
          userId,
          newEmail: email 
        })
        // Continue - public.users was updated successfully
        // Auth update failed but it's not critical
      } else {
        logger.info('Email updated in auth.users successfully', { userId, newEmail: email })
      }
    } catch (err: any) {
      logger.warn('Email update in auth.users threw error', { 
        error: err.message || err,
        userId 
      })
      // Continue - public.users was updated successfully
    }
  }

  logger.info('Profile updated successfully', { userId, updatedFields: Object.keys(updateData) })

  return res.json({
    message: 'Profile updated successfully',
    user
  })
})

/**
 * Update any user by ID (for admin/moderator management)
 * Admin/moderators can update any user
 * Frontend controls which roles can access this endpoint
 * Can update: email, full_name, bio, avatar_url, metadata, role
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id) {
    throw new BadRequestError('User ID is required')
  }

  const { email, full_name, bio, avatar_url, metadata, role } = req.body

  // Validate at least one field is being updated
  if (
    email === undefined &&
    full_name === undefined &&
    bio === undefined &&
    avatar_url === undefined &&
    metadata === undefined &&
    role === undefined
  ) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  // Validate role if provided
  if (role && !['user', 'admin', 'moderator'].includes(role)) {
    throw new BadRequestError('Invalid role. Must be: user, admin, or moderator')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // First verify the user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', id)
    .single()

  if (fetchError) {
    logger.error('User fetch error during update', { 
      error: fetchError.message, 
      code: fetchError.code,
      userId: id 
    })
    throw new ApiNotFoundError('User not found')
  }

  if (!existingUser) {
    logger.warn('User not found for update', { userId: id })
    throw new ApiNotFoundError('User not found')
  }

  logger.info('User found, proceeding with update', { 
    userId: id, 
    existingEmail: existingUser.email,
    updateFields: Object.keys(req.body)
  })

  // Build update object with only provided fields
  const updateData: any = {}
  if (email !== undefined) updateData.email = email
  if (full_name !== undefined) updateData.full_name = full_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (metadata !== undefined) updateData.metadata = metadata
  if (role !== undefined) updateData.role = role

  logger.info('Attempting user update', { 
    userId: id, 
    updateData,
    updateBy: req.user?.id 
  })

  // Update user in public.users table
  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Update query failed', { 
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId: id,
      updateData 
    })

    // Handle unique constraint violation for email
    if (error.code === '23505') {
      logger.warn('User update failed - duplicate email', { email, userId: id })
      throw new ApiConflictError('This email is already in use by another account')
    }
    logger.error('Failed to update user', { error: error.message, userId: id })
    throw new ApiDatabaseError(error)
  }

  logger.info('User updated successfully in database', { 
    userId: id, 
    updatedFields: Object.keys(updateData) 
  })

  // If email was updated, also update in auth.users via admin API
  if (email !== undefined && email !== existingUser.email) {
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: email,
        email_confirm: true // Auto-confirm email change
      })

      if (authError) {
        logger.warn('Email update in auth.users failed', { 
          error: authError.message, 
          userId: id,
          newEmail: email 
        })
        // Continue - public.users was updated successfully
      } else {
        logger.info('Email updated in auth.users successfully', { userId: id, newEmail: email })
      }
    } catch (err: any) {
      logger.warn('Email update in auth.users threw error', { 
        error: err.message || err,
        userId: id 
      })
      // Continue - public.users was updated successfully
    }
  }

  logger.info('User updated successfully', { userId: id, updatedBy: req.user?.id, updatedFields: Object.keys(updateData) })

  return res.json({
    message: 'User updated successfully',
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
 * Delete user by ID (admin function)
 * Permanently deletes from auth.users which cascades to public.users
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Verify user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    logger.error('Failed to fetch user for deletion', { 
      error: fetchError.message,
      userId: id 
    })
    throw new ApiNotFoundError('User not found')
  }

  if (!existingUser) {
    logger.warn('User not found for deletion', { userId: id })
    throw new ApiNotFoundError('User not found')
  }

  logger.info('Deleting user', { userId: id, deletedBy: req.user?.id })

  // Step 1: Delete from public.users first (this will SET NULL on all FK references)
  const { error: publicDeleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (publicDeleteError) {
    logger.error('Failed to delete user from public.users', { 
      error: publicDeleteError.message,
      code: publicDeleteError.code,
      details: publicDeleteError.details,
      userId: id 
    })
    throw new InternalServerError('Failed to delete user from database')
  }

  logger.info('Deleted user from public.users, now deleting from auth', { userId: id })

  // Step 2: Delete from auth.users
  const { error: authError } = await supabase.auth.admin.deleteUser(id)

  if (authError) {
    logger.error('Failed to delete user from auth.users', { 
      error: authError.message,
      errorName: authError.name,
      errorStatus: (authError as any).status,
      errorCode: (authError as any).code,
      userId: id 
    })
    // Note: public.users already deleted, so partial success
    // In production, consider implementing a cleanup job
    throw new InternalServerError('User partially deleted - removed from database but auth record remains')
  }

  logger.info('User deleted successfully', { userId: id, deletedBy: req.user?.id })

  return res.json({
    message: 'User deleted successfully'
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
