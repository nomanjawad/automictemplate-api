import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger } from '../utils/index.js'

/**
 * Register a new user using Supabase Auth
 * Uses signUp which allows public registration
 * Supabase enforces unique email constraint
 */
export async function register(req: Request, res: Response) {
  const { email, password, full_name } = req.body

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured - check environment variables')
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || null
        }
      }
    })

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        logger.warn('Registration attempted with existing email', { email })
        return res.status(409).json({ error: 'Email already registered. Please login instead.' })
      }

      logger.error('Registration error', { error: error.message, email })
      return res.status(400).json({ error: error.message })
    }

    // Check if user was actually created
    if (!data.user) {
      logger.warn('Registration succeeded but no user returned', { email })
      return res.status(201).json({
        message: 'Registration successful. Please check your email to confirm your account.',
        requiresEmailConfirmation: true
      })
    }

    // IMPORTANT: Supabase returns success for duplicate emails to prevent email enumeration
    // When email is duplicate: data.user exists BUT data.session is null
    // and user.identities will be empty OR user was not newly created

    // Check if it's a duplicate email (no identities means user already exists)
    if (data.user.identities && data.user.identities.length === 0) {
      logger.warn('Registration attempted with existing email (no identities)', {
        email,
        hasSession: !!data.session,
        identitiesCount: 0
      })
      return res.status(409).json({ error: 'Email already registered. Please login instead.' })
    }

    // If no session but user has identities, email confirmation is required
    if (!data.session && data.user.identities && data.user.identities.length > 0) {
      logger.info('User registered successfully - email confirmation required', { userId: data.user.id, email })
      return res.status(201).json({
        message: 'Registration successful. Please check your email to confirm your account.',
        requiresEmailConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email
        }
      })
    }

    logger.info('User registered successfully', { userId: data.user.id, email })

    return res.status(201).json({
      message: 'User registered successfully',
      user: data.user,
      session: data.session
    })
  } catch (err: any) {
    logger.error('Registration failed', { error: err.message || err, email })
    return res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
}

/**
 * Login user with email and password
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured - check environment variables')
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      logger.error('Login error', { error: error.message })
      return res.status(401).json({ error: error.message })
    }

    return res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    })
  } catch (err: any) {
    logger.error('Login failed', { error: err.message || err })
    return res.status(500).json({ error: 'Login failed. Please try again.' })
  }
}

/**
 * Logout user (sign out from Supabase Auth)
 */
export async function logout(_req: Request, res: Response) {
  if (!supabase) {
    logger.error('Supabase client not configured - check environment variables')
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Logout error', { error: error.message })
      return res.status(400).json({ error: error.message })
    }

    return res.json({ message: 'Logout successful' })
  } catch (err: any) {
    logger.error('Logout failed', { error: err.message || err })
    return res.status(500).json({ error: 'Logout failed. Please try again.' })
  }
}

/**
 * Get current user profile (JWT protected endpoint)
 * Demonstrates JWT authentication in action
 */
export async function getProfile(req: Request, res: Response) {
  try {
    // User is attached by requireAuth middleware after JWT verification
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at
      }
    })
  } catch (err: any) {
    logger.error('Get profile failed', { error: err.message || err })
    return res.status(500).json({ error: 'Failed to retrieve profile' })
  }
}

/**
 * Verify JWT token authentication
 * GET endpoint that verifies if the provided JWT token is valid
 * Uses Supabase's native JWT verification via getUser()
 *
 * @returns { authenticated: boolean, user?: object }
 */
export async function verifyToken(req: Request, res: Response) {
  try {
    // User is already verified by requireAuth middleware
    const user = req.user

    if (!user) {
      return res.json({
        authenticated: false,
        message: 'No valid token provided'
      })
    }

    logger.info('Token verification successful', { userId: user.id })

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        created_at: user.created_at
      }
    })
  } catch (err: any) {
    logger.error('Token verification failed', { error: err.message || err })
    return res.json({
      authenticated: false,
      message: 'Token verification failed'
    })
  }
}
