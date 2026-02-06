import { supabase } from '../db/supabaseClient.js'
import type { Session } from '@supabase/supabase-js'
import { logger } from '../utils/index.js'

/**
 * Session Controller
 * Manages user sessions using Supabase's built-in session handling
 */

export interface SessionTokens {
  access_token: string
  refresh_token: string
}

/**
 * Set/restore a user session from tokens
 * Use this when you need to perform authenticated database operations on behalf of a user
 */
export async function setUserSession(tokens: SessionTokens): Promise<{
  session: Session | null
  error: Error | null
}> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') }
  }

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    })

    if (error) {
      logger.error('Failed to set session', { error: error.message })
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (err: any) {
    logger.error('Session error', { error: err.message || err })
    return { session: null, error: err }
  }
}

/**
 * Get the current active session
 */
export async function getCurrentSession(): Promise<{
  session: Session | null
  error: Error | null
}> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (err: any) {
    return { session: null, error: err }
  }
}

/**
 * Refresh the current session using the refresh token
 * Returns a new session with updated access_token
 */
export async function refreshSession(refresh_token: string): Promise<{
  session: Session | null
  error: Error | null
}> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') }
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      logger.error('Failed to refresh session', { error: error.message })
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (err: any) {
    logger.error('Refresh error', { error: err.message || err })
    return { session: null, error: err }
  }
}

/**
 * Clear the current session (logout)
 */
export async function clearSession(): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') }
  }

  try {
    const { error } = await supabase.auth.signOut()
    return { error: error || null }
  } catch (err: any) {
    return { error: err }
  }
}

/**
 * Middleware helper: Set session from request headers and perform authenticated action
 * Useful for routes that need to act on behalf of the authenticated user
 */
export async function withUserSession<T>(
  tokens: SessionTokens,
  action: () => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  const { session, error: sessionError } = await setUserSession(tokens)

  if (sessionError || !session) {
    return { data: null, error: sessionError || new Error('Failed to establish session') }
  }

  try {
    const result = await action()
    return { data: result, error: null }
  } catch (err: any) {
    return { data: null, error: err }
  }
}
