import type { Request, Response, NextFunction } from 'express'
import { supabaseClient } from '../db/supabaseClient.js'
import { logger } from '../utils/index.js'

/**
 * JWT Authentication Middleware using Supabase
 * Verifies the JWT token from Authorization header
 * Token is validated by Supabase and user data is attached to request
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const token = header.split(' ')[1]

    if (!supabaseClient) {
      logger.error('Supabase client not configured')
      return res.status(500).json({ error: 'Authentication service unavailable' })
    }

    // Verify JWT token with Supabase
    const { data, error } = await supabaseClient.auth.getUser(token)

    if (error || !data?.user) {
      logger.error('JWT verification failed', { error: error?.message })
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Fetch user profile with role from public.users
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', data.user.id)
      .single()

    // Attach user to request object
    req.user = data.user
    req.userProfile = userProfile || null

    next()
  } catch (err: any) {
    logger.error('Auth middleware error', { error: err.message || err })
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Attaches user if token is valid, otherwise continues without user
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization

    if (!header?.startsWith('Bearer ') || !supabaseClient) {
      return next()
    }

    const token = header.split(' ')[1]
    const { data } = await supabaseClient.auth.getUser(token)

    if (data?.user) {
      req.user = data.user

      // Fetch user profile with role
      const { data: userProfile } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', data.user.id)
        .single()

      req.userProfile = userProfile || null
    }

    next()
  } catch (err) {
    // Silently fail and continue without user
    next()
  }
}

/**
 * Role-Based Access Control Middleware
 * Restricts endpoint access based on user role
 * Usage: app.get('/admin', requireRole('admin'), controller)
 */
export function requireRole(requiredRole: 'admin' | 'moderator' | 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Must have auth first
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const userRole = req.userProfile?.role || 'user'

      // Role hierarchy: admin > moderator > user
      const roleHierarchy: Record<string, number> = {
        admin: 3,
        moderator: 2,
        user: 1
      }

      const userRoleLevel = roleHierarchy[userRole] || 1
      const requiredRoleLevel = roleHierarchy[requiredRole] || 1

      if (userRoleLevel < requiredRoleLevel) {
        logger.warn('Access denied - insufficient role', {
          userId: req.user.id,
          userRole,
          requiredRole,
          endpoint: req.path
        })
        return res.status(403).json({
          error: `This action requires ${requiredRole} privileges`,
          code: 'INSUFFICIENT_ROLE'
        })
      }

      next()
    } catch (err: any) {
      logger.error('Role check middleware error', { error: err.message || err })
      return res.status(500).json({ error: 'Authorization check failed' })
    }
  }
}
