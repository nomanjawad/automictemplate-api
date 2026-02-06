import { Router } from 'express'
import authRouter from './auth/index.js'
import blogRouter from './blog/index.js'
import adminRouter from './admin/index.js'
import contentRouter from './content/index.js'
import uploadRouter from './upload/index.js'
import userRouter from './user/index.js'
import pagesRouter from './pages/index.js'

const router = Router()

// User routes (unified auth + user management)
router.use('/user', userRouter)

// Legacy authentication routes (kept for backwards compatibility)
router.use('/auth', authRouter)

// Content management routes
router.use('/content', contentRouter)
router.use('/pages', pagesRouter)
router.use('/blog', blogRouter)

// Upload routes
router.use('/upload', uploadRouter)

// Admin routes
router.use('/admin', adminRouter)

export default router
