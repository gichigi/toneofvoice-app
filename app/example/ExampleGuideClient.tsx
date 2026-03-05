"use client"

/**
 * Interactive shell for the /example sample guide page.
 * No auth required. All sections unlocked. Read-only.
 */

import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ExampleGuideSidebar } from "@/components/ExampleGuideSidebar"
import { GuideView } from "@/components/GuideView"
import type { GuideEditorRef } from "@/components/editor/GuideEditor"
import {
  EXAMPLE_GUIDE_SECTIONS,
  EXAMPLE_GUIDE_BRAND_NAME,
  EXAMPLE_GUIDE_WEBSITE_URL,
  EXAMPLE_GUIDE_DATE,
  EXAMPLE_GUIDE_DISCLAIMER,
} from "@/lib/example-guide"

export default function ExampleGuideClient() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  // editorRef is required by GuideView's type but never used in read-only preview mode
  const editorRef = useRef<GuideEditorRef | null>(null)

  const [activeSectionId, setActiveSectionId] = useState<string>("cover")

  // Scroll to section on sidebar click — matches useGuide's handleSectionSelect
  const handleSectionSelect = useCallback((id: string) => {
    setActiveSectionId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Scroll-spy: keep sidebar highlight in sync as user scrolls through the guide
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aTop = (a.target as HTMLElement).getBoundingClientRect().top
            const bTop = (b.target as HTMLElement).getBoundingClientRect().top
            return aTop - bTop
          })
        const topmost = intersecting[0]
        if (topmost) {
          const id = (topmost.target as HTMLElement).id
          if (id) setActiveSectionId(id)
        }
      },
      // Trigger when section enters the upper third of the viewport
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    EXAMPLE_GUIDE_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <ExampleGuideSidebar
        sections={EXAMPLE_GUIDE_SECTIONS}
        activeSectionId={activeSectionId}
        onSectionSelect={handleSectionSelect}
        brandName={EXAMPLE_GUIDE_BRAND_NAME}
      />

      <SidebarInset className="bg-gray-50/50">
        <header className="layout-header flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>← Home</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden md:block text-xs text-gray-400">Sample guide</span>
            <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
              <Link href="/">
                Build yours free
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-0 p-2 md:p-4 pt-0 min-h-0 overflow-hidden">
          <GuideView
            sections={EXAMPLE_GUIDE_SECTIONS}
            activeSectionId={activeSectionId}
            scrollContainerRef={scrollContainerRef}
            viewMode="preview"
            onModeSwitch={() => {}}
            content=""
            onContentChange={() => {}}
            brandName={EXAMPLE_GUIDE_BRAND_NAME}
            guideType="core"
            showPreviewBadge={false}
            isUnlocked={() => true}
            isSectionLocked={false}
            onUpgrade={() => {}}
            editorKey={0}
            editorRef={editorRef}
            storageKey="example"
            editorId="example"
            showEditTools={false}
            websiteUrl={EXAMPLE_GUIDE_WEBSITE_URL}
            subscriptionTier="agency"
            showAI={false}
            coverDate={EXAMPLE_GUIDE_DATE}
            coverDisclaimer={EXAMPLE_GUIDE_DISCLAIMER}
            pdfFooter={<ExampleConversionBlock />}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ExampleConversionBlock() {
  return (
    <div className="px-12 md:px-20 py-20 md:py-24 border-t border-gray-100 bg-white">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          You just read the whole thing
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Build your brand&apos;s guide in 5 minutes
        </h2>
        <p className="text-base text-gray-500 leading-relaxed">
          Enter your website or describe your brand. We generate a complete tone
          of voice guide - sections, examples, word list, AI cleanup rules, all of it.
        </p>
        <div className="pt-2">
          <Button
            asChild
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 px-8"
          >
            <Link href="/">
              Get Started free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <p className="text-xs text-gray-400">Free to start. No credit card required.</p>
      </div>
    </div>
  )
}
