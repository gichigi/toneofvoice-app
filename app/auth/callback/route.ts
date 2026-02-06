import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { classifyAuthError } from "@/lib/auth-errors";

/** Handles OAuth redirects and email confirmation code exchange. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth provider errors
  if (errorParam) {
    console.error("[auth/callback] OAuth error:", errorParam, errorDescription);
    const errorDetails = classifyAuthError({
      message: errorDescription || errorParam,
    });
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errorDetails.message)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Classify and log the error
      const errorDetails = classifyAuthError(error);
      console.error(
        "[auth/callback] exchangeCodeForSession error:",
        errorDetails.type,
        errorDetails.message
      );

      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(errorDetails.message)}`
      );
    } catch (error) {
      const errorDetails = classifyAuthError(error);
      console.error("[auth/callback] Unexpected error:", error);
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(errorDetails.message)}`
      );
    }
  }

  // No code provided
  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent("Missing authentication code")}`
  );
}
