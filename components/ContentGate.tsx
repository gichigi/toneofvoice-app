// Design system: see DESIGN_SYSTEM.md for lock/blur visual treatment

"use client"

import {
  PREVIEW_H2_CLASS,
  PREVIEW_H2_STYLE,
  PREVIEW_H2_BAR_CLASS,
  PREVIEW_H2_MARGIN_TOP,
  PREVIEW_H2_MARGIN_BOTTOM,
  PREVIEW_SECTION_DESCRIPTION_CLASS,
  PREVIEW_EYEBROW_CLASS,
  getSectionDescription,
  getSectionEyebrow,
} from "@/lib/style-guide-styles"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface ContentGateProps {
  /** The markdown content to split and gate */
  content: string
  /** Whether to show the upgrade CTA */
  showUpgradeCTA?: boolean
  /** Callback when upgrade button is clicked */
  onUpgrade?: () => void
  /** Selected traits for MarkdownRenderer */
  selectedTraits?: string[]
  /** If true, show entire content blurred with lock overlay (section-level gating) */
  locked?: boolean
  /** Section heading to show above the lock overlay */
  sectionTitle?: string
  /** Section id for MarkdownRenderer (e.g. examples, word-list) */
  sectionId?: string
}

/**
 * ContentGate component shows section-level gating: when locked=true,
 * displays section heading + blurred content + lock overlay and upgrade CTA.
 */
export function ContentGate({ content, showUpgradeCTA = true, onUpgrade, selectedTraits = [], locked = false, sectionTitle, sectionId }: ContentGateProps) {
  // Section-level locking: show heading + explainer + lock overlay
  if (locked) {
    const sectionDescription = sectionTitle ? getSectionDescription(sectionTitle) : null
    // Strip "Unlock to see..." placeholder lines and following --- so they never show (current or future content)
    const strippedContent = content
      .replace(/\n*_Unlock to see[^_]+_[^\n]*\n(\s*---\s*\n)?/gi, "\n")
      .replace(/\n{3,}/g, "\n\n")
    // Preview snippet from stripped content only; skip placeholders and separator-only lines
    const strippedLines = strippedContent.split("\n").filter((l) => {
      const t = l.trim()
      if (!t.length) return false
      if (/^_Unlock to see[^_]+_$/i.test(t)) return false
      if (/^-+$/.test(t)) return false // --- only
      return true
    })
    const rawSnippet = strippedLines.slice(0, 2).join(" ").trim().slice(0, 120)
    const previewSnippet = rawSnippet && !/^-+$/.test(rawSnippet.trim()) ? rawSnippet : null

    return (
      <div className="animate-in fade-in duration-500 rounded-lg">
        {/* Visible section heading and explainer (same spacing as Brand Voice / MarkdownRenderer) */}
        {sectionTitle && (
          <>
            {getSectionEyebrow(sectionTitle) && (
              <p className={cn(PREVIEW_EYEBROW_CLASS, "mb-2")}>
                {getSectionEyebrow(sectionTitle)}
              </p>
            )}
            <h2 className={cn(PREVIEW_H2_CLASS, PREVIEW_H2_MARGIN_TOP, PREVIEW_H2_MARGIN_BOTTOM, "first:mt-0")} style={PREVIEW_H2_STYLE}>
              {sectionTitle}
            </h2>
            <div className={cn(PREVIEW_H2_BAR_CLASS, PREVIEW_H2_MARGIN_BOTTOM, "-mt-4")} />
            {sectionDescription && (
              <p className={cn(PREVIEW_SECTION_DESCRIPTION_CLASS, PREVIEW_H2_MARGIN_BOTTOM, "-mt-2")}>
                {sectionDescription}
              </p>
            )}
          </>
        )}

        <div className="relative min-h-[40vh]">
          {/* Blurred content preview */}
          <div className="blur-sm select-none pointer-events-none opacity-30 transition-all duration-500">
            <MarkdownRenderer content={strippedContent} selectedTraits={selectedTraits} sectionId={sectionId} />
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
            <div className="text-center space-y-4 p-8 max-w-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Lock className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              {previewSnippet && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                  &ldquo;{previewSnippet}...&rdquo;
                </p>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                This section is locked
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade to unlock all sections and get full editing access.
              </p>
              {showUpgradeCTA && onUpgrade && (
                <Button
                  onClick={onUpgrade}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock Full Guide
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not locked: render content as-is
  return <MarkdownRenderer content={content} selectedTraits={selectedTraits} sectionId={sectionId} />
}
