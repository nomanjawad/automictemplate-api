/**
 * @module controllers/content
 * @description Content controller using repository pattern
 */

import { Request, Response, NextFunction } from 'express'
import { CommonContentRepository, PageContentRepository } from '../repositories/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

const commonRepo = new CommonContentRepository()
const pageRepo = new PageContentRepository()

// ============================================================================
// Common Content Operations (header, footer, CTA, banner, etc.)
// ============================================================================

/**
 * Get all common content
 * GET /api/content/common
 */
export async function listCommonContent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await commonRepo.findAll()

    return res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/**
 * Get common content by key
 * GET /api/content/common/:key
 */
export async function getCommonContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params

    const data = await commonRepo.findByKey(key)

    if (!data) {
      throw new NotFoundError(`Common content with key "${key}" not found`)
    }

    return res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/**
 * Create or update common content by key
 * PUT /api/content/common/:key
 * Body: { data: {...} }
 */
export async function upsertCommonContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params
    const { data: contentData } = req.body

    if (!contentData || typeof contentData !== 'object') {
      throw new ValidationError('Invalid content data. Expected object in "data" field.')
    }

    const data = await commonRepo.upsert({ key, data: contentData })

    return res.json({
      success: true,
      message: 'Common content saved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete common content by key
 * DELETE /api/content/common/:key
 */
export async function deleteCommonContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params

    await commonRepo.deleteByKey(key)

    return res.json({
      success: true,
      message: 'Common content deleted successfully'
    })
  } catch (err) {
    next(err)
  }
}

// ============================================================================
// Page Content Operations (home, about, contact, gallery, etc.)
// ============================================================================

/**
 * Get all pages
 * GET /api/content/pages
 * Query params: ?published=true (filter by published status)
 */
export async function listPages(req: Request, res: Response, next: NextFunction) {
  try {
    const { published } = req.query
    const user = req.user

    // Non-authenticated users can only see published pages
    const data = published === 'true' || !user
      ? await pageRepo.findPublished()
      : await pageRepo.findAll()

    return res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/**
 * Get page by slug
 * GET /api/content/pages/:slug
 */
export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const user = req.user

    const page = await pageRepo.findBySlug(slug)

    if (!page) {
      throw new NotFoundError(`Page "${slug}" not found`)
    }

    // Non-authenticated users can only see published pages
    if (!user && !page.published) {
      throw new NotFoundError(`Page "${slug}" not found`)
    }

    return res.json({ success: true, data: page })
  } catch (err) {
    next(err)
  }
}

/**
 * Create or update page by slug
 * PUT /api/content/pages/:slug
 * Body: { title, data, meta_data?, published? }
 */
export async function upsertPage(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const { title, data: pageData, meta_data, published } = req.body

    if (!title) {
      throw new ValidationError('Page title is required')
    }

    if (!pageData || typeof pageData !== 'object') {
      throw new ValidationError('Invalid page data. Expected object in "data" field.')
    }

    const data = await pageRepo.upsert({
      slug,
      title,
      data: pageData,
      meta_data,
      published
    })

    return res.json({
      success: true,
      message: 'Page saved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete page by slug
 * DELETE /api/content/pages/:slug
 */
export async function deletePage(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params

    await pageRepo.deleteBySlug(slug)

    return res.json({
      success: true,
      message: 'Page deleted successfully'
    })
  } catch (err) {
    next(err)
  }
}
