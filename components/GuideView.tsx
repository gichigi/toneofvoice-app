"use client"

import { RefObject, useEffect, useState } from "react"
import { playfairDisplay } from "@/lib/fonts"
import { Eye, PenLine } from "lucide-react"
import { GuideCover } from "@/components/GuideCover"
import { GuideEditor, type GuideEditorRef } from "@/components/editor/GuideEditor"
import { ContentGate } from "@/components/ContentGate"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import {
  StyleGuideSection,
  Tier,
  buildEditableMarkdown,
} from "@/lib/content-parser"
import { cn } from "@/lib/utils"

export interface GuideViewProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  scrollContainerRef: RefObject<HTMLDivElement | null>
  viewMode: "preview" | "edit"
  onModeSwitch: (mode: "preview" | "edit") => void
  content: string
  onContentChange: (markdown: string) => void
  brandName: string
  guideType?: "core" | "complete" | "style_guide"
  showPreviewBadge?: boolean
  isUnlocked: (minTier?: Tier) => boolean
  isSectionLocked: boolean
  onUpgrade: () => void
  editorKey: number
  editorRef: RefObject<GuideEditorRef | null>
  storageKey: string
  editorId: string
  /** Show edit mode toggle (true for preview always, true for full-access when paid) */
  showEditTools: boolean
  /** Optional banner above editor (e.g. "Style Guide Updated") */
  editorBanner?: React.ReactNode
  pdfFooter?: React.ReactNode
  /** Optional class for the content wrapper (e.g. opacity when retrying) */
  contentClassName?: string
  /** Key to force remount and trigger entrance animation (e.g. after expand) */
  contentKey?: string | number
  /** Website URL to show on cover page (if available) */
  websiteUrl?: string
  /** Subscription tier for branding visibility */
  subscriptionTier?: Tier
  /** Enable AI features in editor (Cmd+J). Only for pro/agency users. */
  showAI?: boolean
}

/**
 * Single shared guide view: cover, sections, preview/editor modes.
 * Used by both /preview and /full-access.
 */
export function GuideView({
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
  contentKey,
  websiteUrl,
  subscriptionTier = 'starter',
  showAI = false,
}: GuideViewProps) {
  const nonCover = sections.filter((s) => s.id !== "cover")
  const hasContent = (s: StyleGuideSection) => (s.content || "").trim().length > 0
  // Separate Questions section to render at bottom
  const questionsSection = nonCover.find((s) => s.id === "contact" && hasContent(s))
  const sectionsWithoutQuestions = nonCover.filter((s) => s.id !== "contact")
  const unlockedSections = sectionsWithoutQuestions.filter((s) => isUnlocked(s.minTier) && hasContent(s))
  const lockedSections = sectionsWithoutQuestions.filter((s) => !isUnlocked(s.minTier) && hasContent(s))
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
          key={contentKey}
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
                <GuideCover
                  brandName={brandName}
                  guideType={guideType}
                  showPreviewBadge={showPreviewBadge}
                  websiteUrl={websiteUrl}
                  subscriptionTier={subscriptionTier}
                />
              </div>
              {unlockedSections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={cn(
                    "pdf-section scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="max-w-5xl mx-auto">
                    <MarkdownRenderer
                      content={`## ${section.title}\n\n${section.content}`}
                      selectedTraits={selectedTraits}
                      sectionId={section.id}
                    />
                  </div>
                </div>
              ))}
              {lockedSections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  data-locked-section
                  className={cn(
                    "pdf-section scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100",
                    (unlockedSections.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="max-w-5xl mx-auto">
                    <ContentGate
                      content={section.content}
                      locked={true}
                      showUpgradeCTA={true}
                      sectionTitle={section.title}
                      sectionId={section.id}
                      onUpgrade={onUpgrade}
                      selectedTraits={selectedTraits}
                    />
                  </div>
                </div>
              ))}
              {/* Questions section always at bottom */}
              {questionsSection && (
                <div
                  key={questionsSection.id}
                  id={questionsSection.id}
                  className={cn(
                    "pdf-section scroll-mt-4 px-12 md:px-20 py-20 md:py-24 border-t border-gray-100",
                    (unlockedSections.length + lockedSections.length) % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="max-w-5xl mx-auto">
                    <MarkdownRenderer
                      content={`## ${questionsSection.title}\n\n${questionsSection.content}`}
                      selectedTraits={selectedTraits}
                      sectionId={questionsSection.id}
                    />
                  </div>
                </div>
              )}

              {/* Branded footer - after all content, tier-based visibility */}
              {(subscriptionTier === 'starter' || subscriptionTier === 'pro') && (
                <div className="pdf-only px-12 md:px-20 py-12 border-t border-gray-200">
                  <div className="max-w-5xl mx-auto text-center">
                    {subscriptionTier === 'starter' && (
                      <div className="space-y-4">
                        <p className="text-base font-semibold text-gray-900">
                          Powered by Tone of Voice App
                        </p>
                        <p className="text-sm text-gray-600">
                          Create your own professional tone of voice guidelines in minutes at{' '}
                          <a href="https://toneofvoice.app" className="text-gray-900 hover:underline font-medium">
                            toneofvoice.app
                          </a>
                        </p>
                      </div>
                    )}
                    {subscriptionTier === 'pro' && (
                      <p className="text-xs text-gray-400">
                        Powered by{' '}
                        <a href="https://toneofvoice.app" className="text-gray-500 hover:underline">
                          Tone of Voice App
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div id="cover" className="scroll-mt-4" />
              {/* Single editor only: one Plate instance for all unlocked sections (avoids multiple editors) */}
              {editorMarkdown && (
                <div className="scroll-mt-4 px-12 md:px-20 py-16 md:py-20 relative" data-single-editor-root>
                  {editorBanner}
                  <div className="max-w-5xl mx-auto">
                    <GuideEditor
                      key={editorKey}
                      ref={editorRef}
                      editorId={editorId}
                      markdown={editorMarkdown}
                      readOnly={false}
                      showTip={true}
                      useSectionIds={true}
                      onFocusChange={undefined}
                      showAI={showAI}
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
                  data-locked-section
                  className="pdf-section scroll-mt-4 px-12 md:px-20 py-16 md:py-20 border-t border-gray-100"
                >
                  <div className="max-w-5xl mx-auto">
                    <ContentGate
                      content={section.content}
                      locked={true}
                      showUpgradeCTA={true}
                      sectionTitle={section.title}
                      sectionId={section.id}
                      onUpgrade={onUpgrade}
                      selectedTraits={selectedTraits}
                    />
                  </div>
                </div>
              ))}
              {/* Questions section always at bottom */}
              {questionsSection && (
                <div
                  key={questionsSection.id}
                  id={questionsSection.id}
                  className="pdf-section scroll-mt-4 px-12 md:px-20 py-16 md:py-20 border-t border-gray-100"
                >
                  <div className="max-w-5xl mx-auto">
                    <MarkdownRenderer
                      content={`## ${questionsSection.title}\n\n${questionsSection.content}`}
                      selectedTraits={selectedTraits}
                      sectionId={questionsSection.id}
                    />
                  </div>
                </div>
              )}

              {/* Branded footer - after all content, tier-based visibility */}
              {(subscriptionTier === 'starter' || subscriptionTier === 'pro') && (
                <div className="pdf-only px-12 md:px-20 py-12 border-t border-gray-200">
                  <div className="max-w-5xl mx-auto text-center">
                    {subscriptionTier === 'starter' && (
                      <div className="space-y-4">
                        <p className="text-base font-semibold text-gray-900">
                          Powered by Tone of Voice App
                        </p>
                        <p className="text-sm text-gray-600">
                          Create your own professional tone of voice guidelines in minutes at{' '}
                          <a href="https://toneofvoice.app" className="text-gray-900 hover:underline font-medium">
                            toneofvoice.app
                          </a>
                        </p>
                      </div>
                    )}
                    {subscriptionTier === 'pro' && (
                      <p className="text-xs text-gray-400">
                        Powered by{' '}
                        <a href="https://toneofvoice.app" className="text-gray-500 hover:underline">
                          Tone of Voice App
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pdf-exclude h-[50vh] min-h-[300px] shrink-0" aria-hidden />
          {pdfFooter}
        </div>
      </div>
    </div>
  )
}
