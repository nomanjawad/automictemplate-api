export interface MediaFolder {
  name: string
  created_at: string
}

export interface MediaItem {
  id: string
  title: string
  description?: string | null
  alt_text?: string | null
  type: string
  author_name: string
  upload_date: string
  path: string
  url: string
  size?: number | null
  mime_type?: string | null
  created_at: string
  updated_at: string
}

export interface CreateMediaInput {
  title: string
  description?: string
  alt_text?: string
  type: string
  author_name: string
  upload_date?: string
  path: string
  url: string
  size?: number
  mime_type?: string
}

export interface UpdateMediaInput {
  title?: string
  description?: string
  alt_text?: string
}
