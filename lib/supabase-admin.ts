import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null
let _adminKey: string | null = null

/** Admin Supabase client for server-side operations (bypasses RLS). Lazy-init to avoid throwing at module load when env is missing. */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase admin env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  // Re-create if key changed (e.g. env reload in dev)
  if (_admin && _adminKey === key) return _admin
  _admin = createClient(url, key)
  _adminKey = key
  return _admin
}