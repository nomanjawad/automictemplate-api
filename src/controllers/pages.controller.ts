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
 * Get all pages with basic metadata and author information
 * Returns: id, title, slug, status, created_at, author_id + author name from users table
 * No pagination - returns ALL pages for dashboard
 */
export const getAllPages = asyncHandler(async (req: Request, res: Response) => {
  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get all pages with author info via public.users table
  const { data: pages, error } = await supabase
    .from('content_pages')
    .select(`
      id,
      title,
      slug,
      status,
      meta_data,
      created_at,
      updated_at,
      version,
      author_id,
      users:author_id(id, email, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch pages', { error: error.message })
    throw new ApiDatabaseError(error)
  }

  logger.info('Fetched all pages', { count: pages?.length || 0 })

  // Transform response to include author info directly
  const pagesWithAuthor = pages?.map((page: any) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    meta_data: page.meta_data,
    created_at: page.created_at,
    updated_at: page.updated_at,
    version: page.version,
    author_id: page.author_id,
    author_name: page.users?.full_name || 'Unknown',
    author_email: page.users?.email || null
  })) || []

  return res.json({
    pages: pagesWithAuthor,
    total: pagesWithAuthor.length
  })
})

/**
 * Get page by slug with full dataset
 * Returns all fields including data (JSONB content)
 */
export const getPageById = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Page slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get full page data with author info via public.users table
  const { data: page, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      users:author_id(id, email, full_name)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiNotFoundError('Page not found')
    }
    logger.error('Failed to fetch page by slug', { 
      error: error.message, 
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug 
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Fetched page by slug', { slug })

  return res.json({
    page: {
      ...page,
      author_name: page.users?.full_name || 'Unknown',
      author_email: page.users?.email || null
    }
  })
})

/**
 * Create a new page
 * Auto-sets author_id from authenticated user
 * Body: { title, slug, meta_data? }
 * Note: data (content) can be left empty and updated later via updatePage
 */
export const createPage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { title, slug, data, meta_data } = req.body

  // Validate required fields
  if (!title || !slug) {
    throw new BadRequestError('Missing required fields: title and slug are required')
  }

  // data is optional now (can be added later via update)
  const pageData = data || {}

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Create new page with author_id from authenticated user
  // Always start as draft status
  const { data: page, error } = await supabase
    .from('content_pages')
    .insert({
      title,
      slug,
      data: pageData,
      meta_data: meta_data || null,
      status: 'draft',
      author_id: userId,
      last_modified_by: userId
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation for slug
    if (error.code === '23505') {
      logger.warn('Page creation failed - duplicate slug', { slug, userId })
      throw new ApiConflictError('A page with this slug already exists. Please use a different slug.')
    }

    // Handle foreign key constraint
    if (error.code === '23503') {
      logger.error('Page creation failed - invalid user reference', { 
        error: error.message,
        userId 
      })
      throw new BadRequestError('Invalid user ID: user does not exist')
    }

    // Handle invalid input errors
    if (error.code === '22P02' || error.code === '23514') {
      logger.error('Page creation failed - invalid input', { 
        error: error.message,
        details: error.details,
        slug, 
        userId 
      })
      throw new BadRequestError(`Invalid input data: ${error.message}`)
    }

    // Generic database error
    logger.error('Page creation failed - database error', { 
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug,
      userId 
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Page created successfully', { pageId: page.id, slug, userId })

  return res.status(201).json({
    message: 'Page created successfully',
    page
  })
})

/**
 * Update a page by slug
 * Updates: title, slug, data, meta_data, status
 * Auto-sets last_modified_by from authenticated user
 * Auto-logs changes to content_history table via trigger
 * Valid statuses: draft, review, scheduled, published, archived
 */
export const updatePage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params
  const { title, slug: newSlug, data, meta_data, status } = req.body

  if (!slug) {
    throw new BadRequestError('Page slug is required')
  }

  // Validate at least one field is being updated
  if (!title && !newSlug && !data && !meta_data && !status) {
    throw new BadRequestError('At least one field must be provided for update')
  }

  // Validate status if provided
  const validStatuses = ['draft', 'review', 'scheduled', 'published', 'archived']
  if (status && !validStatuses.includes(status)) {
    throw new BadRequestError(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    )
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Build update object with only provided fields
  const updateData: any = {
    last_modified_by: userId,
    updated_at: new Date().toISOString()
  }
  if (title !== undefined) updateData.title = title
  if (newSlug !== undefined) updateData.slug = newSlug
  if (data !== undefined) updateData.data = data
  if (meta_data !== undefined) updateData.meta_data = meta_data
  if (status !== undefined) updateData.status = status

  // Update page by slug
  const { data: page, error } = await supabase
    .from('content_pages')
    .update(updateData)
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation for slug
    if (error.code === '23505') {
      logger.warn('Page update failed - duplicate slug', { slug: newSlug, currentSlug: slug, userId })
      throw new ApiConflictError('A page with this slug already exists. Please use a different slug.')
    }

    // Handle page not found
    if (error.code === 'PGRST116') {
      logger.warn('Page update failed - not found', { slug, userId })
      throw new ApiNotFoundError('Page not found')
    }

    // Handle invalid input errors
    if (error.code === '22P02' || error.code === '23514') {
      logger.error('Page update failed - invalid input', { 
        error: error.message,
        details: error.details,
        slug, 
        userId 
      })
      throw new BadRequestError(`Invalid input data: ${error.message}`)
    }

    // Generic database error
    logger.error('Page update failed - database error', { 
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug,
      userId 
    })
    throw new ApiDatabaseError(error)
  }

  logger.info('Page updated successfully', { pageId: page.id, slug, userId })

  return res.json({
    message: 'Page updated successfully',
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      data: page.data,
      meta_data: page.meta_data,
      version: page.version,
      updated_at: page.updated_at,
      last_modified_by: page.last_modified_by
    }
  })
})

/**
 * Delete page by slug
 */
export const deletePage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Page slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // First get page info before deletion
  const { data: page, error: fetchError } = await supabase
    .from('content_pages')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (fetchError || !page) {
    logger.warn('Page delete failed - not found', { slug, userId })
    throw new ApiNotFoundError('Page not found')
  }

  // Delete page
  const { error: deleteError } = await supabase
    .from('content_pages')
    .delete()
    .eq('slug', slug)

  if (deleteError) {
    logger.error('Delete page failed - database error', { 
      error: deleteError.message, 
      code: deleteError.code,
      details: deleteError.details,
      slug, 
      userId 
    })
    throw new ApiDatabaseError(deleteError)
  }

  logger.warn('Page deleted', { pageId: page.id, slug: page.slug, deletedBy: userId })

  return res.json({
    message: 'Page deleted successfully',
    deleted_page: {
      id: page.id,
      title: page.title,
      slug: page.slug
    }
  })
})

/**
 * Get page version history by slug
 * Returns all versions of a page from content_history table
 * Sorted by version descending (newest first)
 */
export const getPageHistory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  if (!slug) {
    throw new BadRequestError('Page slug is required')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get page first to verify it exists
  const { data: page, error: pageError } = await supabase
    .from('content_pages')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (pageError || !page) {
    logger.warn('Page not found for history', { slug })
    throw new ApiNotFoundError('Page not found')
  }

  // Get history from content_history table
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
    .eq('table_name', 'content_pages')
    .eq('record_id', page.id)
    .order('version', { ascending: false })

  if (error) {
    logger.error('Fetch page history failed - database error', { 
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

  logger.info('Fetched page history', { slug, pageId: page.id, versions: historyWithUser.length })

  return res.json({
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug
    },
    history: historyWithUser
  })
})

/**
 * Restore a previous page version by slug
 * Restores content, title, metadata, and status from a specific version
 * The restoration itself creates a new version entry in content_history
 */
export const restorePageVersion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiUnauthorizedError('User not authenticated')
  }

  const { slug, version } = req.params

  if (!slug || !version) {
    throw new BadRequestError('Page slug and version are required')
  }

  // Validate version is a number
  if (isNaN(parseInt(version))) {
    throw new BadRequestError('Version must be a valid number')
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    throw new InternalServerError('Database service unavailable')
  }

  // Get the page first
  const { data: page, error: pageError } = await supabase
    .from('content_pages')
    .select('id, title, slug')
    .eq('slug', slug)
    .single()

  if (pageError || !page) {
    logger.warn('Page not found for restore', { slug })
    throw new ApiNotFoundError('Page not found')
  }

  // Get the specific history version
  const { data: historyRecord, error: historyError } = await supabase
    .from('content_history')
    .select('*')
    .eq('table_name', 'content_pages')
    .eq('record_id', page.id)
    .eq('version', parseInt(version))
    .single()

  if (historyError || !historyRecord) {
    logger.warn('Version not found for restore', { slug, version })
    throw new ApiNotFoundError(`Version ${version} not found for this page`)
  }

  // Restore the page using the database function
  const { data: restored, error: restoreError } = await supabase
    .rpc('restore_content_version', {
      p_table_name: 'content_pages',
      p_record_id: page.id,
      p_version: parseInt(version),
      p_restored_by: userId
    })

  if (restoreError) {
    logger.error('Restore page version failed - database error', { 
      error: restoreError.message,
      code: restoreError.code,
      details: restoreError.details,
      slug, 
      version 
    })
    throw new ApiDatabaseError(restoreError)
  }

  // Get the updated page
  const { data: updatedPage, error: fetchError } = await supabase
    .from('content_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (fetchError || !updatedPage) {
    logger.error('Fetch restored page failed - database error', { 
      error: fetchError?.message,
      code: fetchError?.code,
      slug 
    })
    throw new ApiDatabaseError(fetchError || new Error('Failed to fetch restored page'))
  }

  logger.info('Page version restored successfully', { pageId: page.id, slug, version, restoredBy: userId })

  return res.json({
    message: `Page successfully restored to version ${version}`,
    page: {
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      data: updatedPage.data,
      meta_data: updatedPage.meta_data,
      version: updatedPage.version,
      updated_at: updatedPage.updated_at
    }
  })
})
