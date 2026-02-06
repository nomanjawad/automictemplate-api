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
 * Body: { title, slug, data, meta_data?, status? }
 */
export async function createPage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' })
  }

  const { title, slug, data, meta_data, status } = req.body

  // Validate required fields
  if (!title || !slug || !data) {
    return res.status(400).json({
      error: 'Missing required fields: title, slug, and data are required'
    })
  }

  // Validate status if provided
  const validStatuses = ['draft', 'review', 'scheduled', 'published', 'archived']
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Create new page with author_id from authenticated user
    const { data: page, error } = await supabase
      .from('content_pages')
      .insert({
        title,
        slug,
        data,
        meta_data: meta_data || null,
        status: status || 'draft',
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
          error: 'A page with this slug already exists. Please use a different slug.'
        })
      }

      logger.error('Failed to create page', { error: error.message, userId })
      return res.status(500).json({ error: 'Failed to create page' })
    }

    logger.info('Page created successfully', { pageId: page.id, slug, userId })

    return res.status(201).json({
      message: 'Page created successfully',
      page
    })
  } catch (err: any) {
    logger.error('Create page failed', { error: err.message || err, userId })
    return res.status(500).json({ error: 'Failed to create page' })
  }
}

/**
 * Update a page by ID
 * Updates: title, slug, data, meta_data, status
 * Auto-sets last_modified_by from authenticated user
 */
export async function updatePage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' })
  }

  const { id } = req.params
  const { title, slug, data, meta_data, status } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Page ID is required' })
  }

  // Validate at least one field is being updated
  if (!title && !slug && !data && !meta_data && !status) {
    return res.status(400).json({
      error: 'At least one field must be provided for update'
    })
  }

  // Validate status if provided
  const validStatuses = ['draft', 'review', 'scheduled', 'published', 'archived']
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // Build update object with only provided fields
    const updateData: any = {
      last_modified_by: userId
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
          error: 'A page with this slug already exists. Please use a different slug.'
        })
      }

      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Page not found' })
      }

      logger.error('Failed to update page', { error: error.message, id, userId })
      return res.status(500).json({ error: 'Failed to update page' })
    }

    logger.info('Page updated successfully', { pageId: id, userId })

    return res.json({
      message: 'Page updated successfully',
      page
    })
  } catch (err: any) {
    logger.error('Update page failed', { error: err.message || err, id, userId })
    return res.status(500).json({ error: 'Failed to update page' })
  }
}

/**
 * Delete page by ID
 */
export async function deletePage(req: Request, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' })
  }

  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'Page ID is required' })
  }

  if (!supabase) {
    logger.error('Supabase client not configured')
    return res.status(500).json({ error: 'Database service unavailable' })
  }

  try {
    // First get page info before deletion
    const { data: page, error: fetchError } = await supabase
      .from('content_pages')
      .select('id, title, slug')
      .eq('id', id)
      .single()

    if (fetchError || !page) {
      return res.status(404).json({ error: 'Page not found' })
    }

    // Delete page
    const { error: deleteError } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Failed to delete page', { error: deleteError.message, id, userId })
      return res.status(500).json({ error: 'Failed to delete page' })
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
    logger.error('Delete page failed', { error: err.message || err, id, userId })
    return res.status(500).json({ error: 'Failed to delete page' })
  }
}
