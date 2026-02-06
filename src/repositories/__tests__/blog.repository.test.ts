/**
 * Unit tests for BlogRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { BlogRepository } from '../blog.repository.js'
import { createMockBlogPost } from '../../__tests__/helpers.js'
import { DatabaseError, NotFoundError } from '../../utils/index.js'

// Mock the Supabase client
jest.mock('../../db/supabaseClient', () => ({
  supabaseClient: null,
}))

describe('BlogRepository', () => {
  let repository: BlogRepository
  let mockSupabaseClient: any

  beforeEach(() => {
    repository = new BlogRepository()

    // Create mock Supabase client with chainable methods
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    }

    // Mock the client getter
    Object.defineProperty(repository, 'client', {
      get: () => mockSupabaseClient,
    })
  })

  describe('findPublished', () => {
    it('should return published blog posts with pagination', async () => {
      const mockPosts = [
        createMockBlogPost({ id: '1', published: true }),
        createMockBlogPost({ id: '2', published: true }),
      ]

      // The final method in the chain (range) should return the promise
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: mockPosts,
        error: null,
        count: 2,
      })

      const result = await repository.findPublished(10, 0)

      expect(result.data).toEqual(mockPosts)
      expect(result.count).toBe(2)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('blog_posts')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('published', true)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      })

      await expect(repository.findPublished()).rejects.toThrow(DatabaseError)
    })
  })

  describe('findBySlug', () => {
    it('should return a blog post by slug', async () => {
      const mockPost = createMockBlogPost({ slug: 'test-post' })

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockPost,
        error: null,
      })

      const result = await repository.findBySlug('test-post')

      expect(result).toEqual(mockPost)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', 'test-post')
    })

    it('should return null if post not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await repository.findBySlug('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw DatabaseError for other errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'OTHER' },
      })

      await expect(repository.findBySlug('test')).rejects.toThrow(DatabaseError)
    })
  })

  describe('createPost', () => {
    it('should create a new blog post', async () => {
      const input = {
        slug: 'new-post',
        title: 'New Post',
        content: { body: 'Content' },
      }
      const mockCreatedPost = createMockBlogPost(input)

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockCreatedPost,
        error: null,
      })

      const result = await repository.createPost(input)

      expect(result).toEqual(mockCreatedPost)
    })

    it('should handle creation errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Duplicate slug' },
      })

      await expect(
        repository.createPost({
          slug: 'duplicate',
          title: 'Test',
          content: {},
        })
      ).rejects.toThrow(DatabaseError)
    })
  })

  describe('updatePost', () => {
    it('should update a blog post', async () => {
      const updates = { title: 'Updated Title' }
      const mockUpdatedPost = createMockBlogPost(updates)

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUpdatedPost,
        error: null,
      })

      const result = await repository.updatePost('test-slug', updates)

      expect(result).toEqual(mockUpdatedPost)
    })
  })

  describe('publish', () => {
    it('should publish a blog post', async () => {
      const mockPublishedPost = createMockBlogPost({
        published: true,
        published_at: new Date().toISOString(),
      })

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockPublishedPost,
        error: null,
      })

      const result = await repository.publish('test-id')

      expect(result.published).toBe(true)
      expect(result.published_at).toBeDefined()
    })
  })

  describe('unpublish', () => {
    it('should unpublish a blog post', async () => {
      const mockUnpublishedPost = createMockBlogPost({
        published: false,
        published_at: null,
      })

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUnpublishedPost,
        error: null,
      })

      const result = await repository.unpublish('test-id')

      expect(result.published).toBe(false)
      expect(result.published_at).toBeNull()
    })
  })
})
