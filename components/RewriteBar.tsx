"use client"

import React, { useState, RefObject, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PenLine, Send, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { GuideEditorRef } from "@/components/editor/GuideEditor"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

type RewriteScope = "section" | "selection" | "document"

interface RewriteBarProps {
  onRewrite: (instruction: string, scope: RewriteScope, selectedText?: string, selectionRange?: unknown) => Promise<void>
  isLoading: boolean
  className?: string
  editorRef?: RefObject<GuideEditorRef | null>
  activeSectionId?: string
  /** When true, same bar with muted styling and no submit; message shown on hover/tap */
  disabled?: boolean
  disabledMessage?: string
  /** Called when scope is "selection" and we have captured text, so parent can show persistent highlight */
  onSelectionForHighlight?: (text: string | null) => void
}

export function RewriteBar({ onRewrite, isLoading, className, editorRef, activeSectionId, disabled, disabledMessage, onSelectionForHighlight }: RewriteBarProps) {
  const { state, isMobile } = useSidebar()
  const [instruction, setInstruction] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [scope, setScope] = useState<RewriteScope>(() => {
    // Initialize scope based on whether we're on the cover page
    return activeSectionId === "cover" ? "document" : "section"
  })
  const [hasSelection, setHasSelection] = useState(false)
  // Persist selected text when focus moves to dropdown/input so "Selected Text" still works
  const [capturedSelectionText, setCapturedSelectionText] = useState<string | null>(null)
  const capturedSelectionRef = useRef<string | null>(null)
  // Save Plate.js selection range for direct editor replacement
  const capturedSelectionRange = useRef<unknown | null>(null)

  const getSelectedText = (): string | undefined => {
    if (typeof window === "undefined") return undefined

    // Get text and selection range from Plate.js editor
    if (editorRef?.current?.getSelectedText && editorRef?.current?.getSelection) {
      const editorText = editorRef.current.getSelectedText()
      if (editorText?.trim()) {
        // Save the Plate.js selection range for later replacement
        capturedSelectionRange.current = editorRef.current.getSelection()
        return editorText.trim()
      }
    }

    // Fallback to DOM selection
    capturedSelectionRange.current = null
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return undefined
    const text = selection.toString().trim()
    return text || undefined
  }

  const checkSelection = React.useCallback(() => {
    const text = getSelectedText()
    if (text) {
      setHasSelection(true)
      setCapturedSelectionText(text)
      capturedSelectionRef.current = text
    } else {
      setHasSelection(false)
    }
  }, [])

  // Capture selection on mouseup (when user finishes selecting)
  // Browser handles visual feedback natively - no React interference
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is finalized
      setTimeout(checkSelection, 10)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [checkSelection])

  const handleScopeChange = (value: string) => {
    const newScope = value as RewriteScope
    setScope(newScope)
    if (newScope !== "selection") {
      setCapturedSelectionText(null)
      capturedSelectionRef.current = null
      onSelectionForHighlight?.(null)
    }
  }

  // Auto-switch from "section" to "document" when on cover page
  useEffect(() => {
    if (scope === "section" && activeSectionId === "cover") {
      setScope("document")
    }
  }, [scope, activeSectionId])

  // Sync captured selection to parent for persistent highlight when scope is "selection".
  // Defer so we don't update parent (and Plate's decorate prop) during render - avoids
  // "Cannot update PlateContent while rendering HydrateAtoms" from Jotai/Plate.
  useEffect(() => {
    if (!onSelectionForHighlight) return
    if (scope !== "selection") {
      onSelectionForHighlight(null)
      return
    }
    const text = capturedSelectionRef.current ?? capturedSelectionText
    const id = requestAnimationFrame(() => {
      onSelectionForHighlight(text ?? null)
    })
    return () => cancelAnimationFrame(id)
  }, [scope, capturedSelectionText, onSelectionForHighlight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instruction.trim() || isLoading) return

    let selectedText: string | undefined
    if (scope === "selection") {
      selectedText = capturedSelectionRef.current ?? capturedSelectionText ?? getSelectedText()
      if (!selectedText) {
        setScope("section")
        selectedText = undefined
      }
    }

    try {
      await onRewrite(instruction, scope, selectedText, capturedSelectionRange.current ?? undefined)
      if (scope === "selection" && selectedText) {
        setCapturedSelectionText(null)
        capturedSelectionRef.current = null
        capturedSelectionRange.current = null
        onSelectionForHighlight?.(null)
      }
      setIsSuccess(true)
      setInstruction("")
      setTimeout(() => setIsSuccess(false), 2000)
    } catch (error) {
      // Error handling is done in parent, but we shouldn't show success
      console.error("Rewrite failed", error)
    }
  }

  const placeholderText = scope === "selection"
    ? "Ask AI to rewrite selected text..."
    : scope === "document"
      ? "Ask AI to rewrite entire document..."
      : "Ask AI to rewrite this section..."

  // Responsive left positioning: mobile (no sidebar) | desktop expanded | desktop collapsed
  const leftPosition = isMobile
    ? "left-0"
    : state === "collapsed"
      ? "md:left-[var(--sidebar-width-icon,3rem)]"
      : "md:left-[var(--sidebar-width,18rem)]"

  const wrapperClass = cn(
    "pdf-exclude fixed bottom-0 right-0 md:bottom-4 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 z-30 backdrop-blur-sm transition-[left] duration-200 ease-linear",
    leftPosition
  )
  const innerClass = "w-full max-w-3xl mx-auto relative transition-all duration-500 ease-out"
  const barBaseClass = "relative flex items-center rounded-xl border border-gray-200 bg-white shadow-lg shadow-black/5 transition-all duration-500 ease-out"

  if (disabled) {
    return (
      <div className={cn(wrapperClass, className)}>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(innerClass, "cursor-default")}>
                <div
                  className={cn(
                    barBaseClass,
                    "opacity-75 bg-gray-50 border-gray-200 text-gray-500 pointer-events-none select-none"
                  )}
                  aria-disabled="true"
                >
                  <div className="pl-4 text-gray-400 z-10">
                    <PenLine className="size-5" />
                  </div>
                  <Select value="section" disabled>
                    <SelectTrigger className="w-[160px] md:w-[165px] border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 mr-1 md:mr-2 text-sm md:text-base text-gray-500 shrink-0 [&>span]:line-clamp-none [&>span]:whitespace-nowrap">
                      <SelectValue placeholder="This Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="section">This Section</SelectItem>
                      <SelectItem value="selection">Selected Text</SelectItem>
                      <SelectItem value="document">Whole Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    readOnly
                    value=""
                    placeholder="Ask AI to rewrite..."
                    className="flex-1 border-0 bg-transparent py-6 text-sm md:text-base shadow-none placeholder:text-gray-400 text-gray-500 cursor-default"
                  />
                  <div className="pr-2 z-10">
                    <Button type="button" size="sm" disabled className="rounded-lg h-9 w-9 p-0 shadow-md opacity-50 bg-gray-400 cursor-not-allowed">
                      <Send className="size-4 ml-0.5" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
              {disabledMessage ?? "Sign in or upgrade to Pro to use AI assist"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className={cn(wrapperClass, className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(innerClass, isSuccess && "scale-[1.02] animate-in zoom-in-95 duration-300")}
      >
        <div className={cn(
          barBaseClass,
          isSuccess
            ? "border-green-500 ring-2 ring-green-500/20 shadow-green-500/10"
            : "focus-within:border-gray-300",
          isLoading && "opacity-90"
        )}>
          {isLoading && (
            <div className="absolute inset-0 rounded-xl bg-gray-100/80 opacity-70" />
          )}

          <div className={cn(
            "pl-4 transition-all duration-500 z-10",
            isSuccess ? "text-green-600 scale-110" : "text-gray-600"
          )}>
            <PenLine className="size-5" />
          </div>

          <Select value={scope} onValueChange={handleScopeChange}>
            <SelectTrigger className="w-[160px] md:w-[165px] border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 mr-1 md:mr-2 text-sm md:text-base shrink-0 [&>span]:line-clamp-none [&>span]:whitespace-nowrap">
              <SelectValue placeholder="This Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section">This Section</SelectItem>
              <SelectItem value="selection">
                Selected Text
              </SelectItem>
              <SelectItem value="document">Whole Document</SelectItem>
            </SelectContent>
          </Select>

          {scope === "selection" && (capturedSelectionText ?? capturedSelectionRef.current) && (
            <span
              className="shrink-0 max-w-[100px] md:max-w-[200px] truncate rounded-md bg-gray-200/80 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              title={capturedSelectionText ?? capturedSelectionRef.current ?? undefined}
            >
              {(capturedSelectionText ?? capturedSelectionRef.current ?? "").slice(0, 40)}
              {(capturedSelectionText ?? capturedSelectionRef.current ?? "").length > 40 ? "…" : ""}
            </span>
          )}

          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 border-0 bg-transparent py-6 text-sm md:text-base shadow-none focus-visible:ring-0 focus:outline-none placeholder:text-gray-400 transition-all duration-300"
            disabled={isLoading}
          />

          <div className="pr-2 z-10">
            <Button
              type="submit"
              size="sm"
              disabled={!instruction.trim() || isLoading || (scope === "selection" && !hasSelection && !capturedSelectionText)}
              className={cn(
                "rounded-lg transition-all duration-500 h-9 w-9 p-0 shadow-md focus-visible:ring-gray-300",
                isSuccess
                  ? "bg-green-600 hover:bg-green-700 scale-110 shadow-green-500/30"
                  : "bg-gray-900 hover:bg-gray-800 hover:scale-105 active:scale-95",
                (!instruction.trim() || (scope === "selection" && !hasSelection && !capturedSelectionText)) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="size-4 animate-in zoom-in duration-300" />
              ) : (
                <Send className="size-4 ml-0.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
