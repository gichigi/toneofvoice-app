"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2, Check, ChevronDown, RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { generateFile, FileFormat } from "@/lib/file-generator"
import type { StyleGuideEditorRef } from "@/components/editor/StyleGuideEditor"
import { StyleGuideLayout } from "@/components/StyleGuideLayout"
import { StyleGuideView } from "@/components/StyleGuideView"
import {
  parseStyleGuideContent,
  StyleGuideSection,
  Tier,
  STYLE_GUIDE_SECTIONS,
  getSectionContentFromMarkdown,
  replaceSectionInMarkdown,
} from "@/lib/content-parser"
import { ErrorMessage } from "@/components/ui/error-message"
import { createErrorDetails, ErrorDetails } from "@/lib/api-utils"
import { useAuth } from "@/components/AuthProvider"

function FullAccessContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const guideId = searchParams.get("guideId")
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [showNotionInstructions, setShowNotionInstructions] = useState(false)
  const [generatedStyleGuide, setGeneratedStyleGuide] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<string | null>(null)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [guideType, setGuideType] = useState<string>("core")
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [apiError, setApiError] = useState<ErrorDetails | null>(null)
  const [contentUpdated, setContentUpdated] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [savedToAccount, setSavedToAccount] = useState(false)
  const [currentGuideId, setCurrentGuideId] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<Tier>("free")
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [sections, setSections] = useState<StyleGuideSection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>("cover")
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteSuccessAt, setRewriteSuccessAt] = useState<number>(0)
  const [editorKey, setEditorKey] = useState(0)
  const editorRef = useRef<StyleGuideEditorRef>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTopBeforeSwitchRef = useRef<number>(0)

  // Restore scroll position after mode switch
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && scrollTopBeforeSwitchRef.current > 0) {
        scrollContainerRef.current.scrollTop = scrollTopBeforeSwitchRef.current
        scrollTopBeforeSwitchRef.current = 0
      }
    })
  }, [viewMode])

  const handleModeSwitch = (mode: "preview" | "edit") => {
    if (mode === viewMode) return
    scrollTopBeforeSwitchRef.current = scrollContainerRef.current?.scrollTop ?? 0
    setViewMode(mode)
  }

  // Scroll to section on sidebar click (center in viewport)
  const handleSectionSelect = (id: string) => {
    setActiveSectionId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

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

  // Function to generate the style guide (can be called multiple times)
  const generateStyleGuide = async () => {
    try {
      setApiError(null)
      
      const savedBrandDetails = localStorage.getItem("brandDetails")
      const savedGuideType = localStorage.getItem("styleGuidePlan")
      const savedSelectedTraits = localStorage.getItem("selectedTraits")
      const generatedPreviewTraits = localStorage.getItem("generatedPreviewTraits")
      const previewTraitsTimestamp = localStorage.getItem("previewTraitsTimestamp")
      
      if (!savedBrandDetails) {
        throw new Error("No brand details found. Please fill them in again.")
      }
      
      const parsedBrandDetails = JSON.parse(savedBrandDetails)
      const selectedTraits = savedSelectedTraits ? JSON.parse(savedSelectedTraits) : []
      
      // Check if we can reuse preview traits
      const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
      const canReuseTraits = generatedPreviewTraits && 
                            previewTraitsTimestamp && 
                            selectedTraits.length > 0 &&
                            (Date.now() - parseInt(previewTraitsTimestamp)) < TTL_MS
      
      if (canReuseTraits) {
        console.log("[Full Access] Reusing preview traits to save API calls")
        // Add the preview traits to brandDetails for template processing
        parsedBrandDetails.previewTraits = generatedPreviewTraits
      }
      
      console.log("[Full Access] Generating style guide with plan:", savedGuideType)
      
      const response = await fetch('/api/generate-styleguide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDetails: parsedBrandDetails,
          plan: savedGuideType === 'complete' ? 'complete' : 'core',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }
      
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate style guide')
      }
      
      // Success - save and display the guide
      setGeneratedStyleGuide(data.styleGuide)
      localStorage.setItem("generatedStyleGuide", data.styleGuide)

      // Save to account if user is logged in
      if (user) {
        try {
          const res = await fetch("/api/save-style-guide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guide_id: currentGuideId || undefined,
              title: `${parsedBrandDetails.name} Style Guide`,
              brand_name: parsedBrandDetails.name,
              content_md: data.styleGuide,
              plan_type: savedGuideType === "complete" ? "complete" : "core",
              brand_details: parsedBrandDetails,
            }),
          })
          if (res.ok) {
            setSavedToAccount(true)
            const json = await res.json()
            if (json.guide?.id) setCurrentGuideId(json.guide.id)
          }
        } catch {
          // ignore save errors
        }
      }
      
      // Show content updated indicator
      setContentUpdated(true)
      setTimeout(() => setContentUpdated(false), 3000)
      
      toast({
        title: "Style guide updated!",
        description: "Your guide has been regenerated.",
      })
      
    } catch (error) {
      console.error("Error generating style guide:", error)
      
      // Create enhanced error details
      const errorDetails = createErrorDetails(error)
      setApiError(errorDetails)
      
      // Don't show toast for API errors since we'll show the ErrorMessage component
      console.log("Enhanced error details:", errorDetails)
    }
  }

  // Retry function for manual retries
  const handleRetry = async () => {
    setIsRetrying(true)
    setApiError(null)
    
    try {
      await generateStyleGuide()
    } catch (error) {
      // Error is already handled in generateStyleGuide
    } finally {
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    // Loading existing guide by ID (from dashboard)
    if (guideId) {
      if (authLoading) return
      if (!user) {
        router.replace(`/sign-in?redirectTo=${encodeURIComponent(`/full-access?guideId=${guideId}`)}`)
        return
      }
      
      // Check if user just completed subscription (from redirect)
      const subscriptionSuccess = searchParams.get("subscription") === "success"
      
      const loadGuide = async (retryCount = 0) => {
        try {
          // Fetch guide and subscription tier in parallel for accuracy
          const [guideResponse, tierResponse] = await Promise.all([
            fetch(`/api/load-style-guide?guideId=${guideId}`),
            fetch(`/api/user-subscription-tier`)
          ])
          
          if (!guideResponse.ok) {
            if (guideResponse.status === 404) {
              router.replace("/dashboard")
              return
            }
            throw new Error("Failed to load guide")
          }
          
          const guide = await guideResponse.json()
          const tierData = tierResponse.ok ? await tierResponse.json() : { subscription_tier: "free" }
          
          if (!guide) return
          
          setGeneratedStyleGuide(guide.content_md || "")
          setBrandDetails(guide.brand_details || { name: guide.brand_name || "Brand" })
          setGuideType(guide.plan_type || "core")
          
          // Use the directly fetched tier, fallback to guide's tier, then "free"
          const tier = tierData?.subscription_tier || (guide as any).subscription_tier || "free"
          setSubscriptionTier(tier)
          
          // If subscription just succeeded but tier is still free, retry after a delay
          // (webhook might not have processed yet)
          if (subscriptionSuccess && tier === "free" && retryCount < 3) {
            console.log(`[Full Access] Subscription success but tier still free, retrying... (${retryCount + 1}/3)`)
            setTimeout(() => loadGuide(retryCount + 1), 2000 * (retryCount + 1)) // Exponential backoff
            return
          }
          
          // If subscription just succeeded and tier is now paid, show success message
          if (subscriptionSuccess && tier !== "free") {
            toast({
              title: "Subscription activated!",
              description: "You now have full access to edit and export your style guides.",
            })
            // Clean up URL
            router.replace(`/full-access?guideId=${guideId}`, { scroll: false })
          }
          
          setSavedToAccount(true)
          setCurrentGuideId(guide.id)
          setIsLoading(false)
        } catch (error) {
          console.error("[Full Access] Error loading guide:", error)
          toast({ title: "Could not load guide", variant: "destructive" })
          router.replace("/dashboard")
        }
      }
      
      loadGuide()
      return
    }

    // Standard flow: localStorage + generation (user arrived from payment)
    // If we reach here without a guideId, the user came through the payment flow
    // and is a paid subscriber - set tier accordingly
    setSubscriptionTier("pro")
    
    const alreadyGenerated = searchParams.get("generated") === "true"
    const savedBrandDetails = localStorage.getItem("brandDetails")
    const savedGuideType = localStorage.getItem("styleGuidePlan")
    const savedStyleGuide = localStorage.getItem("generatedStyleGuide")

    if (!savedBrandDetails) {
      console.error("[Full Access] No brand details found in localStorage")
      toast({
        title: "Session expired",
        description: "Please fill in your brand details again.",
        variant: "destructive",
      })
      router.push("/brand-details?paymentComplete=true")
      return
    }

    setBrandDetails(JSON.parse(savedBrandDetails))
    if (savedGuideType) setGuideType(savedGuideType)

    if (alreadyGenerated && savedStyleGuide) {
      setGeneratedStyleGuide(savedStyleGuide)
      setIsLoading(false)
    } else {
      generateStyleGuide().finally(() => setIsLoading(false))
    }

    const timer = setTimeout(() => setFadeIn(true), 100)
    return () => clearTimeout(timer)
  }, [router, searchParams, toast, guideId, user, authLoading])

  // Save existing guide to account when user logs in (e.g. returning visitor)
  // Only runs for the localStorage flow (no guideId) — guides loaded by ID are already saved
  useEffect(() => {
    if (guideId) return // Already in the database, don't re-save
    if (!user || !generatedStyleGuide || savedToAccount) return
    const savedBrandDetails = localStorage.getItem("brandDetails")
    const savedGuideType = localStorage.getItem("styleGuidePlan")
    if (!savedBrandDetails) return
    const parsed = JSON.parse(savedBrandDetails)
    fetch("/api/save-style-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guide_id: currentGuideId || undefined,
        title: `${parsed.name} Style Guide`,
        brand_name: parsed.name,
        content_md: generatedStyleGuide,
        plan_type: savedGuideType === "complete" ? "complete" : "core",
        brand_details: parsed,
      }),
    })
      .then((r) => r.ok && setSavedToAccount(true))
      .catch(() => {})
  }, [user, generatedStyleGuide, savedToAccount, currentGuideId, guideId])

  // Auto-save edits to existing guide (debounced 2s)
  useEffect(() => {
    if (!currentGuideId || !user || !brandDetails || !hasEdits || !generatedStyleGuide)
      return
    const t = setTimeout(() => {
      fetch("/api/save-style-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guide_id: currentGuideId,
          title: `${brandDetails.name} Style Guide`,
          brand_name: brandDetails.name,
          content_md: generatedStyleGuide,
          plan_type: guideType === "complete" ? "complete" : "core",
          brand_details: brandDetails,
        }),
      }).catch(() => {})
    }, 2000)
    return () => clearTimeout(t)
  }, [currentGuideId, user, brandDetails, hasEdits, generatedStyleGuide, guideType])

  // Parse content into sections when generatedStyleGuide changes
  useEffect(() => {
    if (!generatedStyleGuide) return
    
    // Parse markdown directly into sections
    const parsed = parseStyleGuideContent(generatedStyleGuide)
    
    // Add cover section manually
    const coverSection: StyleGuideSection = {
      id: 'cover',
      title: 'Cover Page',
      content: '',
      level: 1,
      isMainSection: true,
      configId: 'cover',
      icon: STYLE_GUIDE_SECTIONS.find(s => s.id === 'cover')?.icon,
      minTier: 'free'
    }
    setSections([coverSection, ...parsed])
  }, [generatedStyleGuide])

  const handleCopy = () => {
    setCopied(true)
    const shareableLink = window.location.href

    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The style guide link has been copied to your clipboard.",
        })
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setTimeout(() => setCopied(false), 2000)
      })
  }

  const handleDownload = async (format: string) => {
    if (!generatedStyleGuide || !brandDetails) return

    setIsDownloading(true)
    setDownloadFormat(format)

    try {
      // Use processed content for downloads to avoid double headers
      const processedContent = processFullAccessContent(generatedStyleGuide, brandDetails.name)
      
      const file = await generateFile(format as FileFormat, processedContent, brandDetails.name)
      const url = window.URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = url
      a.download = `${brandDetails.name.replace(/\s+/g, '-').toLowerCase()}-style-guide.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: `Your style guide is downloading in ${format.toUpperCase()} format.`,
      })
    } catch (error) {
      console.error("Error generating file:", error)
      toast({
        title: "Download failed",
        description: "Could not generate the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadFormat(null)
      setShowDownloadOptions(false)
    }
  }

  // Get guide content based on plan type
  const getGuideContent = () => {
    if (!generatedStyleGuide) return null
    
    // Always return full content - the template itself handles the content limits
    return generatedStyleGuide
  }

  const guideContent = getGuideContent()

  const exportPDF = async () => {
    if (typeof window === "undefined") return
    const element = document.getElementById("pdf-export-content")
    if (!element) return
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 0.5,
      filename: `${brandDetails?.name?.replace(/\s+/g, '-').toLowerCase() || 'style'}-guide.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        letterRendering: true,
        useCORS: true
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['h2', 'h3', '.voice-trait', '.rule-section']
      }
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleRewrite = async (instruction: string, scope: "section" | "selection" | "document", selectedText?: string) => {
    if (!generatedStyleGuide) return

    setIsRewriting(true)
    try {
      let currentContent = ""
      if (scope === "selection" && selectedText) {
        currentContent = selectedText
      } else if (scope === "document") {
        currentContent = generatedStyleGuide
      } else {
        // section scope
        if (!activeSectionId || activeSectionId === "cover") {
          throw new Error("No section selected")
        }
        currentContent = getSectionContentFromMarkdown(generatedStyleGuide, activeSectionId)
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
        let newContent = generatedStyleGuide
        if (scope === "selection" && selectedText && editorRef.current) {
          // For selection, we'd need to replace the selected text in the editor
          // This is more complex and would require editor manipulation
          // For now, fall back to section replacement
          if (activeSectionId && activeSectionId !== "cover") {
            newContent = replaceSectionInMarkdown(generatedStyleGuide, activeSectionId, data.content)
          }
        } else if (scope === "document") {
          newContent = data.content
        } else {
          // section scope
          if (!activeSectionId || activeSectionId === "cover") {
            throw new Error("No section selected")
          }
          newContent = replaceSectionInMarkdown(generatedStyleGuide, activeSectionId, data.content)
        }
        
        setGeneratedStyleGuide(newContent)
        const parsed = parseStyleGuideContent(newContent)
        const coverSection: StyleGuideSection = {
          id: "cover",
          title: "Cover Page",
          content: "",
          level: 1,
          isMainSection: true,
          configId: "cover",
          icon: STYLE_GUIDE_SECTIONS.find((s) => s.id === "cover")?.icon,
          minTier: "free",
        }
        setSections([coverSection, ...parsed])
        setEditorKey((k) => k + 1)
        setRewriteSuccessAt(Date.now())
        setTimeout(() => setRewriteSuccessAt(0), 800)
        try {
          localStorage.setItem("generatedStyleGuide", newContent)
        } catch (e) {
          console.warn("[Full Access] Failed to save to localStorage", e)
        }
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
  }

  const isUnlocked = (minTier?: Tier) => {
    if (!minTier || minTier === 'free') return true
    if (subscriptionTier === 'free') return false
    if (subscriptionTier === 'pro' && minTier === 'team') return false
    return true
  }

  // Clean up markdown content for download (remove redundant title/date/subtitle lines)
  const processFullAccessContent = (content: string, brandName: string = "") => {
    if (!content) return content

    let lines = content.split('\n')

    // Remove first H1 that contains brand name or "Style Guide"
    const h1Idx = lines.findIndex(l => /^#\s+/.test(l))
    if (h1Idx !== -1) {
      const h1Text = lines[h1Idx].replace(/^#\s+/, '')
      if ((brandName && h1Text.includes(brandName)) || h1Text.toLowerCase().includes('style guide')) {
        lines.splice(h1Idx, 1)
      }
    }

    // Remove standalone date line near the top (e.g. "January 5, 2026")
    const dateIdx = lines.findIndex((l, i) => i < 10 && /^\w+\s+\d{1,2},\s+\d{4}/.test(l.trim()))
    if (dateIdx !== -1) lines.splice(dateIdx, 1)

    // Remove subtitle lines ("An essential guide..." / "clear and consistent")
    lines = lines.filter(l => {
      const lower = l.trim().toLowerCase()
      return !lower.includes('essential guide') && !lower.includes('clear and consistent')
    })

    // Remove orphan horizontal rules (---) that sit alone
    lines = lines.filter(l => !/^-{3,}$/.test(l.trim()))

    // Add brand name to Brand Voice heading if missing
    lines = lines.map(l => {
      if (/^##\s+Brand Voice/i.test(l) && brandName && !l.includes(brandName)) {
        return `## ${brandName} Brand Voice`
      }
      return l
    })

    // Number ### trait headings inside the Brand Voice section
    let inBrandVoice = false
    let traitNum = 1
    lines = lines.map(l => {
      if (/^##\s+.*Brand Voice/i.test(l)) { inBrandVoice = true; traitNum = 1; return l }
      if (/^##\s+/.test(l) && inBrandVoice) { inBrandVoice = false; return l }
      if (inBrandVoice && /^###\s+/.test(l)) {
        const title = l.replace(/^###\s+/, '')
        if (!/^\d+\./.test(title)) {
          return `### ${traitNum++}. ${title}`
        }
      }
      return l
    })

    return lines.join('\n')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading your style guide...</p>
      </div>
    )
  }

  // Show error state if generation failed
  if (apiError && !generatedStyleGuide) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        {/* Simple header for error state */}
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-8 flex h-16 items-center">
            <Link href="/" className="font-semibold text-lg">AI Style Guide</Link>
          </div>
        </header>

        <main className="flex-1 py-8">
          <div className="max-w-2xl mx-auto px-8">
            <div className="mb-6">
              <Link
                href="/brand-details"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" /> Back to details
              </Link>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h1 className="text-xl font-semibold mb-4">Style Guide Generation Failed</h1>
              <p className="text-gray-600 mb-6">
                Don't worry - your payment was successful. We just need to regenerate your style guide.
              </p>
              
              <ErrorMessage
                error={apiError}
                onRetry={handleRetry}
                isRetrying={isRetrying}
                showRetryButton={true}
              />

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Your payment is secure:</strong> You won't be charged again for retrying. 
                  We'll keep trying until your style guide is ready.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!guideContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading style guide...</p>
      </div>
    )
  }

  const activeSection = sections.find(s => s.id === activeSectionId)
  const isSectionLocked = activeSection ? !isUnlocked(activeSection.minTier) : false

  // Build header content for StyleGuideLayout
  const headerContent = (
    <div className="flex items-center gap-3">
      {/* Retry button in case user wants to regenerate */}
      {subscriptionTier !== "free" && (
        <Button
          onClick={() => (hasEdits ? setShowRegenerateConfirm(true) : handleRetry())}
          disabled={isRetrying}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isRetrying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Regenerate
        </Button>
      )}
      
      <Button
        onClick={() => setShowDownloadOptions(true)}
        disabled={isDownloading}
        className="gap-2"
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
        <ChevronDown className="h-4 w-4" />
        )}
        Download
      </Button>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

      {/* Error message if there was an issue but we have existing content */}
      {apiError && sections.length > 0 && (
        <div className="max-w-5xl mx-auto px-8 pt-4">
          <ErrorMessage
            error={apiError}
            onRetry={handleRetry}
            isRetrying={isRetrying}
            onDismiss={() => setApiError(null)}
            showRetryButton={true}
          />
        </div>
      )}

      {/* Regenerate confirmation when user has edits */}
      <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate style guide?</DialogTitle>
            <DialogDescription>
              You have unsaved edits. Regenerating will replace your changes with a fresh AI-generated guide. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateConfirm(false)}>
              Keep edits
            </Button>
            <Button
              onClick={async () => {
                setShowRegenerateConfirm(false)
                setHasEdits(false)
                await handleRetry()
              }}
              disabled={isRetrying}
            >
              {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notion Instructions Dialog */}
      <Dialog open={showNotionInstructions} onOpenChange={setShowNotionInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import to Notion</DialogTitle>
            <DialogDescription>Follow these steps to import your style guide into Notion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ol className="list-decimal ml-5 space-y-2">
              <li>Download the HTML file</li>
              <li>In Notion, click "Import" from the sidebar</li>
              <li>Select "HTML" as the format</li>
              <li>Choose the downloaded file</li>
              <li>Click "Import"</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNotionInstructions(false)} className="w-full">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content with Sidebar Layout */}
      {sections.length > 0 ? (
        <StyleGuideLayout
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionChange={handleSectionSelect}
          subscriptionTier={subscriptionTier}
          brandName={brandDetails?.name || 'Your Brand'}
          onUpgrade={() => router.push("/dashboard/billing")}
          headerContent={headerContent}
          viewMode={viewMode}
          onModeSwitch={handleModeSwitch}
          showEditTools={true}
        >
          <StyleGuideView
            sections={sections}
            activeSectionId={activeSectionId}
            scrollContainerRef={scrollContainerRef}
            viewMode={viewMode}
            onModeSwitch={handleModeSwitch}
            content={generatedStyleGuide ?? ""}
            onContentChange={(full) => {
              setHasEdits(true)
              setGeneratedStyleGuide(full)
              try {
                localStorage.setItem("generatedStyleGuide", full)
              } catch (e) {
                console.warn("[Full Access] Failed to save", e)
              }
            }}
            brandName={brandDetails?.name || "Your Brand"}
            guideType={guideType as "core" | "complete"}
            showPreviewBadge={false}
            isUnlocked={isUnlocked}
            onRewrite={handleRewrite}
            isRewriting={isRewriting}
            isSectionLocked={isSectionLocked}
            onUpgrade={() => router.push("/dashboard/billing")}
            editorKey={editorKey}
            editorRef={editorRef}
            storageKey="full-access-full"
            editorId="full-access-single-editor"
            showEditTools={true}
            editorBanner={
              contentUpdated && (generatedStyleGuide?.length ?? 0) > 0 ? (
                <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-500 z-10 shadow-md">
                  <Check className="h-4 w-4 animate-in zoom-in duration-300" />
                  Style Guide Updated
                </div>
              ) : undefined
            }
            contentClassName={`transition-all duration-500 ${isRetrying ? "opacity-50 blur-sm" : "opacity-100"}`}
          />
        </StyleGuideLayout>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-4">Loading style guide...</p>
        </div>
      )}

      {/* Download Options Dialog */}
      <Dialog open={showDownloadOptions} onOpenChange={setShowDownloadOptions}>
        <DialogContent className="sm:max-w-[480px] bg-white border-gray-200">
          <DialogHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Download Style Guide
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Choose your preferred format
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <Button
              onClick={exportPDF}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">PDF</div>
                <div className="text-xs text-gray-500">Perfect for sharing</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleDownload("docx")}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "docx" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">Word</div>
                <div className="text-xs text-gray-500">Opens directly in Word</div>
              </div>
            </Button>
            
            
            <Button
              onClick={() => handleDownload("md")}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "md" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">Markdown</div>
                <div className="text-xs text-gray-500">Perfect for AI tools</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FullAccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FullAccessContent />
    </Suspense>
  )
}