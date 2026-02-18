"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

// Survives Strict Mode double-mount
const tierFetchedForUser = new Set<string>()
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import type { GuideEditorRef } from "@/components/editor/GuideEditor"
import {
  parseStyleGuideContent,
  StyleGuideSection,
  Tier,
  STYLE_GUIDE_SECTIONS,
  insertCustomSection,
} from "@/lib/content-parser"

export interface UseGuideOptions {
  /** Guide ID from query params (for loading saved guide from DB) */
  guideId?: string | null
  /** Default view mode */
  defaultViewMode?: "preview" | "edit"
  /** Whether this is a preview flow (free users) */
  isPreviewFlow?: boolean
}

export interface UseGuideReturn {
  // Content state
  content: string | null
  setContent: (content: string) => void
  brandDetails: any
  setBrandDetails: (details: any) => void
  guideType: string
  setGuideType: (type: string) => void

  // UI state
  sections: StyleGuideSection[]
  activeSectionId: string
  setActiveSectionId: (id: string) => void
  viewMode: "preview" | "edit"
  setViewMode: (mode: "preview" | "edit") => void
  subscriptionTier: Tier
  setSubscriptionTier: (tier: Tier) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Editor state
  editorRef: React.RefObject<GuideEditorRef | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  editorKey: number
  setEditorKey: (key: number | ((prev: number) => number)) => void

  // Actions
  handleSectionSelect: (id: string) => void
  handleModeSwitch: (mode: "preview" | "edit") => void

  // Utilities
  isUnlocked: (minTier?: Tier) => boolean
  isSectionLocked: boolean

  // Custom sections
  handleAddSection: (title: string) => void
}

export function useGuide(options: UseGuideOptions = {}): UseGuideReturn {
  const { guideId, defaultViewMode = "preview", isPreviewFlow = false } = options
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Content state
  const [content, setContent] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [guideType, setGuideType] = useState<string>("style_guide")

  // UI state: sections derived synchronously so expand/remount gets new content in same render
  const sections = useMemo(() => {
    if (!content) return []
    const parsed = parseStyleGuideContent(content)
    const coverSection: StyleGuideSection = {
      id: "cover",
      title: "Cover Page",
      content: "",
      level: 1,
      isMainSection: true,
      configId: "cover",
      icon: STYLE_GUIDE_SECTIONS.find((s) => s.id === "cover")?.icon,
      minTier: "starter",
    }
    return [coverSection, ...parsed]
  }, [content])
  const [activeSectionId, setActiveSectionId] = useState<string>("cover")
  const [viewMode, setViewMode] = useState<"preview" | "edit">(defaultViewMode)
  const [subscriptionTier, setSubscriptionTier] = useState<Tier>("starter")
  const [isLoading, setIsLoading] = useState(true)

  // Editor state
  const editorRef = useRef<GuideEditorRef>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTopBeforeSwitchRef = useRef<number>(0)
  const [editorKey, setEditorKey] = useState(0)

  // Restore scroll position after mode switch
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && scrollTopBeforeSwitchRef.current > 0) {
        scrollContainerRef.current.scrollTop = scrollTopBeforeSwitchRef.current
        scrollTopBeforeSwitchRef.current = 0
      }
    })
  }, [viewMode])

  // Fetch subscription tier for all authenticated users
  useEffect(() => {
    if (!user) {
      setSubscriptionTier("starter")
      tierFetchedForUser.clear()
      return
    }

    const userId = user.id
    if (tierFetchedForUser.has(userId)) return
    tierFetchedForUser.add(userId)

    fetch("/api/user-subscription-tier")
      .then(res => res.json())
      .then(data => setSubscriptionTier((data.subscription_tier === "free" ? "starter" : (data.subscription_tier || "starter")) as Tier))
      .catch(() => setSubscriptionTier("starter"))
  }, [user?.id])

  // Scroll to section on sidebar click (center in viewport)
  const handleSectionSelect = useCallback((id: string) => {
    setActiveSectionId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // IntersectionObserver: update activeSectionId as user scrolls
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || sections.length === 0) return

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
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  // Keep activeSectionId valid when sections change (e.g. after expand)
  useEffect(() => {
    if (sections.length === 0) return
    setActiveSectionId((prev) =>
      sections.some((s) => s.id === prev) ? prev : "cover"
    )
  }, [sections])

  // Mode switching with scroll position preservation
  const handleModeSwitch = useCallback((mode: "preview" | "edit") => {
    if (mode === viewMode) return
    scrollTopBeforeSwitchRef.current = scrollContainerRef.current?.scrollTop ?? 0
    setViewMode(mode)
  }, [viewMode])

  // Unlock check: starter (free) < pro < agency
  const isUnlocked = useCallback((minTier?: Tier) => {
    if (!minTier || minTier === 'starter') return true
    if (subscriptionTier === 'starter') return false
    if (minTier === 'agency' && subscriptionTier !== 'agency') return false
    return true
  }, [subscriptionTier])

  const activeSection = sections.find(s => s.id === activeSectionId)
  const isSectionLocked = activeSection ? !isUnlocked(activeSection.minTier) : false

  // Add a custom section to the guide
  const handleAddSection = useCallback((title: string) => {
    if (!content) return
    const newMarkdown = insertCustomSection(content, title)
    if (newMarkdown === content) return // no change (empty title or at limit)
    setContent(newMarkdown)
    setEditorKey(k => k + 1)
    // After render, scroll to the new section
    requestAnimationFrame(() => {
      const newSections = parseStyleGuideContent(newMarkdown)
      const newSection = newSections.find(s => s.title === title.trim().slice(0, 60))
      if (newSection) {
        setActiveSectionId(newSection.id)
        document.getElementById(newSection.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }, [content])

  return {
    // Content state
    content,
    setContent,
    brandDetails,
    setBrandDetails,
    guideType,
    setGuideType,

    // UI state
    sections,
    activeSectionId,
    setActiveSectionId,
    viewMode,
    setViewMode,
    subscriptionTier,
    setSubscriptionTier,
    isLoading,
    setIsLoading,

    // Editor state
    editorRef,
    scrollContainerRef,
    editorKey,
    setEditorKey,

    // Actions
    handleSectionSelect,
    handleModeSwitch,

    // Utilities
    isUnlocked,
    isSectionLocked,

    // Custom sections
    handleAddSection,
  }
}
