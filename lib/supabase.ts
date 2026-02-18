import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Lazily initialise so the env check only fires inside a request handler,
// not at module evaluation time (which happens during Next.js build).
function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    _client = createClient(url, key)
  }
  return _client
}

// Proxy defers client creation until first property access, keeping build safe.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return (getClient() as any)[prop as string]
  },
})

// Email capture types
export interface EmailCapture {
  id?: string
  session_token: string
  email: string
  captured_at?: string
  payment_completed: boolean
} 