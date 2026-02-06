import { Router } from 'express'
import {
  register,
  login,
  logout,
  getProfile
} from '@controllers'
import {
  getAllUsers,
  getUserByEmail,
  updateProfile,
  updateUser,
  deleteUser,
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
 * Body: { full_name?, bio?, avatar_url?, metadata? }
 */
router.put('/profile', requireAuth, updateProfile)

/**
 * GET /api/user/session
 * Check if current session is active
 * Returns: { active: boolean, session?, user? }
 */
router.get('/session', requireAuth, checkSession)

/**
 * GET /api/user
 * Get all users (no pagination, no filtering)
 * Dashboard will handle sorting/filtering
 */
router.get('/', requireAuth, getAllUsers)

/**
 * GET /api/user/email/:email
 * Get user by email address
 * Used for profile pages in dashboard
 */
router.get('/email/:email', requireAuth, getUserByEmail)

/**
 * PUT /api/user/:id
 * Update any user by ID
 * Body: { full_name?, bio?, avatar_url?, role?, metadata? }
 * Dashboard uses this to update any user
 */
router.put('/:id', requireAuth, updateUser)

/**
 * DELETE /api/user/:id
 * Delete user by ID
 * Deletes from both auth.users and public.users (cascade)
 */
router.delete('/:id', requireAuth, deleteUser)

export default router
