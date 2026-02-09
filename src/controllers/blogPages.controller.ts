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

const validStatuses = ['draft', 'review', 'scheduled', 'published', 'archived']

/**
 * Get all blog posts with basic metadata and author information
 */
export const getAllBlogPosts = asyncHandler(async (_req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      status,
      excerpt,
      featured_image,
      tags,
      category,
      meta_data,
      published,
      published_at,
      scheduled_at,
      view_count,
      reading_time_minutes,
      created_at,
      updated_at,
      version,
      author_id,
      last_modified_by,
      users:author_id(id, email, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch blog posts', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  const postsWithAuthor = posts?.map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
    tags: post.tags,
    category: post.category,
    meta_data: post.meta_data,
    published: post.published,
    published_at: post.published_at,
    scheduled_at: post.scheduled_at,
    view_count: post.view_count,
    reading_time_minutes: post.reading_time_minutes,
    created_at: post.created_at,
    updated_at: post.updated_at,
    version: post.version,
    author_id: post.author_id,
    last_modified_by: post.last_modified_by,
    author_name: post.users?.full_name || 'Unknown',
    author_email: post.users?.email || null
  })) || []

  return res.json({
    posts: postsWithAuthor,
    total: postsWithAuthor.length
  })
})

/**
 * Get blog post by slug with full dataset
 */
export const getBlogPostBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Blog post slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      users:author_id(id, email, full_name)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Blog post not found')
    }
    logger.error('Failed to fetch blog post by slug', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug
    })
    throw new ApiDatabaseError(error)
  }

  return res.json({
    post: {
      ...post,
      author_name: post.users?.full_name || 'Unknown',
      author_email: post.users?.email || null
    }
  })
})

/**
 * Create a new blog post
 */
export const createBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const {
    title,
    slug,
    content,
    excerpt,
    featured_image,
    tags,
    meta_data,
    status,
    category,
    reading_time_minutes,
    scheduled_at
  } = req.body

  if (!title || !slug || !content) {
    throw new BadRequestError('Missing required fields: title, slug, and content are required')
  }

  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    )
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const resolvedStatus = status || 'draft'
  const isPublished = resolvedStatus === 'published'

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image: featured_image || null,
      tags: tags || null,
      meta_data: meta_data || null,
      status: resolvedStatus,
      published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_id: userId,
      last_modified_by: userId,
      category: category || null,
      reading_time_minutes: reading_time_minutes || null,
      scheduled_at: scheduled_at || null
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Blog post creation failed - duplicate slug', { slug, userId })
      throw new ApiConflictError('A blog post with this slug already exists. Please use a different slug.')
    }

    if (error.code === '23503') {
      logger.error('Blog post creation failed - invalid user reference', {
        error: error.message,
        userId
      })
      throw new BadRequestError('Invalid user ID: user does not exist')
    }

    if (error.code === '22P02' || error.code === '23514') {
      logger.error('Blog post creation failed - invalid input', {
        error: error.message,
        details: error.details,
        slug,
        userId
      })
      throw new BadRequestError(`Invalid input data: ${error.message}`)
    }

    logger.error('Blog post creation failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Blog post created successfully', { postId: post.id, slug, userId })

  return res.status(201).json({
    message: 'Blog post created successfully',
    post
  })
})

/**
 * Update a blog post by slug
 */
export const updateBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params
  const {
    title,
    slug: newSlug,
    content,
    excerpt,
    featured_image,
    tags,
    meta_data,
    status,
    category,
    reading_time_minutes,
    scheduled_at
  } = req.body

  if (!slug) {
    throw new BadRequestError('Blog post slug is required')
  }

  if (!title && !newSlug && !content && !excerpt && !featured_image && !tags && !meta_data && !status && !category && !reading_time_minutes && !scheduled_at) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    )
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const updateData: any = {
    last_modified_by: userId,
    updated_at: new Date().toISOString()
  }

  if (title !== undefined) updateData.title = title
  if (newSlug !== undefined) updateData.slug = newSlug
  if (content !== undefined) updateData.content = content
  if (excerpt !== undefined) updateData.excerpt = excerpt
  if (featured_image !== undefined) updateData.featured_image = featured_image
  if (tags !== undefined) updateData.tags = tags
  if (meta_data !== undefined) updateData.meta_data = meta_data
  if (status !== undefined) {
    updateData.status = status
    updateData.published = status === 'published'
    updateData.published_at = status === 'published' ? new Date().toISOString() : null
  }
  if (category !== undefined) updateData.category = category
  if (reading_time_minutes !== undefined) updateData.reading_time_minutes = reading_time_minutes
  if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at

  const { data: post, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      logger.warn('Blog post update failed - duplicate slug', { slug: newSlug, currentSlug: slug, userId })
      throw new ApiConflictError('A blog post with this slug already exists. Please use a different slug.')
    }

    if (error.code === 'PGRST116') {
      logger.warn('Blog post update failed - not found', { slug, userId })
      throw new ApiNotFoundError('Blog post not found')
    }

    if (error.code === '22P02' || error.code === '23514') {
      logger.error('Blog post update failed - invalid input', {
        error: error.message,
        details: error.details,
        slug,
        userId
      })
      throw new BadRequestError(`Invalid input data: ${error.message}`)
    }

    logger.error('Blog post update failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug,
      userId
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Blog post updated successfully', { postId: post.id, slug, userId })

  return res.json({
    message: 'Blog post updated successfully',
    post
  })
})

/**
 * Delete blog post by slug
 */
export const deleteBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Blog post slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (fetchError || !post) {
    logger.warn('Blog post delete failed - not found', { slug, userId })
    throw new ApiNotFoundError('Blog post not found')
  }

  const { error: deleteError } = await supabase
    .from('blog_posts')
    .delete()
    .eq('slug', slug)

  if (deleteError) {
    logger.error('Delete blog post failed - database error', {
      error: deleteError.message,
      code: deleteError.code,
      details: deleteError.details,
      slug,
      userId
    })
    throw new ApiDatabaseError(deleteError)
  }

  logger.warn('Blog post deleted', { postId: post.id, slug: post.slug, deletedBy: userId })

  return res.json({
    message: 'Blog post deleted successfully',
    deleted_post: {
      id: post.id,
      title: post.title,
      slug: post.slug
    }
  })
})

/**
 * Get blog post version history by slug
 */
export const getBlogPostHistory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Blog post slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (postError || !post) {
    logger.warn('Blog post not found for history', { slug })
    throw new ApiNotFoundError('Blog post not found')
  }

  const { data: history, error } = await supabase
    .from('content_history')
    .select(`
      version,
      title,
      status,
      created_at,
      changed_by,
      change_summary,
      users!content_history_changed_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('table_name', 'blog_posts')
    .eq('record_id', post.id)
    .order('version', { ascending: false })

  if (error) {
    logger.error('Fetch blog post history failed - database error', {
      error: error.message,
      code: error.code,
      details: error.details,
      slug
    })
    throw new ApiDatabaseError(error)
  }

  const historyWithUser = (history || []).map((h: any) => ({
    version: h.version,
    title: h.title,
    status: h.status,
    created_at: h.created_at,
    change_summary: h.change_summary,
    changed_by_name: h.users?.full_name || 'Unknown',
    changed_by_email: h.users?.email || null
  }))

  return res.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug
    },
    history: historyWithUser
  })
})

/**
 * Restore a previous blog post version by slug
 */
export const restoreBlogPostVersion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug, version } = req.params

  if (!slug || !version) {
    throw new BadRequestError('Blog post slug and version are required')
  }

  if (isNaN(parseInt(version))) {
    throw new BadRequestError('Version must be a valid number')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (postError || !post) {
    logger.warn('Blog post not found for restore', { slug })
    throw new ApiNotFoundError('Blog post not found')
  }

  const { data: historyRecord, error: historyError } = await supabase
    .from('content_history')
    .select('*')
    .eq('table_name', 'blog_posts')
    .eq('record_id', post.id)
    .eq('version', parseInt(version))
    .single()

  if (historyError || !historyRecord) {
    logger.warn('Version not found for restore', { slug, version })
    throw new ApiNotFoundError(`Version ${version} not found for this blog post`)
  }

  const { error: restoreError } = await supabase
    .rpc('restore_content_version', {
      p_table_name: 'blog_posts',
      p_record_id: post.id,
      p_version: parseInt(version),
      p_restored_by: userId
    })

  if (restoreError) {
    logger.error('Restore blog post version failed - database error', {
      error: restoreError.message,
      code: restoreError.code,
      details: restoreError.details,
      slug,
      version
    })
    throw new ApiDatabaseError(restoreError)
  }

  const { data: updatedPost, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (fetchError || !updatedPost) {
    logger.error('Fetch restored blog post failed - database error', {
      error: fetchError?.message,
      code: fetchError?.code,
      slug
    })
    throw new ApiDatabaseError(fetchError || new Error('Failed to fetch restored blog post'))
  }

  return res.json({
    message: `Blog post successfully restored to version ${version}`,
    post: updatedPost
  })
})
