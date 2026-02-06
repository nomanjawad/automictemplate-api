/**
 * @module repositories/content
 * @description Content repositories for common and page content
 */

import { BaseRepository } from './base.repository.js'
import type {
  CommonContent,
  PageContent,
  CreateCommonContentInput,
  UpdateCommonContentInput,
  CreatePageContentInput,
  UpdatePageContentInput
} from '../types/index.js'
import { DatabaseError } from '../utils/index.js'

/**
 * Common Content Repository
 * Handles database operations for reusable components (header, footer, CTA, etc.)
 */
export class CommonContentRepository extends BaseRepository<CommonContent> {
  get tableName(): string {
    return 'content_common'
  }

  /**
   * Find common content by key
   * @param key - Content key (e.g., 'header', 'footer')
   * @returns Common content or null if not found
   */
  async findByKey(key: string): Promise<CommonContent | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('key', key)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(`Failed to fetch common content: ${error.message}`)
      }

      return data as CommonContent
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching common content')
    }
  }

  /**
   * Create or update common content by key (upsert)
   * @param input - Content data
   * @returns Created or updated common content
   */
  async upsert(input: CreateCommonContentInput): Promise<CommonContent> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .upsert(
          { key: input.key, data: input.data },
          { onConflict: 'key', ignoreDuplicates: false }
        )
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to upsert common content: ${error.message}`)
      }

      return data as CommonContent
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error upserting common content')
    }
  }

  /**
   * Update common content data by key
   * @param key - Content key
   * @param input - Update data
   * @returns Updated common content or null if not found
   */
  async updateByKey(key: string, input: UpdateCommonContentInput): Promise<CommonContent | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .update({ data: input.data })
        .eq('key', key)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new DatabaseError(`Failed to update common content: ${error.message}`)
      }

      return data as CommonContent
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error updating common content')
    }
  }

  /**
   * Delete common content by key
   * @param key - Content key
   * @returns true if deleted, false otherwise
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('key', key)

      if (error) {
        throw new DatabaseError(`Failed to delete common content: ${error.message}`)
      }

      return true
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error deleting common content')
    }
  }
}

/**
 * Page Content Repository
 * Handles database operations for page-specific content
 */
export class PageContentRepository extends BaseRepository<PageContent> {
  get tableName(): string {
    return 'content_pages'
  }

  /**
   * Find published pages only
   * @returns Array of published pages
   */
  async findPublished(): Promise<PageContent[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('published', true)
        .order('slug', { ascending: true })

      if (error) {
        throw new DatabaseError(`Failed to fetch published pages: ${error.message}`)
      }

      return (data || []) as PageContent[]
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching published pages')
    }
  }

  /**
   * Create or update page content by slug (upsert)
   * @param input - Page data
   * @returns Created or updated page
   */
  async upsert(input: CreatePageContentInput): Promise<PageContent> {
    try {
      const payload: any = {
        slug: input.slug,
        title: input.title,
        data: input.data,
        meta_data: input.meta_data || null,
        published: input.published || false
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .upsert(payload, { onConflict: 'slug', ignoreDuplicates: false })
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to upsert page: ${error.message}`)
      }

      return data as PageContent
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error upserting page')
    }
  }

  /**
   * Update page content by slug
   * @param slug - Page slug
   * @param input - Update data
   * @returns Updated page or null if not found
   */
  async updatePage(slug: string, input: UpdatePageContentInput): Promise<PageContent | null> {
    try {
      const payload: any = {}
      if (input.title !== undefined) payload.title = input.title
      if (input.data !== undefined) payload.data = input.data
      if (input.meta_data !== undefined) payload.meta_data = input.meta_data
      if (input.published !== undefined) payload.published = input.published

      if (Object.keys(payload).length === 0) {
        return null
      }

      return await this.updateBySlug(slug, payload)
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error updating page')
    }
  }

  /**
   * Publish a page
   * @param slug - Page slug
   * @returns Updated page or null if not found
   */
  async publish(slug: string): Promise<PageContent | null> {
    return this.updateBySlug(slug, { published: true } as any)
  }

  /**
   * Unpublish a page
   * @param slug - Page slug
   * @returns Updated page or null if not found
   */
  async unpublish(slug: string): Promise<PageContent | null> {
    return this.updateBySlug(slug, { published: false } as any)
  }
}
