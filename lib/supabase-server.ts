import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Error thrown when Supabase env is missing. Routes can catch and return 503. */
export class MissingSupabaseConfigError extends Error {
  constructor() {
    super(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    this.name = "MissingSupabaseConfigError";
  }
}

/** Server Supabase client for Server Components and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new MissingSupabaseConfigError();
  }
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component - ignore; middleware handles refresh
        }
      },
    },
  });
}
