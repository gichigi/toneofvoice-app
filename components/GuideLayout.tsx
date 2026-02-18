"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, PenLine } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { GuideSidebar } from "@/components/GuideSidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { StyleGuideSection, Tier } from "@/lib/content-parser"
import Logo from "@/components/Logo"

interface GuideLayoutProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  onSectionChange: (id: string) => void
  subscriptionTier: Tier
  brandName: string
  children: ReactNode
  onUpgrade: () => void
  onAddSection?: (title: string) => void
  headerContent?: ReactNode
  /** View mode for Preview/Edit toggle */
  viewMode?: "preview" | "edit"
  /** Callback when view mode changes */
  onModeSwitch?: (mode: "preview" | "edit") => void
  /** Show edit tools (for Preview/Edit button visibility) */
  showEditTools?: boolean
  /** Show Dashboard link in header (hide for unauthed users on /guide) */
  showDashboardLink?: boolean
}

export function GuideLayout({
  sections,
  activeSectionId,
  onSectionChange,
  subscriptionTier,
  brandName,
  children,
  onUpgrade,
  onAddSection,
  headerContent,
  viewMode,
  onModeSwitch,
  showEditTools = false,
  showDashboardLink = true,
}: GuideLayoutProps) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "18rem",
      } as React.CSSProperties}
    >
      <GuideSidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionSelect={onSectionChange}
        subscriptionTier={subscriptionTier}
        brandName={brandName}
        onUpgrade={onUpgrade}
        onAddSection={onAddSection}
      />
      <SidebarInset className="bg-gray-50/50">
        <header className="layout-header flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            {showDashboardLink && (
              <>
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </>
            )}
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <div className="md:hidden">
              <Logo size="sm" linkToHome={false} />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {showEditTools && viewMode && onModeSwitch && (
              <Button
                type="button"
                onClick={() => onModeSwitch(viewMode === "preview" ? "edit" : "preview")}
                // Filled/prominent when in preview so "Edit guide" is easy to spot; outline when already editing
                variant={viewMode === "preview" ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {viewMode === "preview" ? (
                  <>
                    <PenLine className="size-4 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Edit guide</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-4 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Preview</span>
                  </>
                )}
              </Button>
            )}
            {headerContent}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-0 p-2 md:p-4 pt-0 min-h-0 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
