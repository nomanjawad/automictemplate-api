/**
 * @module types/content
 * @description TypeScript types for content domain
 */

export interface CommonContent {
  id: string
  key: string
  data: Record<string, any> // JSONB content validated by @atomictemplate/validations
  created_at: string
  updated_at: string
}

export interface PageContent {
  id: string
  slug: string
  title: string
  data: Record<string, any> // JSONB content validated by @atomictemplate/validations
  meta_data: Record<string, any> | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface CreateCommonContentInput {
  key: string
  data: Record<string, any>
}

export interface UpdateCommonContentInput {
  data: Record<string, any>
}

export interface CreatePageContentInput {
  slug: string
  title: string
  data: Record<string, any>
  meta_data?: Record<string, any> | null
  published?: boolean
}

export interface UpdatePageContentInput {
  title?: string
  data?: Record<string, any>
  meta_data?: Record<string, any> | null
  published?: boolean
}
