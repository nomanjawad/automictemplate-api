/**
 * Unit tests for Content Repositories
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { CommonContentRepository, PageContentRepository } from '../content.repository.js'
import { createMockCommonContent, createMockPageContent } from '../../__tests__/helpers.js'
import { DatabaseError } from '../../utils/index.js'

// Mock the Supabase client
jest.mock('../../db/supabaseClient', () => ({
  supabaseClient: null,
}))

describe('CommonContentRepository', () => {
  let repository: CommonContentRepository
  let mockSupabaseClient: any

  beforeEach(() => {
    repository = new CommonContentRepository()

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
    }

    Object.defineProperty(repository, 'client', {
      get: () => mockSupabaseClient,
    })
  })

  describe('findByKey', () => {
    it('should return common content by key', async () => {
      const mockContent = createMockCommonContent({ key: 'header' })

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockContent,
        error: null,
      })

      const result = await repository.findByKey('header')

      expect(result).toEqual(mockContent)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('key', 'header')
    })

    it('should return null if content not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await repository.findByKey('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('should create or update common content', async () => {
      const input = {
        key: 'header',
        data: { logo: 'https://example.com/logo.png' },
      }
      const mockContent = createMockCommonContent(input)

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockContent,
        error: null,
      })

      const result = await repository.upsert(input)

      expect(result).toEqual(mockContent)
    })

    it('should handle upsert errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upsert failed' },
      })

      await expect(
        repository.upsert({ key: 'test', data: {} })
      ).rejects.toThrow(DatabaseError)
    })
  })

  describe('deleteByKey', () => {
    it('should delete common content by key', async () => {
      // The final method in the chain (eq) should return the promise
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: null,
      })

      await expect(repository.deleteByKey('header')).resolves.not.toThrow()
    })

    it('should handle deletion errors', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      })

      await expect(repository.deleteByKey('test')).rejects.toThrow(DatabaseError)
    })
  })
})

describe('PageContentRepository', () => {
  let repository: PageContentRepository
  let mockSupabaseClient: any

  beforeEach(() => {
    repository = new PageContentRepository()

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }

    Object.defineProperty(repository, 'client', {
      get: () => mockSupabaseClient,
    })
  })

  describe('findPublished', () => {
    it('should return published pages', async () => {
      const mockPages = [
        createMockPageContent({ slug: 'home', published: true }),
        createMockPageContent({ slug: 'about', published: true }),
      ]

      // The final method in the chain (order) should return the promise
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPages,
        error: null,
      })

      const result = await repository.findPublished()

      expect(result).toEqual(mockPages)
    })
  })

  describe('findBySlug', () => {
    it('should return a page by slug', async () => {
      const mockPage = createMockPageContent({ slug: 'home' })

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockPage,
        error: null,
      })

      const result = await repository.findBySlug('home')

      expect(result).toEqual(mockPage)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', 'home')
    })

    it('should return null if page not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await repository.findBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('should create or update a page', async () => {
      const input = {
        slug: 'home',
        title: 'Home Page',
        data: { hero: { title: 'Welcome' } },
      }
      const mockPage = createMockPageContent(input)

      // The final method in the chain (single) should return the promise
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockPage,
        error: null,
      })

      const result = await repository.upsert(input)

      expect(result).toEqual(mockPage)
    })

    it('should handle upsert errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upsert failed' },
      })

      await expect(
        repository.upsert({ slug: 'test', title: 'Test', data: {} })
      ).rejects.toThrow(DatabaseError)
    })
  })

  describe('deleteBySlug', () => {
    it('should delete a page by slug', async () => {
      // The final method in the chain (eq) should return the promise
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: null,
      })

      await expect(repository.deleteBySlug('home')).resolves.not.toThrow()
    })

    it('should handle deletion errors', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      })

      await expect(repository.deleteBySlug('test')).rejects.toThrow(DatabaseError)
    })
  })
})
