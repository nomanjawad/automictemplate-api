import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
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

// Multer configuration for blog image uploads
const storage = multer.memoryStorage()
const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error('Invalid file type. Only images are allowed.'))
  }
}

export const blogMediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
})

/**
 * Get all blog posts with basic metadata and author information
 * Supports filtering by category_id and tag_ids
 */
export const getAllBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const { category_id, tag_ids } = req.query

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  let query = supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      status,
      excerpt,
      featured_image,
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
      category_id,
      blog_categories!blog_posts_category_id_fkey(id, name, slug),
      blog_post_tags(tag_id),
      users:author_id(id, email, full_name)
    `)
    .order('created_at', { ascending: false })

  // Filter by category if provided
  if (category_id) {
    query = query.eq('category_id', category_id as string)
  }

  const { data: posts, error } = await query

  if (error) {
    logger.error('Failed to fetch blog posts', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  // Filter by tags if provided
  let filteredPosts = posts || []
  if (tag_ids) {
    const tagIdArray = (tag_ids as string).split(',')
    filteredPosts = filteredPosts.filter((post: any) => {
      const postTagIds = (post.blog_post_tags || []).map((r: any) => r.tag_id)
      return tagIdArray.some(tagId => postTagIds.includes(tagId))
    })
  }

  const postsWithData = filteredPosts.map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
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
    category_id: post.category_id,
    category: post.blog_categories || null,
    tag_ids: (post.blog_post_tags || []).map((r: any) => r.tag_id),
    author_name: post.users?.full_name || 'Unknown',
    author_email: post.users?.email || null
  }))

  return res.json({
    posts: postsWithData,
    total: postsWithData.length
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
      blog_categories!blog_posts_category_id_fkey(id, name, slug, description),
      blog_post_tags(tag_id),
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

  // Fetch full tag data
  let tags: any[] = []
  const tagIds = (post.blog_post_tags || []).map((r: any) => r.tag_id)
  if (tagIds.length > 0) {
    const { data: tagsData } = await supabase
      .from('blog_tags')
      .select('*')
      .in('id', tagIds)
    tags = tagsData || []
  }

  return res.json({
    post: {
      ...post,
      category: post.blog_categories || null,
      tags,
      tag_ids: tagIds,
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

  // Resolve category slug to category_id
  let categoryId: string | null = null
  if (category) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', category)
      .single()

    if (categoryError || !categoryData) {
      logger.warn('Category not found', { category, slug })
      throw new BadRequestError(`Category '${category}' not found. Please create it first.`)
    }
    categoryId = categoryData.id
  }

  // Resolve tag slugs to tag IDs
  let tagIds: string[] = []
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const { data: tagsData, error: tagsError } = await supabase
      .from('blog_tags')
      .select('id, slug')
      .in('slug', tags)

    if (tagsError) {
      logger.error('Failed to resolve tags', { error: tagsError.message, tags })
      throw new ApiDatabaseError(tagsError)
    }

    if (!tagsData || tagsData.length !== tags.length) {
      const foundSlugs = tagsData?.map((t: any) => t.slug) || []
      const missingSlugs = tags.filter((t: string) => !foundSlugs.includes(t))
      throw new BadRequestError(`Tags not found: ${missingSlugs.join(', ')}. Please create them first.`)
    }

    tagIds = tagsData.map((t: any) => t.id)
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
      meta_data: meta_data || null,
      status: resolvedStatus,
      published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_id: userId,
      last_modified_by: userId,
      category_id: categoryId,
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

  // Add tags if provided
  if (tagIds.length > 0) {
    const tagRecords = tagIds.map(tagId => ({
      blog_post_id: post.id,
      tag_id: tagId
    }))
    await supabase.from('blog_post_tags').insert(tagRecords)
  }

  logger.info('Blog post created successfully', { postId: post.id, slug, userId, category, tags: tags || [], tagCount: tagIds.length })

  return res.status(201).json({
    message: 'Blog post created successfully',
    post: {
      ...post,
      category: category || null,
      tags: tags || []
    }
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

  // Resolve category slug to category_id if provided
  let categoryId: string | null | undefined = undefined
  if (category !== undefined) {
    if (category === null || category === '') {
      categoryId = null
    } else {
      const { data: categoryData, error: categoryError } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (categoryError || !categoryData) {
        logger.warn('Category not found', { category, slug })
        throw new BadRequestError(`Category '${category}' not found. Please create it first.`)
      }
      categoryId = categoryData.id
    }
  }

  // Resolve tag slugs to tag IDs if provided
  let tagIds: string[] | undefined = undefined
  if (tags !== undefined) {
    if (tags.length === 0) {
      tagIds = []
    } else {
      const { data: tagsData, error: tagsError } = await supabase
        .from('blog_tags')
        .select('id, slug')
        .in('slug', tags)

      if (tagsError) {
        logger.error('Failed to resolve tags', { error: tagsError.message, tags })
        throw new ApiDatabaseError(tagsError)
      }

      if (!tagsData || tagsData.length !== tags.length) {
        const foundSlugs = tagsData?.map((t: any) => t.slug) || []
        const missingSlugs = tags.filter((t: string) => !foundSlugs.includes(t))
        throw new BadRequestError(`Tags not found: ${missingSlugs.join(', ')}. Please create them first.`)
      }

      tagIds = tagsData.map((t: any) => t.id)
    }
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
  if (meta_data !== undefined) updateData.meta_data = meta_data
  if (status !== undefined) {
    updateData.status = status
    updateData.published = status === 'published'
    updateData.published_at = status === 'published' ? new Date().toISOString() : null
  }
  if (categoryId !== undefined) updateData.category_id = categoryId
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

  // Update tags if provided
  if (tagIds !== undefined) {
    // Delete existing tags
    await supabase.from('blog_post_tags').delete().eq('blog_post_id', post.id)
    // Insert new tags
    if (tagIds.length > 0) {
      const tagRecords = tagIds.map(tagId => ({
        blog_post_id: post.id,
        tag_id: tagId
      }))
      await supabase.from('blog_post_tags').insert(tagRecords)
    }
  }

  logger.info('Blog post updated successfully', { postId: post.id, slug, userId, category, tags, tagsUpdated: tagIds !== undefined })

  return res.json({
    message: 'Blog post updated successfully',
    post: {
      ...post,
      category: category !== undefined ? category : undefined,
      tags: tags !== undefined ? tags : undefined
    }
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

/**
 * Get blog posts filtered by category slug
 */
export const getBlogPostsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Category slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // First, get the category by slug
  const { data: category, error: categoryError } = await supabase
    .from('blog_categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single()

  if (categoryError || !category) {
    logger.warn('Category not found for filtering', { slug })
    throw new ApiNotFoundError('Category not found')
  }

  // Get all posts with this category
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      status,
      excerpt,
      featured_image,
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
      category_id,
      blog_categories!blog_posts_category_id_fkey(id, name, slug),
      blog_post_tags(tag_id),
      users:author_id(id, email, full_name)
    `)
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch blog posts by category', { error: error.message, slug })
    throw new ApiDatabaseError(error)
  }

  const postsWithData = (posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
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
    category_id: post.category_id,
    category: post.blog_categories || null,
    tag_ids: (post.blog_post_tags || []).map((r: any) => r.tag_id),
    author_name: post.users?.full_name || 'Unknown',
    author_email: post.users?.email || null
  }))

  return res.json({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description
    },
    posts: postsWithData,
    total: postsWithData.length
  })
})

/**
 * Get blog posts filtered by tag slug
 */
export const getBlogPostsByTag = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Tag slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // First, get the tag by slug
  const { data: tag, error: tagError } = await supabase
    .from('blog_tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (tagError || !tag) {
    logger.warn('Tag not found for filtering', { slug })
    throw new ApiNotFoundError('Tag not found')
  }

  // Get all post IDs with this tag from junction table
  const { data: postTagRelations, error: relationError } = await supabase
    .from('blog_post_tags')
    .select('blog_post_id')
    .eq('tag_id', tag.id)

  if (relationError) {
    logger.error('Failed to fetch post-tag relations', { error: relationError.message, slug })
    throw new ApiDatabaseError(relationError)
  }

  if (!postTagRelations || postTagRelations.length === 0) {
    return res.json({
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      },
      posts: [],
      total: 0
    })
  }

  const postIds = postTagRelations.map((r: any) => r.blog_post_id)

  // Get all posts with these IDs
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      status,
      excerpt,
      featured_image,
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
      category_id,
      blog_categories!blog_posts_category_id_fkey(id, name, slug),
      blog_post_tags(tag_id),
      users:author_id(id, email, full_name)
    `)
    .in('id', postIds)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch blog posts by tag', { error: error.message, slug })
    throw new ApiDatabaseError(error)
  }

  const postsWithData = (posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
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
    category_id: post.category_id,
    category: post.blog_categories || null,
    tag_ids: (post.blog_post_tags || []).map((r: any) => r.tag_id),
    author_name: post.users?.full_name || 'Unknown',
    author_email: post.users?.email || null
  }))

  return res.json({
    tag: {
      id: tag.id,
      name: tag.name,
      slug: tag.slug
    },
    posts: postsWithData,
    total: postsWithData.length
  })
})

/**
 * Create blog post with image uploads
 * POST /api/blog-pages/create-with-images
 * Multipart form-data: featured_image, images[], title, slug, content, excerpt, status, category, tags
 */
export const createBlogPostWithImages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  const authorName = req.user?.user_metadata?.full_name || req.user?.email || 'Unknown'

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { title, slug, content, excerpt, status, category, tags } = req.body
  const featuredImageFile = (req.files as { [fieldname: string]: Express.Multer.File[] })['featured_image']?.[0]
  const extraImageFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })['images'] || []

  if (!title || !slug || !content) {
    throw new BadRequestError('Missing required fields: title, slug, and content are required')
  }

  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'images'

  // Upload and collect image URLs
  const uploadedImageUrls: string[] = []
  let featuredImageUrl: string | null = null

  // Upload featured image if provided
  if (featuredImageFile) {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(featuredImageFile.originalname)
    const filename = `blog/${timestamp}-${randomString}${ext}`

    const { data, error } = await supabase.storage.from(BUCKET).upload(filename, featuredImageFile.buffer, {
      contentType: featuredImageFile.mimetype,
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      logger.error('Failed to upload featured image', { error: error.message })
      throw new ApiDatabaseError(error)
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    featuredImageUrl = urlData.publicUrl

    // Insert media record
    await supabase.from('media').insert({
      title: `Featured image for ${title}`,
      type: 'blog',
      author_name: authorName,
      upload_date: new Date().toISOString(),
      path: data.path,
      url: featuredImageUrl,
      size: featuredImageFile.size,
      mime_type: featuredImageFile.mimetype
    })
  }

  // Upload extra images if provided
  for (const imageFile of extraImageFiles) {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(imageFile.originalname)
    const filename = `blog/${timestamp}-${randomString}${ext}`

    const { data, error } = await supabase.storage.from(BUCKET).upload(filename, imageFile.buffer, {
      contentType: imageFile.mimetype,
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      logger.error('Failed to upload extra image', { error: error.message })
      throw new ApiDatabaseError(error)
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    const imageUrl = urlData.publicUrl
    uploadedImageUrls.push(imageUrl)

    // Insert media record
    await supabase.from('media').insert({
      title: `Gallery image for ${title}`,
      type: 'blog',
      author_name: authorName,
      upload_date: new Date().toISOString(),
      path: data.path,
      url: imageUrl,
      size: imageFile.size,
      mime_type: imageFile.mimetype
    })
  }

  // Inject image URLs into content JSON
  let contentJson: any = {}
  if (typeof content === 'string') {
    try {
      contentJson = JSON.parse(content)
    } catch {
      contentJson = { blocks: [{ type: 'paragraph', text: content }] }
    }
  } else {
    contentJson = content
  }

  // Append gallery images as blocks if content is structured
  if (uploadedImageUrls.length > 0) {
    if (!contentJson.blocks) {
      contentJson.blocks = []
    }
    contentJson.blocks.push(
      ...uploadedImageUrls.map(url => ({
        type: 'image',
        url
      }))
    )
  }

  // Resolve category slug to category_id
  let categoryId: string | null = null
  if (category) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', category)
      .single()

    if (categoryError || !categoryData) {
      throw new BadRequestError(`Category '${category}' not found. Please create it first.`)
    }
    categoryId = categoryData.id
  }

  // Resolve tag slugs to tag IDs
  let tagIds: string[] = []
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const { data: tagsData, error: tagsError } = await supabase
      .from('blog_tags')
      .select('id, slug')
      .in('slug', tags)

    if (tagsError) {
      throw new ApiDatabaseError(tagsError)
    }

    if (!tagsData || tagsData.length !== tags.length) {
      const foundSlugs = tagsData?.map((t: any) => t.slug) || []
      const missingSlugs = tags.filter((t: string) => !foundSlugs.includes(t))
      throw new BadRequestError(`Tags not found: ${missingSlugs.join(', ')}. Please create them first.`)
    }

    tagIds = tagsData.map((t: any) => t.id)
  }

  const resolvedStatus = status || 'draft'
  const isPublished = resolvedStatus === 'published'

  // Create blog post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content: contentJson,
      excerpt: excerpt || null,
      featured_image: featuredImageUrl,
      meta_data: {
        images: uploadedImageUrls
      },
      status: resolvedStatus,
      published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_id: userId,
      last_modified_by: userId,
      category_id: categoryId
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ApiConflictError('A blog post with this slug already exists. Please use a different slug.')
    }
    logger.error('Blog post creation failed', { error: error.message, slug, userId })
    throw new ApiDatabaseError(error)
  }

  // Add tags if provided
  if (tagIds.length > 0) {
    const tagRecords = tagIds.map(tagId => ({
      blog_post_id: post.id,
      tag_id: tagId
    }))
    await supabase.from('blog_post_tags').insert(tagRecords)
  }

  logger.info('Blog post with images created successfully', {
    postId: post.id,
    slug,
    userId,
    featuredImage: !!featuredImageUrl,
    extraImages: uploadedImageUrls.length
  })

  return res.status(201).json({
    message: 'Blog post with images created successfully',
    post: {
      ...post,
      featured_image: featuredImageUrl,
      images: uploadedImageUrls
    }
  })
})
