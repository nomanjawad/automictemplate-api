/**
 * @module controllers/blog
 * @description Blog controller using repository pattern
 */

import type { Request, Response, NextFunction } from 'express'
import { BlogRepository } from '../repositories/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { BlogPostSchema } from '@atomictemplate/validations'

const blogRepo = new BlogRepository()

/**
 * List all blog posts
 * GET /api/blog
 * Query params: ?published=true, ?limit=10, ?offset=0
 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { published, limit = '10', offset = '0' } = req.query
    const user = req.user

    // Non-authenticated users can only see published posts
    const publishedOnly = !user || published === 'true'

    const result = await blogRepo.findWithPagination(
      Number(limit),
      Number(offset),
      publishedOnly
    )

    return res.json({
      success: true,
      data: result.data,
      count: result.count,
      limit: Number(limit),
      offset: Number(offset)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get single blog post by slug
 * GET /api/blog/:slug
 */
export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const user = req.user

    const post = await blogRepo.findBySlug(slug)

    if (!post) {
      throw new NotFoundError('Blog post not found')
    }

    // Non-authenticated users can only see published posts
    if (!user && !post.published) {
      throw new NotFoundError('Blog post not found')
    }

    // Validate response to ensure it matches schema
    const validated = BlogPostSchema.parse(post)

    return res.json({ success: true, data: validated })
  } catch (err) {
    next(err)
  }
}

/**
 * Create new blog post
 * POST /api/blog
 * Body: { slug, title, excerpt?, content, featured_image?, tags?, meta_data?, published? }
 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const { slug, title, excerpt, content, featured_image, tags, meta_data, published } = req.body

    if (!slug || !title || !content) {
      throw new ValidationError('slug, title, and content are required')
    }

    const post = await blogRepo.createPost({
      slug,
      title,
      excerpt,
      content,
      featured_image,
      author_id: user?.id,
      tags,
      meta_data,
      published
    })

    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Update blog post by slug
 * PUT /api/blog/:slug
 * Body: { title?, excerpt?, content?, featured_image?, tags?, meta_data?, published? }
 */
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const { title, excerpt, content, featured_image, tags, meta_data, published } = req.body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (featured_image !== undefined) updateData.featured_image = featured_image
    if (tags !== undefined) updateData.tags = tags
    if (meta_data !== undefined) updateData.meta_data = meta_data
    if (published !== undefined) updateData.published = published

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update')
    }

    const post = await blogRepo.updatePost(slug, updateData)

    if (!post) {
      throw new NotFoundError('Blog post not found')
    }

    return res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: post
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete blog post by slug
 * DELETE /api/blog/:slug
 */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params

    // Check if post exists
    const post = await blogRepo.findBySlug(slug)
    if (!post) {
      throw new NotFoundError('Blog post not found')
    }

    await blogRepo.deleteBySlug(slug)

    return res.json({
      success: true,
      message: 'Blog post deleted successfully'
    })
  } catch (err) {
    next(err)
  }
}
