import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error('SUPABASE_CONFIG_MISSING')
    error.name = 'NetworkBlockedError'
    throw error
  }

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      const networkError = new Error('NETWORK_BLOCKED')
      networkError.name = 'NetworkBlockedError'
      throw networkError
    }
    throw error
  }
}



