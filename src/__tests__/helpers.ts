/**
 * Test helpers and utilities
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  } as any
}

/**
 * Create mock blog post data
 */
export function createMockBlogPost(overrides = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'test-blog-post',
    title: 'Test Blog Post',
    excerpt: 'This is a test excerpt',
    content: { body: 'Test content' },
    featured_image: 'https://example.com/image.jpg',
    author_id: '123e4567-e89b-12d3-a456-426614174001',
    tags: ['test', 'blog'],
    meta_data: { description: 'Test meta' },
    published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock common content data
 */
export function createMockCommonContent(overrides = {}) {
  return {
    key: 'header',
    data: {
      logo: 'https://example.com/logo.png',
      navigation: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock page content data
 */
export function createMockPageContent(overrides = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174002',
    slug: 'home',
    title: 'Home Page',
    data: {
      hero: {
        title: 'Welcome',
        subtitle: 'Test subtitle',
      },
    },
    meta_data: {
      title: 'Home - Test Site',
      description: 'Test description',
    },
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock authenticated user
 */
export function createMockUser(overrides = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174003',
    email: 'test@example.com',
    role: 'authenticated',
    ...overrides,
  }
}

/**
 * Mock Express request object
 */
export function createMockRequest(options: {
  body?: any
  params?: any
  query?: any
  user?: any
  headers?: any
} = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user || null,
    headers: options.headers || {},
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
  } as any
}

/**
 * Mock Express response object
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  }
  return res
}

/**
 * Mock Express next function
 */
export function createMockNext() {
  return jest.fn()
}
