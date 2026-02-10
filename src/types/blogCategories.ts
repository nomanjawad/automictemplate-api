/**
 * @module types/blogCategories
 * @description TypeScript types for blog categories and tags
 */

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface CreateBlogCategoryInput {
  name: string
  slug: string
  description?: string | null
}

export interface UpdateBlogCategoryInput {
  name?: string
  slug?: string
  description?: string | null
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface CreateBlogTagInput {
  name: string
  slug: string
}

export interface UpdateBlogTagInput {
  name?: string
  slug?: string
}

export interface BlogPostWithRelations {
  id: string
  title: string
  slug: string
  content: Record<string, any>
  excerpt?: string | null
  featured_image?: string | null
  status: string
  published: boolean
  published_at?: string | null
  scheduled_at?: string | null
  version: number
  author_id: string
  last_modified_by: string
  category_id?: string | null
  category?: BlogCategory | null
  tags?: BlogTag[]
  view_count: number
  reading_time_minutes?: number | null
  created_at: string
  updated_at: string
}
