"use client"

import { Button } from "@/components/ui/button"
import { X, CheckCircle2, Users, Sparkles, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostExportPromptProps {
  content: string
  onDismiss: () => void
  className?: string
}

/**
 * Shown after user exports their style guide. Shows next steps:
 * share guidelines, use guidelines, update anytime. Dismissible.
 */
export function PostExportPrompt({ content, onDismiss, className }: PostExportPromptProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 px-5 py-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Your style guide is ready. Here&apos;s what to do next:
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-0.5 shrink-0 text-green-600" aria-hidden />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Share your guidelines
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Send the downloaded file to your team or stakeholders for sign-off
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-green-600" aria-hidden />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Use your guidelines
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Reference when writing content, or upload to AI tools like ChatGPT and Claude
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PenLine className="h-4 w-4 mt-0.5 shrink-0 text-green-600" aria-hidden />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Update anytime
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Edit and re-export whenever your brand evolves
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
