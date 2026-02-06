/**
 * @module repositories/blog
 * @description Blog repository for database operations
 */

import { BaseRepository } from './base.repository.js'
import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from '../types/index.js'
import { DatabaseError, ConflictError } from '../utils/index.js'

/**
 * Blog Repository
 * Handles all database operations for blog posts
 */
export class BlogRepository extends BaseRepository<BlogPost> {
  get tableName(): string {
    return 'blog_posts'
  }

  /**
   * Find published blog posts with pagination
   * @param limit - Number of posts to return
   * @param offset - Number of posts to skip
   * @returns Object with posts and total count
   */
  async findPublished(limit: number = 10, offset: number = 0): Promise<{ data: BlogPost[], count: number }> {
    try {
      const { data, error, count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new DatabaseError(`Failed to fetch published posts: ${error.message}`)
      }

      return {
        data: (data || []) as BlogPost[],
        count: count || 0
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching published posts')
    }
  }

  /**
   * Find all blog posts with pagination
   * @param limit - Number of posts to return
   * @param offset - Number of posts to skip
   * @param publishedOnly - Filter for published posts only
   * @returns Object with posts and total count
   */
  async findWithPagination(
    limit: number = 10,
    offset: number = 0,
    publishedOnly: boolean = false
  ): Promise<{ data: BlogPost[], count: number }> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (publishedOnly) {
        query = query.eq('published', true)
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1)

      if (error) {
        throw new DatabaseError(`Failed to fetch blog posts: ${error.message}`)
      }

      return {
        data: (data || []) as BlogPost[],
        count: count || 0
      }
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching blog posts')
    }
  }

  /**
   * Find blog posts by author
   * @param authorId - Author's user ID
   * @returns Array of blog posts
   */
  async findByAuthor(authorId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(`Failed to fetch posts by author: ${error.message}`)
      }

      return (data || []) as BlogPost[]
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching posts by author')
    }
  }

  /**
   * Find blog posts by tag
   * @param tag - Tag to search for
   * @param publishedOnly - Filter for published posts only
   * @returns Array of blog posts
   */
  async findByTag(tag: string, publishedOnly: boolean = true): Promise<BlogPost[]> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .contains('tags', [tag])
        .order('published_at', { ascending: false, nullsFirst: false })

      if (publishedOnly) {
        query = query.eq('published', true)
      }

      const { data, error } = await query

      if (error) {
        throw new DatabaseError(`Failed to fetch posts by tag: ${error.message}`)
      }

      return (data || []) as BlogPost[]
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error fetching posts by tag')
    }
  }

  /**
   * Create a new blog post
   * @param input - Blog post data
   * @returns Created blog post
   */
  async createPost(input: CreateBlogPostInput): Promise<BlogPost> {
    try {
      const payload: any = {
        ...input,
        published_at: input.published ? new Date().toISOString() : null,
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(payload)
        .select()
        .single()

      if (error) {
        // Check for unique constraint violation (duplicate slug)
        if (error.code === '23505') {
          throw new ConflictError(`Blog post with slug "${input.slug}" already exists`)
        }
        throw new DatabaseError(`Failed to create blog post: ${error.message}`)
      }

      return data as BlogPost
    } catch (err) {
      if (err instanceof DatabaseError || err instanceof ConflictError) throw err
      throw new DatabaseError('Unexpected error creating blog post')
    }
  }

  /**
   * Update a blog post by slug
   * @param slug - Post slug
   * @param input - Update data
   * @returns Updated blog post or null if not found
   */
  async updatePost(slug: string, input: UpdateBlogPostInput): Promise<BlogPost | null> {
    try {
      const payload: any = { ...input }

      // Auto-set published_at when publishing
      if (input.published === true) {
        payload.published_at = new Date().toISOString()
      }

      return await this.updateBySlug(slug, payload)
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error updating blog post')
    }
  }

  /**
   * Publish a blog post
   * @param slug - Post slug
   * @returns Updated blog post or null if not found
   */
  async publish(slug: string): Promise<BlogPost | null> {
    return this.updatePost(slug, { published: true })
  }

  /**
   * Unpublish a blog post
   * @param slug - Post slug
   * @returns Updated blog post or null if not found
   */
  async unpublish(slug: string): Promise<BlogPost | null> {
    try {
      return await this.updateBySlug(slug, {
        published: false,
        published_at: null
      } as any)
    } catch (err) {
      if (err instanceof DatabaseError) throw err
      throw new DatabaseError('Unexpected error unpublishing blog post')
    }
  }
}
