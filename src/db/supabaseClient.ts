/**
 * @module db/supabaseClient
 * @description Supabase client initialization and configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

/** @constant {string} Supabase project URL from environment */
const SUPABASE_URL = process.env.SUPABASE_URL || ''

/**
 * @constant {string} Supabase service role key
 * Uses service role key to bypass RLS policies on backend
 * This is safe because authentication is verified via JWT middleware first
 * Falls back to anon key if service role key is not available
 */
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

if (!SUPABASE_URL) {
  logger.error('SUPABASE_URL is not set')
}

if (!SUPABASE_KEY) {
  logger.error('No Supabase key found in environment variables')
}

// Warn if using anon key instead of service role key
if (SUPABASE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
  logger.warn('Using SUPABASE_ANON_KEY in production - consider using SUPABASE_SERVICE_ROLE_KEY for better RLS handling')
}

/**
 * Supabase client instance
 * Configured with auto token refresh, no session persistence (backend)
 * @type {SupabaseClient | null}
 */
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: false, // Backend doesn't need to persist sessions
          detectSessionInUrl: false
        }
      })
    : null

// Log initialization status only on failure
if (!supabase) {
  logger.error('Supabase client failed to initialize')
}

/**
 * Alias for supabase client (backwards compatibility)
 * @type {SupabaseClient | null}
 */
export const supabaseClient = supabase
