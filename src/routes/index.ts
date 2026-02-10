import { Router } from 'express'
import authRouter from './auth/index.js'
import blogRouter from './blog/index.js'
import adminRouter from './admin/index.js'
import contentRouter from './content/index.js'
import uploadRouter from './upload/index.js'
import userRouter from './user/index.js'
import pagesRouter from './pages/index.js'
import blogPagesRouter from './blog-pages/index.js'
import customCodesRouter from './custom-codes/index.js'
import { categoriesRouter, tagsRouter } from './blog-categories-tags/index.js'

const router = Router()

// User routes (unified auth + user management)
router.use('/user', userRouter)

// Legacy authentication routes (kept for backwards compatibility)
router.use('/auth', authRouter)

// Content management routes
router.use('/content', contentRouter)
router.use('/pages', pagesRouter)
router.use('/blog', blogRouter)
router.use('/blog-pages', blogPagesRouter)

// Self-sustaining Categories and Tags (usable across all content types)
router.use('/categories', categoriesRouter)
router.use('/tags', tagsRouter)

// Custom Codes (analytics, meta tags, tracking, etc.)
router.use('/custom-codes', customCodesRouter)

// Upload routes
router.use('/upload', uploadRouter)

// Admin routes
router.use('/admin', adminRouter)

export default router
