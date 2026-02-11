"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/components/ui/auth-error";
import { classifyAuthError } from "@/lib/auth-errors";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        const errorDetails = classifyAuthError(err);
        setError(errorDetails.message);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const errorDetails = classifyAuthError(error);
      setError(errorDetails.message);
      console.error("[sign-in] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (err) {
        const errorDetails = classifyAuthError(err);
        setError(errorDetails.message);
        return;
      }
    } catch (error) {
      const errorDetails = classifyAuthError(error);
      setError(errorDetails.message);
      console.error("[sign-in] Google OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl shadow-opacity-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-opacity-5">
          <LogIn className="h-7 w-7 text-black" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-semibold">Sign in</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Access your account to manage style guides
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border bg-white py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="h-5 w-5"
          />
          Continue with Google
        </button>

        <div className="my-4 flex w-full items-center">
          <div className="flex-grow border-t border-dashed border-gray-200" />
          <span className="mx-2 text-xs text-gray-400">or sign in with email</span>
          <div className="flex-grow border-t border-dashed border-gray-200" />
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Email"
              type="email"
              value={email}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Password"
              type="password"
              value={password}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <AuthError error={error} className="mb-0" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href={
              redirectTo !== "/dashboard"
                ? `/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`
                : "/sign-up"
            }
            className="font-medium text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
