import { supabase } from './supabaseClient.js'
export { supabase, supabaseClient } from './supabaseClient.js'

/**
 * Check Supabase REST API connection
 */
export async function checkSupabaseAPI() {
  if (!supabase) {
    return { ok: false, reason: 'Supabase client not initialized (missing URL or publishable key)' }
  }

  try {
    // Simple health check - query users table
    const { error } = await supabase.from('users').select('id').limit(1)

    if (error) {
      // If we get a permissions or table not found error, the API is still working
      if (error.code === 'PGRST301' || error.message.includes('permission denied') || error.code === '42P01') {
        return { ok: true, note: 'API reachable' }
      }
      return { ok: false, reason: error.message }
    }

    return { ok: true }
  } catch (err: any) {
    return { ok: false, reason: err?.message || String(err) }
  }
}

/**
 * Check Supabase Auth service
 */
export async function checkSupabaseAuth() {
  if (!supabase) {
    return { ok: false, reason: 'Supabase client not initialized' }
  }

  try {
    // Check if auth service is reachable by getting the session (will be null, but service responds)
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { ok: false, reason: error.message }
    }

    return { ok: true, sessionActive: !!data.session }
  } catch (err: any) {
    return { ok: false, reason: err?.message || String(err) }
  }
}

/**
 * Check Supabase Storage service
 */
export async function checkSupabaseStorage() {
  if (!supabase) {
    return { ok: false, reason: 'Supabase client not initialized' }
  }

  try {
    // List buckets (this will work with publishable key)
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      return { ok: false, reason: error.message }
    }

    return { ok: true, bucketsCount: data?.length || 0 }
  } catch (err: any) {
    return { ok: false, reason: err?.message || String(err) }
  }
}

/**
 * Check all Supabase services
 */
export async function checkAllConnections() {
  const [supabaseAPI, supabaseAuth, supabaseStorage] = await Promise.all([
    checkSupabaseAPI(),
    checkSupabaseAuth(),
    checkSupabaseStorage()
  ])

  const allHealthy = supabaseAPI.ok && supabaseAuth.ok && supabaseStorage.ok

  return {
    healthy: allHealthy,
    timestamp: new Date().toISOString(),
    services: {
      supabaseAPI,
      supabaseAuth,
      supabaseStorage
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      supabaseUrl: process.env.SUPABASE_URL ? '✓ configured' : '✗ missing',
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ? '✓ configured' : '✗ missing'
    }
  }
}

export default {
  checkAllConnections,
  checkSupabaseAPI,
  checkSupabaseAuth,
  checkSupabaseStorage
}
