"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { detectInputType, validateInput, sanitizeInput } from "@/lib/input-utils";
import Link from "next/link";

interface CreateGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Progressive loading word arrays
const descriptionWords = ["Thinking...", "Exploring...", "Assembling...", "Creating..."];
const urlWords = ["Reading...", "Understanding...", "Assembling...", "Creating..."];

export function CreateGuideModal({ open, onOpenChange }: CreateGuideModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [extractionStartTime, setExtractionStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset state when modal closes (but don't reset if extraction is in progress)
  useEffect(() => {
    if (!open && !isExtracting) {
      setUrl("");
      setError("");
      setErrorType(null);
      setIsSuccess(false);
      setLoadingMessage("");
      setExtractionStartTime(null);
    }
  }, [open, isExtracting]);

  // Cycle through loading messages
  useEffect(() => {
    if (!isExtracting || !extractionStartTime) return;

    const isUrl = url.trim().startsWith("http") || url.trim().includes(".");
    const words = isUrl ? urlWords : descriptionWords;

    const interval = setInterval(() => {
      const elapsed = Date.now() - extractionStartTime;
      const wordIndex = Math.floor(elapsed / 2000) % words.length;
      setLoadingMessage(words[wordIndex]);
    }, 200);

    return () => clearInterval(interval);
  }, [isExtracting, extractionStartTime, url]);

  // Helper to clamp descriptions to 200 chars
  const getEffectiveInput = (raw: string) => {
    const trimmed = raw.trim();
    const detection = detectInputType(trimmed);
    if (detection.inputType === "description" && trimmed.length > 200) {
      return trimmed.slice(0, 200);
    }
    return trimmed;
  };

  // Check if input is valid for submission
  const isInputValid = () => {
    const effective = getEffectiveInput(url);
    if (!effective) return false;
    const validation = validateInput(effective);
    return validation.isValid;
  };

  // Classify error types
  const classifyError = (error: any, response?: Response): { type: string; message: string } => {
    let errorMessage = "Unknown error";

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
    }

    // Network-specific errors
    if (error?.name === "AbortError" || errorMessage.includes("timeout")) {
      return {
        type: "TIMEOUT",
        message: "Site didn't respond. Try again or add details manually.",
      };
    }

    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return {
        type: "NETWORK",
        message: "Connection problem. Check your internet and try again.",
      };
    }

    // API error responses
    if (response?.status === 400) {
      return {
        type: "VALIDATION",
        message: errorMessage || "Invalid input. Please check and try again.",
      };
    }

    if (response?.status === 404) {
      return {
        type: "NOT_FOUND",
        message: "Site not found. Check the URL or add details manually.",
      };
    }

    if (response?.status === 429) {
      return {
        type: "RATE_LIMIT",
        message: "Too many requests. Please wait a moment and try again.",
      };
    }

    if (response?.status === 500 || response?.status === 502 || response?.status === 503) {
      return {
        type: "SERVER",
        message: "Problem analyzing site. Try again or add details manually.",
      };
    }

    return {
      type: "GENERIC",
      message: errorMessage || "Something went wrong. Try again or add details manually.",
    };
  };

  // Input validation
  const handleInputValidation = (input: string) => {
    const validation = validateInput(input);
    if (!validation.isValid && validation.error) {
      setError(validation.error);
      return false;
    }
    setError("");
    return validation;
  };

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType(null);
    setIsSuccess(false);

    const effective = getEffectiveInput(url);
    const validation = handleInputValidation(effective);
    if (!validation) return;

    // Handle empty input - navigate to manual entry
    if (validation.inputType === "empty") {
      onOpenChange(false);
      router.push("/brand-details");
      return;
    }

    setIsExtracting(true);
    const startTime = Date.now();
    setExtractionStartTime(startTime);

    const isUrl = validation.inputType === "url";
    const words = isUrl ? urlWords : descriptionWords;
    setLoadingMessage(words[0]);

    try {
      let response;
      if (validation.inputType === "url") {
        response = await fetch("/api/extract-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: validation.cleanInput }),
        });
      } else {
        response = await fetch("/api/extract-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: validation.cleanInput }),
        });
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = { success: false, error: "Invalid response format" };
      }

      if (data.success) {
        // Save to localStorage
        const brandDetails = {
          name: data.brandName || "",
          brandDetailsDescription: data.brandDetailsDescription,
          audience: data.audience || "",
        };
        if (data.keywords) {
          const kw = Array.isArray(data.keywords) ? data.keywords.join("\n") : String(data.keywords);
          localStorage.setItem("brandKeywords", kw);
        }
        if (data.suggestedTraits) {
          localStorage.setItem("suggestedTraits", JSON.stringify(data.suggestedTraits));
        }
        localStorage.setItem("brandDetails", JSON.stringify(brandDetails));

        // Show success state briefly
        setIsSuccess(true);
        setIsExtracting(false);
        setLoadingMessage("");
        setExtractionStartTime(null);

        // Close modal and redirect after short delay
        setTimeout(() => {
          onOpenChange(false);
          router.push("/brand-details?fromExtraction=true");
        }, 800);
      } else {
        // Show error
        const { type, message } = classifyError(data || {}, response);
        setError(message);
        setErrorType(type);

        setIsExtracting(false);
        setIsSuccess(false);
        setLoadingMessage("");
        setExtractionStartTime(null);
      }
    } catch (error) {
      const { type, message } = classifyError(error);
      setError(message);
      setErrorType(type);

      setIsExtracting(false);
      setIsSuccess(false);
      setLoadingMessage("");
      setExtractionStartTime(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing during extraction
      if (!newOpen && isExtracting) {
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new guide</DialogTitle>
          <DialogDescription>
            Enter a website URL or short description to get started, or continue manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleExtraction} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter URL or short description"
                className={`
                  pl-10 pr-4 py-3
                  text-base font-medium
                  border-blue-200
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  placeholder:text-gray-500 placeholder:font-normal placeholder:text-sm
                  transition-all duration-200
                  ${error ? "ring-2 ring-red-500 border-red-500" : ""}
                  ${isSuccess ? "ring-2 ring-green-500 bg-green-50" : ""}
                `}
                value={url}
                onChange={(e) => {
                  const sanitizedValue = sanitizeInput(e.target.value, url);
                  setUrl(sanitizedValue);
                  if (error) {
                    setError("");
                    setErrorType(null);
                  }
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={isExtracting || isSuccess}
                aria-label="Website URL or brand description"
                aria-describedby={error ? "input-error" : undefined}
              />
            </div>

            {/* Error display */}
            {error && (
              <div
                id="input-error"
                className="text-red-600 text-sm font-medium flex items-start gap-1 leading-5"
                role="alert"
                aria-live="polite"
              >
                <svg className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Character count for descriptions */}
            {(() => {
              const trimmed = url.trim();
              const hasSpace = trimmed.includes(" ");
              const detection = detectInputType(trimmed);
              const isDesc = detection.inputType === "description" && hasSpace;

              if (!isDesc || error) return null;

              const len = trimmed.length;
              return (
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {len <= 200 ? `${len}/200 characters` : "Using first 200 characters"}
                </span>
              );
            })()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <Link
              href="/brand-details"
              onClick={() => {
                onOpenChange(false);
              }}
              className="text-gray-500 underline font-medium text-xs sm:text-sm whitespace-nowrap text-center sm:text-left"
              style={{ textTransform: "lowercase" }}
            >
              add manually
            </Link>

            <Button
              type="submit"
              size="lg"
              className={`
                w-full sm:w-auto
                bg-black text-white font-semibold
                hover:bg-gray-800
                transition-all duration-200
                ${isSuccess ? "bg-green-500 hover:bg-green-600" : ""}
                ${!isInputValid() && !isExtracting && !isSuccess ? "opacity-75 cursor-not-allowed" : ""}
              `}
              disabled={isExtracting || isSuccess || !isInputValid()}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>{loadingMessage || "Processing"}</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <span>Done!</span>
                </>
              ) : (() => {
                const trimmed = url.trim();
                const hasSpace = trimmed.includes(" ");
                const detection = detectInputType(trimmed);
                const isDesc = detection.inputType === "description" && hasSpace;

                if (isDesc && trimmed.length < 25) {
                  return <span>Min. 25 characters</span>;
                }

                return (
                  <>
                    <span>Generate</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                );
              })()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
