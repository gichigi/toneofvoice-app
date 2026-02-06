import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client for Client Components. Uses cookies for auth. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const missing = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(
      `Missing Supabase configuration: ${missing.join(", ")}. Please check your environment variables.`
    );
  }
  try {
    return createBrowserClient(url, key);
  } catch (error) {
    console.error("[supabase-browser] Failed to create client:", error);
    throw new Error(
      `Failed to initialize Supabase client: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
