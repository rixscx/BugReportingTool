import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables at build time
const hasValidConfig = Boolean(supabaseUrl && supabaseAnonKey)

if (!hasValidConfig && typeof window !== 'undefined') {
  // This error will be visible in browser console even after terser removes console.log
  const errorMsg = '❌ Missing Supabase environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY'
  if (import.meta.env.DEV) {
    console.error(errorMsg)
  }
}

// Create client with fallback to prevent crash - will show auth error instead of blank page
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : ''
      }
    })
  : null

// Export flag for components to check
export const isSupabaseConfigured = hasValidConfig
