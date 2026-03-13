"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { track as mpTrack, identify as mpIdentify } from "@/lib/mixpanel";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/components/ui/auth-error";
import { classifyAuthError } from "@/lib/auth-errors";
import { MetaPixel } from "@/lib/meta-pixel";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Route through /auth/claim so pending localStorage guides get saved before dashboard renders
  const redirectTo = searchParams.get("redirectTo") ?? "/auth/claim";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (err) {
        const errorDetails = classifyAuthError(err);
        setError(errorDetails.message);
        return;
      }
      if (data.user && !data.session) {
        // Email confirmation required - user created but not yet signed in
        mpIdentify(data.user.id, { $email: email, $name: name, signup_method: "email" })
        mpTrack("Signed Up", { method: "email" })
        MetaPixel.completeRegistration();
        MetaPixel.lead();
        setSuccess(true);
        return;
      }
      if (data.session) {
        // Instant sign-in (email confirmation disabled)
        mpIdentify(data.user!.id, { $email: email, $name: name, signup_method: "email" })
        mpTrack("Signed Up", { method: "email" })
        MetaPixel.completeRegistration();
        MetaPixel.lead();
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      const errorDetails = classifyAuthError(error);
      setError(errorDetails.message);
      console.error("[sign-up] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    // Set a flag so the dashboard can fire CompleteRegistration after OAuth redirect.
    // We guard against returning users on the dashboard side via created_at check.
    localStorage.setItem("meta_pixel_pending", "complete_registration");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (err) {
        // Clear the flag - OAuth failed so no registration will happen
        localStorage.removeItem("meta_pixel_pending");
        const errorDetails = classifyAuthError(err);
        setError(errorDetails.message);
        return;
      }
    } catch (error) {
      localStorage.removeItem("meta_pixel_pending");
      const errorDetails = classifyAuthError(error);
      setError(errorDetails.message);
      console.error("[sign-up] Google OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl shadow-opacity-10 text-center">
          <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl shadow-opacity-10">
        <h2 className="mb-2 text-center text-2xl font-semibold">
          Create your account
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Save, edit, and manage your guidelines.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignUp}
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
          <span className="mx-2 text-xs text-gray-400">or sign up with email</span>
          <div className="flex-grow border-t border-dashed border-gray-200" />
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Full name"
              type="text"
              value={name}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              placeholder="Password (min 8 characters)"
              type="password"
              value={password}
              required
              minLength={8}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <AuthError error={error} className="mb-0" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href={redirectTo !== "/auth/claim" ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` : "/sign-in"}
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
