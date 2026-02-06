import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger } from '../utils/index.js'

/**
 * Get all users from the database
 * No pagination, no filtering - returns ALL users
 * Dashboard will handle sorting/filtering
 */
export async function getAllUsers(req: Request, res: Response) {
  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Get all users from public.users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch users', { error: error.message })
      return res.status(500).json({ error: 'Failed to fetch users' })
    }

    logger.info('Fetched all users', { count: users?.length || 0 })

    return res.json({
      users: users || [],
      total: users?.length || 0
    })
  } catch (err: any) {
    logger.error('Get all users failed', { error: err.message || err })
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

/**
 * Get user by email
 * Used for profile pages in the dashboard
 */
export async function getUserByEmail(req: Request, res: Response) {
  const { email } = req.params

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Get user from public.users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) {
      logger.error('Failed to fetch user by email', { error: error.message, email })
      return res.status(500).json({ error: 'Failed to fetch user' })
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    logger.info('Fetched user by email', { email })

    return res.json({
      user: users[0]
    })
  } catch (err: any) {
    logger.error('Get user by email failed', { error: err.message || err, email })
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

/**
 * Update own profile (authenticated user)
 * Updates: full_name, bio, avatar_url, metadata
 */
export async function updateProfile(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' })
  }

  const { full_name, bio, avatar_url, metadata } = req.body

  // Validate at least one field is being updated
  if (!full_name && !bio && !avatar_url && !metadata) {
    return res.status(400).json({ error: 'At least one field must be provided for update' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
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
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    logger.info('Profile updated successfully', { userId })

    return res.json({
      message: 'Profile updated successfully',
      user
    })
  } catch (err: any) {
    logger.error('Update profile failed', { error: err.message || err, userId })
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}

/**
 * Update any user by ID
 * Dashboard uses this to update any user
 * Can update: full_name, bio, avatar_url, role, metadata
 */
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params
  const { full_name, bio, avatar_url, role, metadata } = req.body

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  // Validate at least one field is being updated
  if (!full_name && !bio && !avatar_url && !role && !metadata) {
    return res.status(400).json({ error: 'At least one field must be provided for update' })
  }

  // Validate role if provided
  if (role && !['user', 'admin', 'moderator'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be: user, admin, or moderator' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Build update object with only provided fields
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (role !== undefined) updateData.role = role
    if (metadata !== undefined) updateData.metadata = metadata

    // Update user in public.users table
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update user', { error: error.message, userId: id })
      return res.status(500).json({ error: 'Failed to update user' })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    logger.info('User updated successfully', { userId: id, updatedBy: req.user?.id })

    return res.json({
      message: 'User updated successfully',
      user
    })
  } catch (err: any) {
    logger.error('Update user failed', { error: err.message || err, userId: id })
    return res.status(500).json({ error: 'Failed to update user' })
  }
}

/**
 * Delete user by ID
 * This will delete from both auth.users and public.users (cascade)
 */
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // First get user info before deletion
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete from auth.users (this will cascade to public.users)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      logger.error('Failed to delete user', { error: deleteError.message, userId: id })
      return res.status(500).json({ error: 'Failed to delete user' })
    }

    logger.warn('User deleted', { userId: id, email: user.email, deletedBy: req.user?.id })

    return res.json({
      message: 'User deleted successfully',
      deleted_user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    })
  } catch (err: any) {
    logger.error('Delete user failed', { error: err.message || err, userId: id })
    return res.status(500).json({ error: 'Failed to delete user' })
  }
}

/**
 * Check if session is active
 * Returns boolean and session details
 */
export async function checkSession(req: Request, res: Response) {
  const user = req.user

  if (!user) {
    return res.json({
      active: false,
      message: 'No active session'
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    // Get the token from the request header
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.json({
        active: false,
        message: 'No token provided'
      })
    }

    // Verify token with Supabase
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      logger.info('Session check failed', { userId: user.id })
      return res.json({
        active: false,
        message: 'Session expired or invalid'
      })
    }

    logger.info('Session check successful', { userId: user.id })

    return res.json({
      active: true,
      session: {
        user_id: user.id,
        email: user.email,
        expires_at: session.expires_at
      },
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        role: user.user_metadata?.role || 'user'
      }
    })
  } catch (err: any) {
    logger.error('Session check failed', { error: err.message || err })
    return res.json({
      active: false,
      message: 'Session check failed'
    })
  }
}
