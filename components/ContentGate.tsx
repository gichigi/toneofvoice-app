// Design system: see DESIGN_SYSTEM.md for lock/blur visual treatment

"use client"

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
}

/**
 * ContentGate component splits markdown content at the paywall boundary
 * (Core Rules / Style Rules heading) and shows locked sections below with
 * gradient fade and upgrade CTA.
 */
export function ContentGate({ content, showUpgradeCTA = true, onUpgrade, selectedTraits = [] }: ContentGateProps) {
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
