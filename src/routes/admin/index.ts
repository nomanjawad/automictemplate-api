import { Router } from 'express'
import { adminStatus } from '../../controllers/admin.controller.js'

const router = Router()

router.get('/status', adminStatus)

export default router
