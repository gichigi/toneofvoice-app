"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GuideCoverProps {
  brandName: string
  guideType?: 'core' | 'complete' | 'style_guide'
  date?: string
  showPreviewBadge?: boolean
  className?: string
  websiteUrl?: string
  subscriptionTier?: 'starter' | 'pro' | 'agency'
  /** Optional small note rendered below the website URL (e.g. attribution on sample guides) */
  disclaimer?: string
}

// Eyebrow: short label above title (avoid "Brand Identity" – redundant/wrong for voice docs)
const COVER_EYEBROW = "Brand Voice & Content Guidelines"

export function GuideCover({
  brandName,
  guideType,
  date,
  showPreviewBadge,
  className,
  websiteUrl,
  subscriptionTier = 'starter',
  disclaimer,
}: GuideCoverProps) {
  const [faviconVisible, setFaviconVisible] = useState(true)

  const formattedDate = date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const displayName = (brandName || "").trim() || "Brand Voice Guidelines"

  // Use website URL if available, otherwise show generation date only
  const subtitle = websiteUrl
    ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : null

  // Derive favicon from website URL (only for URL-based guides, not descriptions)
  let faviconUrl: string | null = null
  if (websiteUrl) {
    try {
      const host = new URL(websiteUrl).hostname
      faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
    } catch {
      // malformed URL - no favicon
    }
  }

  return (
    <div className={cn("min-h-[60vh] flex flex-col justify-center px-12 md:px-20 py-16 bg-white relative overflow-hidden", className)}>
      {/* Decorative background element - subtle animated pattern */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-gray-50/50 via-gray-50/30 to-transparent pointer-events-none animate-pulse" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />
      
      <div className="relative z-10 space-y-8">
        <div className="max-w-3xl space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {showPreviewBadge && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 mb-4 hover:bg-gray-100 transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-500">
              Preview Mode
            </Badge>
          )}
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
            {COVER_EYEBROW}
          </p>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h1
            className="text-7xl md:text-9xl font-bold tracking-tight text-gray-900 leading-[0.9] transition-all duration-500 hover:tracking-tighter hover:scale-[1.01] origin-left max-w-5xl"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {displayName}
          </h1>
          <div className="h-1 w-24 bg-gray-900 animate-in slide-in-from-left-4 duration-700 delay-500 rounded-full" />
        </div>

        <div className="pt-12 space-y-3 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 max-w-3xl">
          <p className="text-sm transition-colors duration-300 hover:text-gray-600">{formattedDate}</p>
          {subtitle && (
            <div className="flex items-center gap-2.5">
              {faviconUrl && faviconVisible && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-lg ring-1 ring-black/[0.06] flex-shrink-0 object-contain"
                  onError={() => setFaviconVisible(false)}
                />
              )}
              <p className="text-sm font-medium text-gray-900 transition-all duration-300 hover:translate-x-1">
                {subtitle}
              </p>
            </div>
          )}
          {disclaimer && (
            <p className="text-xs text-gray-400 italic">{disclaimer}</p>
          )}

          {/* Branding - tier-based visibility */}
          {subscriptionTier === 'starter' && (
            <div className="pt-8 border-t border-gray-200 mt-6 animate-in fade-in duration-700 delay-700">
              <p className="text-xs text-gray-400">
                Tone of Voice App · toneofvoice.app
              </p>
            </div>
          )}
          {subscriptionTier === 'pro' && (
            <div className="pt-6 mt-6 animate-in fade-in duration-700 delay-700">
              <p className="text-xs text-gray-400">
                <a href="https://toneofvoice.app" className="text-gray-500 hover:underline">
                  Tone of Voice App
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
