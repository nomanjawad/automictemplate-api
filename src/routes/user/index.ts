import { Router } from 'express'
import {
  register,
  login,
  logout,
  getProfile
} from '@controllers'
import {
  getAllUsers,
  getAllUsersPublic,
  getUserById,
  updateProfile,
  updateUser,
  deleteProfile,
  checkSession
} from '@controllers'
import { requireAuth } from '@middleware'

const router = Router()

// ============================================================================
// Public Routes (No Authentication Required)
// ============================================================================

/**
 * POST /api/user/register
 * Register a new user
 */
router.post('/register', register)

/**
 * POST /api/user/login
 * Login user with email and password
 */
router.post('/login', login)

/**
 * GET /api/user/public/all
 * Get all users (limited fields: full_name, email, role, created_at)
 * No authentication required
 */
router.get('/public/all', getAllUsersPublic)

// ============================================================================
// Protected Routes (Authentication Required)
// ============================================================================

/**
 * POST /api/user/logout
 * Logout current user
 */
router.post('/logout', requireAuth, logout)

/**
 * GET /api/user/profile
 * Get current authenticated user's profile
 */
router.get('/profile', requireAuth, getProfile)

/**
 * PUT /api/user/profile
 * Update current authenticated user's profile
 * Body: { email?, full_name?, role?, bio?, avatar_url?, metadata? }
 */
router.put('/profile', requireAuth, updateProfile)

/**
 * DELETE /api/user/profile
 * Delete current authenticated user's account permanently
 * This deletes from auth.users which cascades to public.users
 */
router.delete('/profile', requireAuth, deleteProfile)

/**
 * GET /api/user/session
 * Check if current session is active
 * Returns: { session, user }
 */
router.get('/session', requireAuth, checkSession)

/**
 * GET /api/user
 * Get all users (full details)
 * Returns ALL user data - frontend handles visibility based on role
 */
router.get('/', requireAuth, getAllUsers)

/**
 * PUT /api/user/:id
 * Update any user by ID (for admin/moderator management)
 * Frontend controls which roles can access this
 * Body: { email?, full_name?, role?, bio?, avatar_url?, metadata? }
 */
router.put('/:id', requireAuth, updateUser)

/**
 * GET /api/user/:id
 * Get user by ID
 * Returns all user info including email, role, metadata
 * Frontend controls visibility based on user's role
 */
router.get('/:id', requireAuth, getUserById)

export default router
