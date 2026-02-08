"use client"

import { RefObject, useEffect, useState } from "react"
import { playfairDisplay } from "@/lib/fonts"
import { createPortal } from "react-dom"
import { Eye, PenLine } from "lucide-react"
import { StyleGuideCover } from "@/components/StyleGuideCover"
import { StyleGuideEditor, type StyleGuideEditorRef } from "@/components/editor/StyleGuideEditor"
import { ContentGate } from "@/components/ContentGate"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { RewriteBar } from "@/components/RewriteBar"
import {
  StyleGuideSection,
  Tier,
  buildEditableMarkdown,
} from "@/lib/content-parser"
import { cn } from "@/lib/utils"

export interface StyleGuideViewProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  scrollContainerRef: RefObject<HTMLDivElement | null>
  viewMode: "preview" | "edit"
  onModeSwitch: (mode: "preview" | "edit") => void
  content: string
  onContentChange: (markdown: string) => void
  brandName: string
  guideType?: "core" | "complete"
  showPreviewBadge?: boolean
  isUnlocked: (minTier?: Tier) => boolean
  onRewrite: (instruction: string, scope: "section" | "selection" | "document", selectedText?: string) => Promise<void>
  isRewriting: boolean
  isSectionLocked: boolean
  onUpgrade: () => void
  editorKey: number
  editorRef: RefObject<StyleGuideEditorRef | null>
  storageKey: string
  editorId: string
  /** Show RewriteBar and floating toggle (true for preview always, true for full-access when paid) */
  showEditTools: boolean
  /** Optional banner above editor (e.g. "Style Guide Updated") */
  editorBanner?: React.ReactNode
  pdfFooter?: React.ReactNode
  /** Optional class for the content wrapper (e.g. opacity when retrying) */
  contentClassName?: string
}

/**
 * Single shared style guide view: cover, sections, preview/editor modes,
 * RewriteBar, floating toggle. Used by both /preview and /full-access.
 */
export function StyleGuideView({
  sections,
  activeSectionId,
  scrollContainerRef,
  viewMode,
  onModeSwitch,
  content,
  onContentChange,
  brandName,
  guideType = "core",
  showPreviewBadge = false,
  isUnlocked,
  onRewrite,
  isRewriting,
  isSectionLocked,
  onUpgrade,
  editorKey,
  editorRef,
  storageKey,
  editorId,
  showEditTools,
  editorBanner,
  pdfFooter = null,
  contentClassName,
}: StyleGuideViewProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const nonCover = sections.filter((s) => s.id !== "cover")
  const unlockedSections = nonCover.filter((s) => isUnlocked(s.minTier))
  const lockedSections = nonCover.filter((s) => !isUnlocked(s.minTier))
  const lockedMarkdown = lockedSections
    .map((s) => `## ${s.title}\n\n${s.content}`.trim())
    .join("\n\n")
  const editableMarkdown = buildEditableMarkdown(sections, isUnlocked)
  const editorMarkdown = `# ${brandName}\n\n${editableMarkdown}`

  const selectedTraits = (() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("selectedTraits") : null
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          id="pdf-export-content"
          className={cn(
            playfairDisplay.variable,
            "bg-white rounded-lg border shadow-sm overflow-hidden",
            viewMode === "preview" && "preview-document",
            contentClassName
          )}
        >
          {viewMode === "preview" ? (
            <>
              <div id="cover" className="scroll-mt-4">
                <StyleGuideCover
                  brandName={brandName}
                  guideType={guideType}
                  showPreviewBadge={showPreviewBadge}
                />
              </div>
              {unlockedSections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={cn(
                    "scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="max-w-3xl mx-auto">
                    <MarkdownRenderer
                      content={`## ${section.title}\n\n${section.content}`}
                      selectedTraits={selectedTraits}
                    />
                  </div>
                </div>
              ))}
              {lockedSections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={cn(
                    "scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100",
                    (unlockedSections.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="max-w-3xl mx-auto">
                    <ContentGate
                      content={section.content}
                      locked={true}
                      showUpgradeCTA={true}
                      sectionTitle={section.title}
                      onUpgrade={onUpgrade}
                      selectedTraits={selectedTraits}
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div id="cover" className="scroll-mt-4" />
              {/* Single editor only: one Plate instance for all unlocked sections (avoids multiple editors) */}
              {editorMarkdown && (
                <div className="scroll-mt-4 px-12 md:px-20 py-16 md:py-20 relative" data-single-editor-root>
                  {editorBanner}
                  <div className="max-w-3xl mx-auto">
                    <StyleGuideEditor
                      key={editorKey}
                      ref={editorRef}
                      editorId={editorId}
                      markdown={editorMarkdown}
                      readOnly={false}
                      showTip={true}
                      useSectionIds={true}
                      onFocusChange={undefined}
                      onChange={(md) => {
                        const withoutTitle = md.replace(/^#\s+.+\n*/, "").trim()
                        const full = lockedMarkdown
                          ? withoutTitle + "\n\n" + lockedMarkdown
                          : withoutTitle
                        onContentChange(full)
                      }}
                      storageKey={storageKey}
                    />
                  </div>
                </div>
              )}
              {lockedSections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-4 px-12 md:px-20 py-16 md:py-20 border-t border-gray-100"
                >
                  <div className="max-w-3xl mx-auto">
                    <ContentGate
                      content={section.content}
                      locked={true}
                      showUpgradeCTA={true}
                      sectionTitle={section.title}
                      onUpgrade={onUpgrade}
                      selectedTraits={selectedTraits}
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="pdf-exclude h-[50vh] min-h-[300px] shrink-0" aria-hidden />
          {pdfFooter}
        </div>
      </div>

      {/* Floating components via portal - escape overflow/transform so they stay visible */}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {showEditTools && viewMode === "edit" && !isSectionLocked && (
              <RewriteBar 
                onRewrite={onRewrite} 
                isLoading={isRewriting}
                editorRef={editorRef}
                activeSectionId={activeSectionId}
              />
            )}
          </>,
          document.body
        )}
    </div>
  )
}
