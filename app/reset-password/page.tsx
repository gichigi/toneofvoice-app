"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/components/ui/auth-error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidToken(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({
        password: password,
      });

      if (err) {
        setError(err.message);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password");
      console.error("[reset-password] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-green-100 bg-gradient-to-b from-green-50/50 to-white p-8 shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="mb-2 text-center text-2xl font-semibold">Password updated</h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            Your password has been successfully reset. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-gradient-to-b from-red-50/50 to-white p-8 shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Lock className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="mb-2 text-center text-2xl font-semibold">Invalid or expired link</h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
          <Lock className="h-7 w-7 text-black" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-semibold">Set new password</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Enter your new password below
        </p>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="New password"
              type="password"
              value={password}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Confirm new password"
              type="password"
              value={confirmPassword}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <AuthError error={error} className="mb-0" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
