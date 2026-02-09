"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, X, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCopyForAIMarkdown } from "@/lib/content-parser"
import { cn } from "@/lib/utils"

interface PostExportPromptProps {
  content: string
  onDismiss: () => void
  className?: string
}

/**
 * Shown after user exports their style guide. Offers next steps:
 * Copy for AI, share with team, edit anytime. Dismissible.
 */
export function PostExportPrompt({ content, onDismiss, className }: PostExportPromptProps) {
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  const handleCopyForAI = async () => {
    const text = getCopyForAIMarkdown(content)
    if (!text) {
      toast({
        title: "Nothing to copy",
        description: "Brand Voice and Style Rules sections were not found.",
        variant: "destructive",
      })
      return
    }
    setCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Paste into ChatGPT, Claude, or your AI tool's system prompt.",
      })
    } catch (err) {
      console.error("[PostExportPrompt] Copy failed:", err)
      toast({
        title: "Copy failed",
        description: "Please try again or use Download → Markdown.",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border border-blue-100 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30 px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Well done — you&apos;ve exported your style guide. Here&apos;s what to do next:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={handleCopyForAI}
              disabled={copying}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copying ? "Copying…" : "Copy for AI"}
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Paste into ChatGPT, Claude, or your AI writing tool
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            You can edit and re-export anytime from this page.
          </p>
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
