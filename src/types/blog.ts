/**
 * @module types/blog
 * @description TypeScript types for blog domain
 */

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: Record<string, any> // JSONB content
  featured_image: string | null
  author_id: string | null
  tags: string[]
  meta_data: Record<string, any> | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateBlogPostInput {
  slug: string
  title: string
  excerpt?: string | null
  content: Record<string, any>
  featured_image?: string | null
  author_id?: string | null
  tags?: string[]
  meta_data?: Record<string, any> | null
  published?: boolean
}

export interface UpdateBlogPostInput {
  title?: string
  excerpt?: string | null
  content?: Record<string, any>
  featured_image?: string | null
  tags?: string[]
  meta_data?: Record<string, any> | null
  published?: boolean
}
