import { Request, Response } from 'express'
import { supabase } from '../db/supabaseClient.js'
import { logger } from '../utils/index.js'

/**
 * Get all pages with basic metadata and author information
 * Returns: id, title, slug, status, created_at, author_id + author name from users table
 * No pagination - returns ALL pages for dashboard
 */
export async function getAllPages(req: Request, res: Response) {
  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Get all pages with author info via join
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
        users!content_pages_author_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch pages', { error: error.message })
      return res.status(500).json({ error: 'Failed to fetch pages' })
    }

    // Transform response to include author name directly
    const pagesWithAuthor = pages?.map(page => ({
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

    logger.info('Fetched all pages', { count: pagesWithAuthor.length })

    return res.json({
      pages: pagesWithAuthor,
      total: pagesWithAuthor.length
    })
  } catch (err: any) {
    logger.error('Get all pages failed', { error: err.message || err })
    return res.status(500).json({ error: 'Failed to fetch pages' })
  }
}

/**
 * Get page by ID with full dataset
 * Returns all fields including data (JSONB content)
 */
export async function getPageById(req: Request, res: Response) {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'Page ID is required' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Get full page data with author info
    const { data: page, error } = await supabase
      .from('content_pages')
      .select(`
        *,
        users!content_pages_author_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Page not found' })
      }
      logger.error('Failed to fetch page by ID', { error: error.message, id })
      return res.status(500).json({ error: 'Failed to fetch page' })
    }

    logger.info('Fetched page by ID', { id })

    return res.json({
      page: {
        ...page,
        author_name: page.users?.full_name || 'Unknown',
        author_email: page.users?.email || null
      }
    })
  } catch (err: any) {
    logger.error('Get page by ID failed', { error: err.message || err, id })
    return res.status(500).json({ error: 'Failed to fetch page' })
  }
}

/**
 * Create a new page
 * Auto-sets author_id from authenticated user
 * Body: { title, slug, meta_data? }
 * Note: data (content) can be left empty and updated later via updatePage
 */
export async function createPage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const { title, slug, data, meta_data } = req.body

  // Validate required fields
  if (!title || !slug) {
    return res.status(400).json({
      error: 'Missing required fields: title and slug are required'
    })
  }

  // data is optional now (can be added later via update)
  const pageData = data || {}

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
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
        return res.status(409).json({
          error: 'A page with this slug already exists. Please use a different slug.',
          code: 'DUPLICATE_SLUG'
        })
      }

      // Handle invalid input errors
      if (error.code === '22P02' || error.code === '23514') {
        logger.error('Page creation failed - invalid input', { 
          error: error.message,
          details: error.details,
          slug, 
          userId 
        })
        return res.status(400).json({ 
          error: 'Invalid input data: ' + error.message,
          code: 'INVALID_INPUT',
          details: error.details
        })
      }

      // Handle foreign key constraint
      if (error.code === '23503') {
        logger.error('Page creation failed - invalid user reference', { 
          error: error.message,
          userId 
        })
        return res.status(400).json({ 
          error: 'Invalid user ID: user does not exist',
          code: 'INVALID_USER'
        })
      }

      // Generic database error - log full details
      logger.error('Page creation failed - database error', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        slug,
        userId 
      })
      return res.status(500).json({ 
        error: 'Database error: ' + error.message,
        code: error.code,
        details: error.details
      })
    }

    logger.info('Page created successfully', { pageId: page.id, slug, userId })

    return res.status(201).json({
      message: 'Page created successfully',
      page
    })
  } catch (err: any) {
    logger.error('Create page failed - unexpected error', { 
      error: err.message || err, 
      stack: err.stack,
      userId 
    })
    return res.status(500).json({ 
      error: 'Unexpected error: ' + (err.message || 'Unknown error'),
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Update a page by ID
 * Updates: title, slug, data, meta_data, status
 * Auto-sets last_modified_by from authenticated user
 * Auto-logs changes to content_history table via trigger
 * Valid statuses: draft, review, scheduled, published, archived
 */
export async function updatePage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const { id } = req.params
  const { title, slug, data, meta_data, status } = req.body

  if (!id) {
    return res.status(400).json({ 
      error: 'Page ID is required',
      code: 'MISSING_ID'
    })
  }

  // Validate at least one field is being updated
  if (!title && !slug && !data && !meta_data && !status) {
    return res.status(400).json({
      error: 'At least one field must be provided for update',
      code: 'NO_UPDATES'
    })
  }

  // Validate status if provided
  const validStatuses = ['draft', 'review', 'scheduled', 'published', 'archived']
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      code: 'INVALID_STATUS',
      validValues: validStatuses
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ 
      error: 'Database service unavailable',
      code: 'DB_UNAVAILABLE'
    })
  }

  try {
    // Build update object with only provided fields
    const updateData: any = {
      last_modified_by: userId,
      updated_at: new Date().toISOString()
    }
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (data !== undefined) updateData.data = data
    if (meta_data !== undefined) updateData.meta_data = meta_data
    if (status !== undefined) updateData.status = status

    // Update page
    const { data: page, error } = await supabase
      .from('content_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation for slug
      if (error.code === '23505') {
        logger.warn('Page update failed - duplicate slug', { slug, id, userId })
        return res.status(409).json({
          error: 'A page with this slug already exists. Please use a different slug.',
          code: 'DUPLICATE_SLUG'
        })
      }

      // Handle page not found
      if (error.code === 'PGRST116') {
        logger.warn('Page update failed - not found', { id, userId })
        return res.status(404).json({ 
          error: 'Page not found',
          code: 'PAGE_NOT_FOUND'
        })
      }

      // Handle invalid input errors
      if (error.code === '22P02' || error.code === '23514') {
        logger.error('Page update failed - invalid input', { 
          error: error.message,
          details: error.details,
          id, 
          userId 
        })
        return res.status(400).json({ 
          error: 'Invalid input data: ' + error.message,
          code: 'INVALID_INPUT',
          details: error.details
        })
      }

      // Generic database error
      logger.error('Page update failed - database error', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        id,
        userId 
      })
      return res.status(500).json({ 
        error: 'Database error: ' + error.message,
        code: error.code,
        details: error.details
      })
    }

    logger.info('Page updated successfully', { pageId: id, userId })

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
  } catch (err: any) {
    logger.error('Update page failed - unexpected error', { 
      error: err.message || err, 
      stack: err.stack,
      id, 
      userId 
    })
    return res.status(500).json({ 
      error: 'Unexpected error: ' + (err.message || 'Unknown error'),
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Delete page by ID
 */
export async function deletePage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const { id } = req.params

  if (!id) {
    return res.status(400).json({ 
      error: 'Page ID is required',
      code: 'MISSING_ID'
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ 
      error: 'Database service unavailable',
      code: 'DB_UNAVAILABLE'
    })
  }

  try {
    // First get page info before deletion
    const { data: page, error: fetchError } = await supabase
      .from('content_pages')
      .select('id, title, slug')
      .eq('id', id)
      .single()

    if (fetchError || !page) {
      logger.warn('Page delete failed - not found', { id, userId })
      return res.status(404).json({ 
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      })
    }

    // Delete page
    const { error: deleteError } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Delete page failed - database error', { 
        error: deleteError.message, 
        code: deleteError.code,
        details: deleteError.details,
        id, 
        userId 
      })
      return res.status(500).json({ 
        error: 'Database error: ' + deleteError.message,
        code: deleteError.code,
        details: deleteError.details
      })
    }

    logger.warn('Page deleted', { pageId: id, slug: page.slug, deletedBy: userId })

    return res.json({
      message: 'Page deleted successfully',
      deleted_page: {
        id: page.id,
        title: page.title,
        slug: page.slug
      }
    })
  } catch (err: any) {
    logger.error('Delete page failed - unexpected error', { 
      error: err.message || err, 
      stack: err.stack,
      id, 
      userId 
    })
    return res.status(500).json({ 
      error: 'Unexpected error: ' + (err.message || 'Unknown error'),
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Get page version history
 * Returns all versions of a page from content_history table
 * Sorted by version descending (newest first)
 */
export async function getPageHistory(req: Request, res: Response) {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ 
      error: 'Page ID is required',
      code: 'MISSING_ID'
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ 
      error: 'Database service unavailable',
      code: 'DB_UNAVAILABLE'
    })
  }

  try {
    // Get page first to verify it exists
    const { data: page, error: pageError } = await supabase
      .from('content_pages')
      .select('id, title, slug')
      .eq('id', id)
      .single()

    if (pageError || !page) {
      logger.warn('Page not found for history', { id })
      return res.status(404).json({ 
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      })
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
      .eq('record_id', id)
      .order('version', { ascending: false })

    if (error) {
      logger.error('Fetch page history failed - database error', { 
        error: error.message,
        code: error.code,
        details: error.details,
        id 
      })
      return res.status(500).json({ 
        error: 'Database error: ' + error.message,
        code: error.code,
        details: error.details
      })
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

    logger.info('Fetched page history', { id, versions: historyWithUser.length })

    return res.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug
      },
      history: historyWithUser
    })
  } catch (err: any) {
    logger.error('Get page history failed - unexpected error', { 
      error: err.message || err, 
      stack: err.stack,
      id 
    })
    return res.status(500).json({ 
      error: 'Unexpected error: ' + (err.message || 'Unknown error'),
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Restore a previous page version
 * Restores content, title, metadata, and status from a specific version
 * The restoration itself creates a new version entry in content_history
 */
export async function restorePageVersion(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const { id, version } = req.params

  if (!id || !version) {
    return res.status(400).json({ 
      error: 'Page ID and version are required',
      code: 'MISSING_PARAMS'
    })
  }

  // Validate version is a number
  if (isNaN(parseInt(version))) {
    return res.status(400).json({ 
      error: 'Version must be a valid number',
      code: 'INVALID_VERSION'
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ 
      error: 'Database service unavailable',
      code: 'DB_UNAVAILABLE'
    })
  }

  try {
    // Get the page first
    const { data: page, error: pageError } = await supabase
      .from('content_pages')
      .select('id, title, slug')
      .eq('id', id)
      .single()

    if (pageError || !page) {
      logger.warn('Page not found for restore', { id })
      return res.status(404).json({ 
        error: 'Page not found',
        code: 'PAGE_NOT_FOUND'
      })
    }

    // Get the specific history version
    const { data: historyRecord, error: historyError } = await supabase
      .from('content_history')
      .select('*')
      .eq('table_name', 'content_pages')
      .eq('record_id', id)
      .eq('version', parseInt(version))
      .single()

    if (historyError || !historyRecord) {
      logger.warn('Version not found for restore', { id, version })
      return res.status(404).json({ 
        error: `Version ${version} not found for this page`,
        code: 'VERSION_NOT_FOUND'
      })
    }

    // Restore the page using the database function
    const { data: restored, error: restoreError } = await supabase
      .rpc('restore_content_version', {
        p_table_name: 'content_pages',
        p_record_id: id,
        p_version: parseInt(version),
        p_restored_by: userId
      })

    if (restoreError) {
      logger.error('Restore page version failed - database error', { 
        error: restoreError.message,
        code: restoreError.code,
        details: restoreError.details,
        id, 
        version 
      })
      return res.status(500).json({ 
        error: 'Database error: ' + restoreError.message,
        code: restoreError.code,
        details: restoreError.details
      })
    }

    // Get the updated page
    const { data: updatedPage, error: fetchError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !updatedPage) {
      logger.error('Fetch restored page failed - database error', { 
        error: fetchError?.message,
        code: fetchError?.code,
        id 
      })
      return res.status(500).json({ 
        error: 'Failed to fetch restored page',
        code: 'FETCH_ERROR'
      })
    }

    logger.info('Page version restored successfully', { pageId: id, version, restoredBy: userId })

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
  } catch (err: any) {
    logger.error('Restore page version failed - unexpected error', { 
      error: err.message || err, 
      stack: err.stack,
      id, 
      version 
    })
    return res.status(500).json({ 
      error: 'Unexpected error: ' + (err.message || 'Unknown error'),
      code: 'INTERNAL_ERROR'
    })
  }
}
