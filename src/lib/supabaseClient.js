import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  console.error('Make sure to set these in your .env file or deployment platform')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
