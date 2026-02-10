/**
 * Custom Codes Types
 * Types for analytics, meta tags, and other custom code snippets
 */

export type CodeType = 'analytics' | 'meta' | 'tracking' | 'verification' | 'custom'
export type CodePosition = 'head' | 'body_start' | 'body_end'

export interface CustomCode {
  id: string
  name: string
  code: string
  type: CodeType
  position: CodePosition
  author_name?: string
  status: boolean
  created_at: string
  updated_at: string
}

export interface CreateCustomCodeInput {
  name: string
  code: string
  type: CodeType
  position: CodePosition
  author_name?: string
  status?: boolean
}

export interface UpdateCustomCodeInput {
  name?: string
  code?: string
  type?: CodeType
  position?: CodePosition
  author_name?: string
  status?: boolean
}

export interface CustomCodeWithMetadata extends CustomCode {
  created_by?: string
  last_modified_by?: string
}
