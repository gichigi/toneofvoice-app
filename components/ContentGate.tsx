// Design system: see DESIGN_SYSTEM.md for lock/blur visual treatment

"use client"

import { SECTION_H2_BAR_CLASS, SECTION_H2_CLASS, SECTION_H2_STYLE } from "@/lib/style-guide-styles"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
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
}

/**
 * ContentGate component splits markdown content at the paywall boundary
 * (Core Rules / Style Rules heading) and shows locked sections below with
 * gradient fade and upgrade CTA.
 * 
 * If `locked` prop is true, shows entire content blurred with lock overlay.
 */
export function ContentGate({ content, showUpgradeCTA = true, onUpgrade, selectedTraits = [], locked = false, sectionTitle }: ContentGateProps) {
  // Section-level locking: show heading + lock overlay
  if (locked) {
    const lines = content.split("\n").filter((l) => l.trim())
    const previewSnippet = lines.slice(0, 2).join(" ").slice(0, 120)

    return (
      <div className="animate-in fade-in duration-500 rounded-lg">
        {/* Visible section heading so user knows what's locked */}
        {sectionTitle && (
          <div className="mb-6">
            <h2 className={SECTION_H2_CLASS} style={SECTION_H2_STYLE}>
              {sectionTitle}
            </h2>
            <div className={`${SECTION_H2_BAR_CLASS} mt-4`} />
          </div>
        )}

        <div className="relative min-h-[40vh]">
          {/* Blurred content preview */}
          <div className="blur-sm select-none pointer-events-none opacity-30 transition-all duration-500">
            <MarkdownRenderer content={content} selectedTraits={selectedTraits} />
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
                  <CreditCard className="h-4 w-4 mr-2" />
                  Unlock Full Guide
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Find the split point - "Style Rules" or "Core Rules" heading (with optional number prefix like "25 Core Rules")
  const splitRegex = /(##\s+(?:\d+\s+)?(?:Core|Style)\s+Rules?\s*\n)/i
  const match = content.match(splitRegex)
  
  if (!match) {
    // No paywall boundary found - show all content
    return <MarkdownRenderer content={content} selectedTraits={selectedTraits} />
  }
  
  // Split BEFORE the heading so it's not shown as readable content
  const splitIndex = match.index!
  const visibleContent = content.substring(0, splitIndex)
  const lockedContent = content.substring(splitIndex)
  
  // Extract locked section headers
  const lockedHeaders: string[] = []
  const headerRegex = /^##\s+(.+)$/gm
  let headerMatch
  while ((headerMatch = headerRegex.exec(lockedContent)) !== null) {
    lockedHeaders.push(headerMatch[1])
  }
  
  return (
    <div className="relative">
      {/* Visible content with gradient fade on last paragraph */}
      <div className="relative">
        <MarkdownRenderer content={visibleContent} selectedTraits={selectedTraits} />
        {/* Gradient fade overlay on last visible content */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-white dark:to-gray-950"
        />
      </div>
      
      {/* Upgrade CTA card */}
      {showUpgradeCTA && (
        <div className="flex justify-center my-8 relative z-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md text-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlock Your Complete Style Guide
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Get access to all writing rules, detailed examples, and professional formats to create a consistent brand voice.
            </p>
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Locked section headers */}
      {lockedHeaders.length > 0 && (
        <div className="space-y-4 mt-8 relative z-10">
          {lockedHeaders.map((header, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-400">
              <Lock className="h-4 w-4 shrink-0" />
              <h2 className="text-lg font-medium" style={{ fontFamily: 'var(--font-display), serif' }}>{header}</h2>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
