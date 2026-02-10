import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import {
  logger,
  asyncHandler,
  ApiDatabaseError,
  ApiNotFoundError,
  BadRequestError,
  ApiUnauthorizedError,
  ApiConflictError,
  InternalServerError
} from '../utils/index.js'

/**
 * Get all blog categories
 */
export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: categories, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to fetch categories', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    categories: categories || [],
    total: (categories || []).length
  })
})

/**
 * Get category by slug
 */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Category slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: category, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Category not found')
    }
    logger.error('Failed to fetch category', { error: error.message, slug })
    throw new ApiDatabaseError(error)
  }

  return res.json({ category })
})

/**
 * Create a new blog category
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { name, slug, description } = req.body

  if (!name || !slug) {
    throw new BadRequestError('Missing required fields: name and slug are required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: category, error } = await supabase
    .from('blog_categories')
    .insert({
      name,
      slug,
      description: description || null
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Category creation failed - duplicate name or slug', { name, slug, userId })
      throw new ApiConflictError('Category with this name or slug already exists')
    }

    logger.error('Category creation failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Category created successfully', { categoryId: category.id, slug, userId })

  return res.status(201).json({
    message: 'Category created successfully',
    category
  })
})

/**
 * Update a blog category
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params
  const { name, slug: newSlug, description } = req.body

  if (!slug) {
    throw new BadRequestError('Category slug is required')
  }

  if (!name && !newSlug && description === undefined) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (newSlug !== undefined) updateData.slug = newSlug
  if (description !== undefined) updateData.description = description

  const { data: category, error } = await supabase
    .from('blog_categories')
    .update(updateData)
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Category update failed - duplicate name or slug', { slug: newSlug, currentSlug: slug, userId })
      throw new ApiConflictError('Category with this name or slug already exists')
    }

    if (error.code === 'PGRST116') {
      logger.warn('Category update failed - not found', { slug, userId })
      throw new ApiNotFoundError('Category not found')
    }

    logger.error('Category update failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Category updated successfully', { categoryId: category.id, slug, userId })

  return res.json({
    message: 'Category updated successfully',
    category
  })
})

/**
 * Delete a blog category
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Category slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: category, error: fetchError } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (fetchError || !category) {
    logger.warn('Category delete failed - not found', { slug, userId })
    throw new ApiNotFoundError('Category not found')
  }

  const { error: deleteError } = await supabase
    .from('blog_categories')
    .delete()
    .eq('slug', slug)

  if (deleteError) {
    logger.error('Delete category failed - database error', {
      error: deleteError.message,
      code: deleteError.code,
      details: deleteError.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(deleteError)
  }

  logger.warn('Category deleted', { categoryId: category.id, slug: category.slug, deletedBy: userId })

  return res.json({
    message: 'Category deleted successfully',
    deleted_category: {
      id: category.id,
      name: category.name,
      slug: category.slug
    }
  })
})

/**
 * Get all blog tags
 */
export const getAllTags = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: tags, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    logger.error('Failed to fetch tags', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    tags: tags || [],
    total: (tags || []).length
  })
})

/**
 * Get tag by slug
 */
export const getTagBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Tag slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: tag, error } = await supabase
    .from('blog_tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Tag not found')
    }
    logger.error('Failed to fetch tag', { error: error.message, slug })
    throw new ApiDatabaseError(error)
  }

  return res.json({ tag })
})

/**
 * Create a new blog tag
 */
export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { name, slug } = req.body

  if (!name || !slug) {
    throw new BadRequestError('Missing required fields: name and slug are required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: tag, error } = await supabase
    .from('blog_tags')
    .insert({
      name,
      slug
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Tag creation failed - duplicate name or slug', { name, slug, userId })
      throw new ApiConflictError('Tag with this name or slug already exists')
    }

    logger.error('Tag creation failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Tag created successfully', { tagId: tag.id, slug, userId })

  return res.status(201).json({
    message: 'Tag created successfully',
    tag
  })
})

/**
 * Update a blog tag
 */
export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params
  const { name, slug: newSlug } = req.body

  if (!slug) {
    throw new BadRequestError('Tag slug is required')
  }

  if (!name && !newSlug) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (newSlug !== undefined) updateData.slug = newSlug

  const { data: tag, error } = await supabase
    .from('blog_tags')
    .update(updateData)
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Tag update failed - duplicate name or slug', { slug: newSlug, currentSlug: slug, userId })
      throw new ApiConflictError('Tag with this name or slug already exists')
    }

    if (error.code === 'PGRST116') {
      logger.warn('Tag update failed - not found', { slug, userId })
      throw new ApiNotFoundError('Tag not found')
    }

    logger.error('Tag update failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Tag updated successfully', { tagId: tag.id, slug, userId })

  return res.json({
    message: 'Tag updated successfully',
    tag
  })
})

/**
 * Delete a blog tag
 */
export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Tag slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: tag, error: fetchError } = await supabase
    .from('blog_tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (fetchError || !tag) {
    logger.warn('Tag delete failed - not found', { slug, userId })
    throw new ApiNotFoundError('Tag not found')
  }

  const { error: deleteError } = await supabase
    .from('blog_tags')
    .delete()
    .eq('slug', slug)

  if (deleteError) {
    logger.error('Delete tag failed - database error', {
      error: deleteError.message,
      code: deleteError.code,
      details: deleteError.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(deleteError)
  }

  logger.warn('Tag deleted', { tagId: tag.id, slug: tag.slug, deletedBy: userId })

  return res.json({
    message: 'Tag deleted successfully',
    deleted_tag: {
      id: tag.id,
      name: tag.name,
      slug: tag.slug
    }
  })
})
