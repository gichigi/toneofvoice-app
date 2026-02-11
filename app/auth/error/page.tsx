"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { AuthError } from "@/components/ui/auth-error";
import { classifyAuthError } from "@/lib/auth-errors";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("message");

  const errorDetails = errorMessage
    ? classifyAuthError({ message: errorMessage })
    : {
        message: "Something went wrong during authentication. Please try again.",
        type: "UNKNOWN_ERROR" as const,
        canRetry: true,
      };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white py-12 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/50 to-white p-8 shadow-xl shadow-opacity-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-opacity-5">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-semibold">
          Authentication error
        </h1>
        <div className="mb-6">
          <AuthError error={errorDetails} />
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-up">Create new account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
