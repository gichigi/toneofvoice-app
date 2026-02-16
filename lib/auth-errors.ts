/**
 * Auth-specific error handling utilities.
 * Provides consistent error messages and classification for authentication flows.
 */

export interface AuthErrorDetails {
  message: string;
  type: AuthErrorType;
  canRetry: boolean;
  suggestedAction?: string;
  originalError?: string;
}

export type AuthErrorType =
  | "NETWORK_ERROR"
  | "INVALID_CREDENTIALS"
  | "EMAIL_EXISTS"
  | "EMAIL_NOT_CONFIRMED"
  | "WEAK_PASSWORD"
  | "INVALID_EMAIL"
  | "OAUTH_ERROR"
  | "CONFIG_ERROR"
  | "RATE_LIMIT"
  | "UNKNOWN_ERROR";

const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  NETWORK_ERROR:
    "Unable to connect to server. Please check your internet connection and try again.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_EXISTS:
    "This email is already registered. Please sign in instead.",
  EMAIL_NOT_CONFIRMED:
    "Please check your email and click the confirmation link before signing in.",
  WEAK_PASSWORD: "Password must be at least 8 characters long.",
  INVALID_EMAIL: "Please enter a valid email address.",
  OAUTH_ERROR: "Sign in with Google failed. Please try again.",
  CONFIG_ERROR: "Configuration error. Please contact support.",
  RATE_LIMIT:
    "Too many attempts. Please wait a moment and try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

/**
 * Classify an auth error and return user-friendly details.
 */
export function classifyAuthError(error: any): AuthErrorDetails {
  // Handle TypeError instances (like "Failed to fetch")
  if (error instanceof TypeError) {
    const message = error.message?.toLowerCase() || String(error).toLowerCase();
    if (message.includes("failed to fetch") || message.includes("fetch")) {
      return {
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        type: "NETWORK_ERROR",
        canRetry: true,
        suggestedAction: "Check your internet connection and try again.",
        originalError: error.message || String(error),
      };
    }
  }

  const errorMessage =
    error?.message?.toLowerCase() ||
    error?.error?.toLowerCase() ||
    String(error).toLowerCase();

  // Network errors - check for various fetch failure patterns
  if (
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("networkerror") ||
    errorMessage.includes("network error") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("typeerror") ||
    errorMessage.includes("fetch")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
      type: "NETWORK_ERROR",
      canRetry: true,
      suggestedAction: "Check your internet connection and try again.",
      originalError: error?.message || String(error),
    };
  }

  // Invalid credentials
  if (
    errorMessage.includes("invalid login credentials") ||
    errorMessage.includes("invalid password") ||
    errorMessage.includes("wrong password") ||
    errorMessage.includes("incorrect password")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
      type: "INVALID_CREDENTIALS",
      canRetry: true,
      suggestedAction: "Double-check your email and password.",
      originalError: error?.message || String(error),
    };
  }

  // Email already exists
  if (
    errorMessage.includes("already registered") ||
    errorMessage.includes("already exists") ||
    errorMessage.includes("user already registered") ||
    errorMessage.includes("email already")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.EMAIL_EXISTS,
      type: "EMAIL_EXISTS",
      canRetry: false,
      suggestedAction: "Try signing in instead, or use a different email.",
      originalError: error?.message || String(error),
    };
  }

  // Email not confirmed
  if (
    errorMessage.includes("email not confirmed") ||
    errorMessage.includes("email_not_confirmed") ||
    errorMessage.includes("confirm your email")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED,
      type: "EMAIL_NOT_CONFIRMED",
      canRetry: false,
      suggestedAction: "Check your inbox and spam folder for the confirmation email.",
      originalError: error?.message || String(error),
    };
  }

  // Weak password
  if (
    errorMessage.includes("password") &&
    (errorMessage.includes("too short") ||
      errorMessage.includes("at least") ||
      errorMessage.includes("minimum"))
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
      type: "WEAK_PASSWORD",
      canRetry: true,
      suggestedAction: "Use at least 8 characters for your password.",
      originalError: error?.message || String(error),
    };
  }

  // Invalid email format
  if (
    errorMessage.includes("invalid email") ||
    errorMessage.includes("email format") ||
    errorMessage.includes("malformed email")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.INVALID_EMAIL,
      type: "INVALID_EMAIL",
      canRetry: true,
      suggestedAction: "Check your email address for typos.",
      originalError: error?.message || String(error),
    };
  }

  // OAuth errors
  if (
    errorMessage.includes("oauth") ||
    errorMessage.includes("google") ||
    errorMessage.includes("provider")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.OAUTH_ERROR,
      type: "OAUTH_ERROR",
      canRetry: true,
      suggestedAction: "Try signing in with email instead.",
      originalError: error?.message || String(error),
    };
  }

  // Configuration errors (wrong/missing API key, 401 from auth service, env)
  if (
    errorMessage.includes("missing supabase") ||
    errorMessage.includes("configuration") ||
    errorMessage.includes("env") ||
    errorMessage.includes("api key") ||
    errorMessage.includes("apikey") ||
    errorMessage.includes("invalid key") ||
    errorMessage.includes("401") ||
    errorMessage.includes("jwt")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.CONFIG_ERROR,
      type: "CONFIG_ERROR",
      canRetry: false,
      suggestedAction: "Please contact support if this persists.",
      originalError: error?.message || String(error),
    };
  }

  // Rate limiting
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("429")
  ) {
    return {
      message: AUTH_ERROR_MESSAGES.RATE_LIMIT,
      type: "RATE_LIMIT",
      canRetry: true,
      suggestedAction: "Wait a few moments before trying again.",
      originalError: error?.message || String(error),
    };
  }

  // Unknown error
  return {
    message: AUTH_ERROR_MESSAGES.UNKNOWN_ERROR,
    type: "UNKNOWN_ERROR",
    canRetry: true,
    originalError: error?.message || String(error),
  };
}

/**
 * Get a user-friendly error message from any auth error.
 */
export function getAuthErrorMessage(error: any): string {
  return classifyAuthError(error).message;
}
