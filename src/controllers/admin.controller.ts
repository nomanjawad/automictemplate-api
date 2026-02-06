/**
 * @module controllers/admin
 * @description Admin system status and configuration controller
 */

import type { Request, Response } from 'express'

/**
 * Get admin/system status
 * @param {Request} _req - Express request object
 * @param {Response} res - Express response object
 * @returns {Response} JSON response with system status
 * @example
 * // GET /api/admin/status
 * // Response: { status: 'operational', environment: 'development', ... }
 */
export function adminStatus(_req: Request, res: Response) {
  return res.json({
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ? 'configured' : 'missing'
    },
    timestamp: new Date().toISOString()
  })
}
