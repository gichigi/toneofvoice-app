"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import type { StyleGuideEditorRef } from "@/components/editor/StyleGuideEditor"
import {
  parseStyleGuideContent,
  StyleGuideSection,
  Tier,
  STYLE_GUIDE_SECTIONS,
  getSectionContentFromMarkdown,
  replaceSectionInMarkdown,
} from "@/lib/content-parser"

export interface UseStyleGuideOptions {
  /** Guide ID from query params (for loading saved guide from DB) */
  guideId?: string | null
  /** Default view mode */
  defaultViewMode?: "preview" | "edit"
  /** Whether this is a preview flow (free users) */
  isPreviewFlow?: boolean
}

export interface UseStyleGuideReturn {
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
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Editor state
  editorRef: React.RefObject<StyleGuideEditorRef | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  editorKey: number
  setEditorKey: (key: number | ((prev: number) => number)) => void
  
  // Actions
  handleSectionSelect: (id: string) => void
  handleModeSwitch: (mode: "preview" | "edit") => void
  handleRewrite: (instruction: string, scope: "section" | "selection" | "document", selectedText?: string) => Promise<void>
  isRewriting: boolean
  
  // Utilities
  isUnlocked: (minTier?: Tier) => boolean
  isSectionLocked: boolean
}

export function useStyleGuide(options: UseStyleGuideOptions = {}): UseStyleGuideReturn {
  const { guideId, defaultViewMode = "preview", isPreviewFlow = false } = options
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  // Content state
  const [content, setContent] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [guideType, setGuideType] = useState<string>("style_guide")
  
  // UI state
  const [sections, setSections] = useState<StyleGuideSection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>("cover")
  const [viewMode, setViewMode] = useState<"preview" | "edit">(defaultViewMode)
  const [subscriptionTier, setSubscriptionTier] = useState<Tier>("starter")
  const [isLoading, setIsLoading] = useState(true)
  
  // Editor state
  const editorRef = useRef<StyleGuideEditorRef>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTopBeforeSwitchRef = useRef<number>(0)
  const [editorKey, setEditorKey] = useState(0)
  
  // Rewrite state
  const [isRewriting, setIsRewriting] = useState(false)
  
  // Restore scroll position after mode switch
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && scrollTopBeforeSwitchRef.current > 0) {
        scrollContainerRef.current.scrollTop = scrollTopBeforeSwitchRef.current
        scrollTopBeforeSwitchRef.current = 0
      }
    })
  }, [viewMode])
  
  // Fetch subscription tier
  useEffect(() => {
    if (!user) {
      setSubscriptionTier("starter")
      return
    }
    
    fetch("/api/user-subscription-tier")
      .then(res => res.json())
      .then(data => setSubscriptionTier((data.subscription_tier === "free" ? "starter" : (data.subscription_tier || "starter")) as Tier))
      .catch(() => setSubscriptionTier("starter"))
  }, [user])
  
  // Scroll to section on sidebar click (center in viewport)
  const handleSectionSelect = useCallback((id: string) => {
    setActiveSectionId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })
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
  
  // Parse content into sections when content changes
  useEffect(() => {
    if (!content) return
    
    const parsed = parseStyleGuideContent(content)
    const coverSection: StyleGuideSection = {
      id: 'cover',
      title: 'Cover Page',
      content: '',
      level: 1,
      isMainSection: true,
      configId: 'cover',
      icon: STYLE_GUIDE_SECTIONS.find(s => s.id === 'cover')?.icon,
      minTier: 'starter'
    }
    setSections([coverSection, ...parsed])
    // Only set cover as active on initial load (not on every content change)
    setActiveSectionId((prev) => prev || 'cover')
  }, [content])
  
  // Mode switching with scroll position preservation
  const handleModeSwitch = useCallback((mode: "preview" | "edit") => {
    if (mode === viewMode) return
    scrollTopBeforeSwitchRef.current = scrollContainerRef.current?.scrollTop ?? 0
    setViewMode(mode)
  }, [viewMode])
  
  // Rewrite handler
  const handleRewrite = useCallback(async (
    instruction: string,
    scope: "section" | "selection" | "document",
    selectedText?: string
  ) => {
    if (!content || !brandDetails) return
    
    setIsRewriting(true)
    try {
      let currentContent = ""
      if (scope === "selection" && selectedText) {
        currentContent = selectedText
      } else if (scope === "document") {
        currentContent = content
      } else {
        // section scope
        if (!activeSectionId || activeSectionId === "cover") {
          throw new Error("No section selected")
        }
        currentContent = getSectionContentFromMarkdown(content, activeSectionId)
        if (!currentContent) {
          throw new Error("Section content not found")
        }
      }
      
      const response = await fetch("/api/rewrite-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          currentContent,
          brandName: brandDetails?.name,
          scope,
          selectedText,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to rewrite")
      }
      
      const data = await response.json()
      
      if (data.success && data.content) {
        let newContent = content
        if (scope === "selection" && selectedText && editorRef.current) {
          if (activeSectionId && activeSectionId !== "cover") {
            newContent = replaceSectionInMarkdown(content, activeSectionId, data.content)
          }
        } else if (scope === "document") {
          newContent = data.content
        } else {
          // section scope
          if (!activeSectionId || activeSectionId === "cover") {
            throw new Error("No section selected")
          }
          newContent = replaceSectionInMarkdown(content, activeSectionId, data.content)
        }
        
        setContent(newContent)
        setEditorKey((k) => k + 1)
        toast({
          title: scope === "document" ? "Document rewritten" : scope === "selection" ? "Selection rewritten" : "Section rewritten",
          description: "Your changes have been applied.",
        })
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Rewrite error:", error)
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : "Could not rewrite. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRewriting(false)
    }
  }, [content, brandDetails, activeSectionId, toast])
  
  // Unlock check: starter (free) < pro < team
  const isUnlocked = useCallback((minTier?: Tier) => {
    if (!minTier || minTier === 'starter') return true
    if (subscriptionTier === 'starter') return false
    if (minTier === 'team' && subscriptionTier !== 'team') return false
    return true
  }, [subscriptionTier])
  
  const activeSection = sections.find(s => s.id === activeSectionId)
  const isSectionLocked = activeSection ? !isUnlocked(activeSection.minTier) : false
  
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
    handleRewrite,
    isRewriting,
    
    // Utilities
    isUnlocked,
    isSectionLocked,
  }
}
