import { User } from '@supabase/supabase-js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      userProfile?: {
        id: string
        email: string
        full_name?: string
        role: 'user' | 'admin' | 'moderator'
        avatar_url?: string
      }
    }
  }
}
