/**
 * Simple inline error component for auth forms.
 * Consistent styling and behavior across sign-in/sign-up pages.
 */

import { AlertCircle } from "lucide-react";
import { AuthErrorDetails } from "@/lib/auth-errors";

interface AuthErrorProps {
  error: AuthErrorDetails | string | null;
  className?: string;
}

export function AuthError({ error, className = "" }: AuthErrorProps) {
  if (!error) return null;

  // Handle string errors (backward compatibility)
  const errorDetails: AuthErrorDetails =
    typeof error === "string"
      ? {
          message: error,
          type: "UNKNOWN_ERROR",
          canRetry: true,
        }
      : error;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 ${className}`}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
      <div className="flex-1 space-y-1">
        <p className="font-medium">{errorDetails.message}</p>
        {errorDetails.suggestedAction && (
          <p className="text-xs text-red-700 opacity-90">
            {errorDetails.suggestedAction}
          </p>
        )}
      </div>
    </div>
  );
}
