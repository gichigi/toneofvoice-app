"use client"

/**
 * Stripped-down sidebar for the /example page.
 * Same visual language as GuideSidebar but with all account/upgrade UI removed
 * and replaced with a "build yours" conversion CTA.
 */

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { StyleGuideSection } from "@/lib/content-parser"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ExampleGuideSidebarProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  onSectionSelect: (id: string) => void
  brandName: string
}

export function ExampleGuideSidebar({
  sections,
  activeSectionId,
  onSectionSelect,
  brandName,
}: ExampleGuideSidebarProps) {
  const { setOpenMobile } = useSidebar()

  // Pin "Questions" last, matching the guide content render order
  const sectionsForMenu = (() => {
    const rest = sections.filter((s) => s.id !== "contact")
    const contact = sections.find((s) => s.id === "contact")
    return contact ? [...rest, contact] : rest
  })()

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-100 bg-white/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50"
    >
      {/* Header: brand name + subtitle, same as real guide sidebar */}
      <SidebarHeader className="p-4 pt-6 border-b border-gray-50/50">
        <div className="flex items-center gap-2 px-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-gray-900 truncate tracking-tight">
              {brandName}
            </h2>
            <p className="text-xs text-gray-500 truncate">Tone of Voice Guidelines</p>
          </div>
          {/* Brand initial in icon-collapsed mode */}
          <div className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm items-center justify-center shrink-0">
            {brandName.charAt(0).toUpperCase()}
          </div>
        </div>
      </SidebarHeader>

      {/* Section nav: no lock icons, no add-section button */}
      <SidebarContent className="p-2 gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sectionsForMenu.map((section) => {
                const isActive = activeSectionId === section.id
                const Icon = section.icon || Sparkles

                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onSectionSelect(section.id)
                        setOpenMobile(false)
                      }}
                      isActive={isActive}
                      tooltip={section.title}
                      className={cn(
                        "h-10 transition-all duration-300 ease-out",
                        isActive
                          ? "bg-gray-100 font-medium text-gray-900 shadow-sm scale-[1.02]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 hover:scale-[1.01]"
                      )}
                    >
                      <div className="relative flex items-center justify-center">
                        <Icon
                          className={cn(
                            "size-4 transition-all duration-300",
                            isActive
                              ? "text-blue-600 scale-110"
                              : "text-gray-500 group-hover:scale-105"
                          )}
                        />
                        {isActive && (
                          <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full animate-in slide-in-from-left-2 duration-300" />
                        )}
                      </div>
                      <span className="flex-1 truncate transition-all duration-300">
                        {section.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: conversion CTA in place of account/upgrade UI */}
      <SidebarFooter className="p-4 border-t border-gray-50/50 bg-white/50">
        {/* Expanded sidebar: CTA card */}
        <div className="group-data-[collapsible=icon]:hidden space-y-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">
              Build your own guide
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Enter your website or describe your brand - we&apos;ll generate a complete tone of voice guide like this one.
            </p>
            <Button
              asChild
              size="sm"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Link href="/">Get Started free</Link>
            </Button>
          </div>
        </div>

        {/* Icon-collapsed mode: small link icon */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col gap-2 items-center">
          <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-gray-600 hover:bg-gray-100">
            <Link href="/" title="Build your own guide">
              <Sparkles className="size-4" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
