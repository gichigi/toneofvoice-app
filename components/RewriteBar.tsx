"use client"

import React, { useState, RefObject, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PenLine, Send, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { GuideEditorRef } from "@/components/editor/GuideEditor"
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
  onRewrite: (instruction: string, scope: RewriteScope, selectedText?: string) => Promise<void>
  isLoading: boolean
  className?: string
  editorRef?: RefObject<GuideEditorRef | null>
  activeSectionId?: string
  /** When true, same bar with muted styling and no submit; message shown on hover/tap */
  disabled?: boolean
  disabledMessage?: string
}

export function RewriteBar({ onRewrite, isLoading, className, editorRef, activeSectionId, disabled, disabledMessage }: RewriteBarProps) {
  const [instruction, setInstruction] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [scope, setScope] = useState<RewriteScope>("section")
  const [hasSelection, setHasSelection] = useState(false)

  const getSelectedText = (): string | undefined => {
    if (typeof window === "undefined") return undefined
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return undefined
    const text = selection.toString().trim()
    return text || undefined
  }

  // Check for selection periodically
  useEffect(() => {
    const checkSelection = () => {
      const selected = !!getSelectedText()
      setHasSelection(selected)
    }

    // Check on mount and when scope changes
    checkSelection()

    // Listen for selection changes
    document.addEventListener("selectionchange", checkSelection)
    return () => document.removeEventListener("selectionchange", checkSelection)
  }, [scope])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instruction.trim() || isLoading) return

    let selectedText: string | undefined
    if (scope === "selection") {
      selectedText = getSelectedText()
      if (!selectedText) {
        // No selection, fall back to section
        setScope("section")
        selectedText = undefined
      }
    }

    try {
      await onRewrite(instruction, scope, selectedText)
      
      // Show success state briefly
      setIsSuccess(true)
      setInstruction("")
      setTimeout(() => setIsSuccess(false), 2000)
    } catch (error) {
      // Error handling is done in parent, but we shouldn't show success
      console.error("Rewrite failed", error)
    }
  }

  const placeholderText = scope === "selection"
    ? "Ask AI to rewrite selected text (e.g. 'Make it more professional')"
    : scope === "document"
      ? "Ask AI to rewrite entire document (e.g. 'Make it more professional')"
      : "Ask AI to rewrite this section (e.g. 'Make it more professional')"

  const wrapperClass = "pdf-exclude fixed bottom-4 left-0 right-0 ml-[var(--sidebar-width,18rem)] p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 z-30 backdrop-blur-sm"
  const innerClass = "max-w-3xl mx-auto relative transition-all duration-500 ease-out"
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
                    <SelectTrigger className="w-[140px] border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 mr-2 text-gray-500">
                      <SelectValue />
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
                    placeholder="Ask AI to rewrite this section..."
                    className="flex-1 border-0 bg-transparent py-6 text-base shadow-none placeholder:text-gray-400 text-gray-500 cursor-default"
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
            ? "border-green-500 ring-4 ring-green-500/20 shadow-green-500/10"
            : "focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-300 focus-within:shadow-gray-200",
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

          <Select value={scope} onValueChange={(value) => setScope(value as RewriteScope)}>
            <SelectTrigger className="w-[140px] border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 mr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section">This Section</SelectItem>
              <SelectItem value="selection" disabled={!hasSelection}>
                Selected Text {!hasSelection && "(select text first)"}
              </SelectItem>
              <SelectItem value="document">Whole Document</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 border-0 bg-transparent py-6 text-base shadow-none focus-visible:ring-0 placeholder:text-gray-400 transition-all duration-300"
            disabled={isLoading}
          />

          <div className="pr-2 z-10">
            <Button
              type="submit"
              size="sm"
              disabled={!instruction.trim() || isLoading || (scope === "selection" && !hasSelection)}
              className={cn(
                "rounded-lg transition-all duration-500 h-9 w-9 p-0 shadow-md focus-visible:ring-gray-300",
                isSuccess
                  ? "bg-green-600 hover:bg-green-700 scale-110 shadow-green-500/30"
                  : "bg-gray-900 hover:bg-gray-800 hover:scale-105 active:scale-95",
                (!instruction.trim() || (scope === "selection" && !hasSelection)) && "opacity-50 cursor-not-allowed"
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
