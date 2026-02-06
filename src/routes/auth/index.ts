import { Router } from 'express'
import { register, login, logout, getProfile, verifyToken } from '../../controllers/index.js'
import { requireAuth } from '../../middleware/index.js'

const router = Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

// Protected routes (require JWT)
router.get('/profile', requireAuth, getProfile)
router.get('/verify', requireAuth, verifyToken)

// Legacy alias for /profile
router.get('/me', requireAuth, getProfile)

export default router
