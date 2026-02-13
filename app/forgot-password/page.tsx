"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/components/ui/auth-error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset email");
      console.error("[forgot-password] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-green-100 bg-gradient-to-b from-green-50/50 to-white p-8 shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Mail className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="mb-2 text-center text-2xl font-semibold">Check your email</h2>
          <p className="mb-6 text-center text-sm text-gray-600">
            We sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="mb-6 text-center text-xs text-gray-500">
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
          <Mail className="h-7 w-7 text-black" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-semibold">Reset password</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Enter your email and we'll send you a link to reset your password
        </p>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
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
          <AuthError error={error} className="mb-0" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/sign-in" className="font-medium text-blue-600 hover:underline">
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
