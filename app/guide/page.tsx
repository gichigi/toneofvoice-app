"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, Eye, PenLine, Check, ChevronDown, RefreshCw, FileText } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { track } from "@vercel/analytics"
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
import BreadcrumbSchema from "@/components/BreadcrumbSchema"
import { useStyleGuide } from "@/hooks/use-style-guide"

function GuideContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const guideId = searchParams.get("guideId")
  const alreadyGenerated = searchParams.get("generated") === "true"
  const subscriptionSuccess = searchParams.get("subscription") === "success"
  
  // Determine flow type
  const isPreviewFlow = !guideId && !alreadyGenerated
  
  // Use the custom hook for shared logic
  const {
    content,
    setContent,
    brandDetails,
    setBrandDetails,
    guideType,
    setGuideType,
    sections,
    activeSectionId,
    setActiveSectionId,
    viewMode,
    setViewMode,
    subscriptionTier,
    isLoading,
    setIsLoading,
    editorRef,
    scrollContainerRef,
    editorKey,
    setEditorKey,
    handleSectionSelect,
    handleModeSwitch,
    handleRewrite,
    isRewriting,
    isUnlocked,
    isSectionLocked,
  } = useStyleGuide({
    guideId,
    defaultViewMode: "preview",
    isPreviewFlow,
  })
  
  // Preview flow specific state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [processingPlan, setProcessingPlan] = useState<"pro" | "team" | null>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Full-access flow specific state
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<string | null>(null)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [apiError, setApiError] = useState<ErrorDetails | null>(null)
  const [contentUpdated, setContentUpdated] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [savedToAccount, setSavedToAccount] = useState(false)
  const [currentGuideId, setCurrentGuideId] = useState<string | null>(guideId)
  
  // Handle subscription redirect from payment flow
  const subscribeTriggered = useRef(false)
  useEffect(() => {
    const sub = searchParams.get("subscribe")
    if (!sub || !["pro", "team"].includes(sub) || !user || subscribeTriggered.current) return
    subscribeTriggered.current = true
    const run = async () => {
      try {
        const res = await fetch("/api/create-subscription-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: sub }),
        })
        const data = await res.json()
        if (res.ok && data.url) window.location.href = data.url
        else toast({ title: "Could not start checkout", variant: "destructive" })
      } catch (e) {
        toast({ title: "Could not start checkout", variant: "destructive" })
      }
    }
    run()
    router.replace("/guide", { scroll: false })
  }, [searchParams.get("subscribe"), user, router, toast])
  
  // Load content based on flow type
  useEffect(() => {
    // Loading existing guide by ID (from dashboard)
    if (guideId) {
      if (authLoading) return
      if (!user) {
        router.replace(`/sign-in?redirectTo=${encodeURIComponent(`/guide?guideId=${guideId}`)}`)
        return
      }
      
      const loadGuide = async (retryCount = 0) => {
        try {
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
          const tierData = tierResponse.ok ? await tierResponse.json() : { subscription_tier: "starter" }
          
          if (!guide) return
          
          setContent(guide.content_md || "")
          setBrandDetails(guide.brand_details || { name: guide.brand_name || "Brand" })
          setGuideType(guide.plan_type || "style_guide")
          
          const tier = (tierData?.subscription_tier === "free" ? "starter" : tierData?.subscription_tier) || (guide as any).subscription_tier || "starter"
          
          // If subscription just succeeded but tier is still free, retry after a delay
          if (subscriptionSuccess && (tier === "starter" || tier === "free") && retryCount < 3) {
            console.log(`[Guide] Subscription success but tier still free, retrying... (${retryCount + 1}/3)`)
            setTimeout(() => loadGuide(retryCount + 1), 2000 * (retryCount + 1))
            return
          }
          
          if (subscriptionSuccess && tier !== "starter" && tier !== "free") {
            toast({
              title: "Subscription activated!",
              description: "You now have full access to edit and export your style guides.",
            })
            router.replace(`/guide?guideId=${guideId}`, { scroll: false })
          }
          
          setSavedToAccount(true)
          setCurrentGuideId(guide.id)
          setIsLoading(false)
        } catch (error) {
          console.error("[Guide] Error loading guide:", error)
          toast({ title: "Could not load guide", variant: "destructive" })
          router.replace("/dashboard")
        }
      }
      
      loadGuide()
      return
    }
    
    // Preview flow: localStorage + API generation
    if (isPreviewFlow) {
      try {
        const savedBrandDetails = localStorage.getItem("brandDetails")
        if (savedBrandDetails) {
          setBrandDetails(JSON.parse(savedBrandDetails))
        } else {
          setShouldRedirect(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[Guide] Failed to load brand details:', error)
        setShouldRedirect(true)
        setIsLoading(false)
      }
      return
    }
    
    // Full-access flow: localStorage + generation (user arrived from payment)
    const savedBrandDetails = localStorage.getItem("brandDetails")
    const savedGuideType = localStorage.getItem("styleGuidePlan")
    const savedStyleGuide = localStorage.getItem("generatedStyleGuide")
    
    if (!savedBrandDetails) {
      console.error("[Guide] No brand details found in localStorage")
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
      setContent(savedStyleGuide)
      setIsLoading(false)
    } else {
      generateStyleGuide().finally(() => setIsLoading(false))
    }
  }, [guideId, authLoading, user, router, toast, isPreviewFlow, alreadyGenerated, subscriptionSuccess])
  
  // Handle redirect for preview flow
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/brand-details")
    }
  }, [shouldRedirect, router])
  
  // Load preview content when brand details are available
  useEffect(() => {
    if (!isPreviewFlow || !brandDetails) return
    
    let isMounted = true
    
    const loadPreview = async () => {
      try {
        const savedPreviewContent = localStorage.getItem("previewContent")
        if (savedPreviewContent) {
          if (isMounted) {
            setContent(savedPreviewContent)
            
            const brandVoiceMatch = savedPreviewContent.match(/## Brand Voice([\s\S]*?)(?=##|$)/)
            if (brandVoiceMatch) {
              const brandVoiceContent = brandVoiceMatch[1].trim()
              localStorage.setItem("generatedPreviewTraits", brandVoiceContent)
              localStorage.setItem("previewTraitsTimestamp", Date.now().toString())
            }
          }
          return
        }
        
        let selectedTraits = []
        try {
          const savedSelectedTraits = localStorage.getItem("selectedTraits")
          selectedTraits = savedSelectedTraits ? JSON.parse(savedSelectedTraits) : []
        } catch (parseError) {
          console.warn('[Guide] Failed to parse selectedTraits:', parseError)
        }
        
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandDetails, selectedTraits })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate preview')
        }
        
        const data = await response.json()
        
        if (isMounted) {
          setContent(data.preview)
          
          const brandVoiceMatch = data.preview.match(/## Brand Voice([\s\S]*?)(?=##|$)/)
          if (brandVoiceMatch) {
            const brandVoiceContent = brandVoiceMatch[1].trim()
            localStorage.setItem("generatedPreviewTraits", brandVoiceContent)
            localStorage.setItem("previewTraitsTimestamp", Date.now().toString())
          }
        }
      } catch (error) {
        console.error("Error generating preview:", error)
        if (isMounted) {
          toast({
            title: "Preview generation failed",
            description: "Could not generate preview. Please try again later.",
            variant: "destructive",
          })
          setShouldRedirect(true)
        }
      }
    }
    
    loadPreview()
    
    return () => {
      isMounted = false
    }
  }, [brandDetails, toast, isPreviewFlow])
  
  // Generate style guide function (for full-access flow)
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
      
      const TTL_MS = 24 * 60 * 60 * 1000
      const canReuseTraits = generatedPreviewTraits && 
                            previewTraitsTimestamp && 
                            selectedTraits.length > 0 &&
                            (Date.now() - parseInt(previewTraitsTimestamp)) < TTL_MS
      
      if (canReuseTraits) {
        parsedBrandDetails.previewTraits = generatedPreviewTraits
      }
      
      // Pass user email and preview content when available (preserve preview user liked)
      let userEmail = user?.email ?? null
      let previewContent = null
      if (!userEmail) {
        try {
          const captured = localStorage.getItem("emailCapture")
          if (captured) userEmail = JSON.parse(captured)?.email ?? null
        } catch {}
      }
      try {
        previewContent = localStorage.getItem("previewContent")
      } catch {}
      const response = await fetch('/api/generate-styleguide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDetails: parsedBrandDetails,
          userEmail: userEmail || undefined,
          previewContent: previewContent || undefined,
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
      
      setContent(data.styleGuide)
      localStorage.setItem("generatedStyleGuide", data.styleGuide)
      
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
              plan_type: savedGuideType === "style_guide" ? "style_guide" : savedGuideType || "style_guide",
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
      
      setContentUpdated(true)
      setTimeout(() => setContentUpdated(false), 3000)
      
      toast({
        title: "Style guide updated!",
        description: "Your guide has been regenerated.",
      })
      
    } catch (error) {
      console.error("Error generating style guide:", error)
      const errorDetails = createErrorDetails(error)
      setApiError(errorDetails)
    }
  }
  
  // Auto-save edits to existing guide (debounced 2s)
  useEffect(() => {
    if (!currentGuideId || !user || !brandDetails || !hasEdits || !content) return
    const t = setTimeout(() => {
      fetch("/api/save-style-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guide_id: currentGuideId,
          title: `${brandDetails.name} Style Guide`,
          brand_name: brandDetails.name,
          content_md: content,
          plan_type: "style_guide",
          brand_details: brandDetails,
        }),
      }).catch(() => {})
    }, 2000)
    return () => clearTimeout(t)
  }, [currentGuideId, user, brandDetails, hasEdits, content, guideType])
  
  // Handle subscription (preview flow)
  const handleSubscription = async (plan: "pro" | "team") => {
    try {
      setProcessingPlan(plan)
      if (!user) {
        router.push(`/sign-up?redirectTo=${encodeURIComponent(`/guide?subscribe=${plan}`)}`)
        setProcessingPlan(null)
        return
      }
      const res = await fetch("/api/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.error || `Failed to start checkout (${res.status})`
        throw new Error(errorMsg)
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (e) {
      console.error("Subscription error:", e)
      const errorMessage = e instanceof Error ? e.message : "Could not start checkout"
      toast({ 
        title: "Could not start checkout", 
        description: errorMessage,
        variant: "destructive" 
      })
    } finally {
      setProcessingPlan(null)
    }
  }
  
  // Handle download (preview flow)
  const handleDownload = async (format: string = "pdf") => {
    if (!content || !brandDetails) return
    
    setIsDownloading(true)
    
    try {
      if (format === "pdf") {
        const source = document.getElementById('pdf-export-content')
        if (!source) {
          throw new Error('PDF content not found')
        }
        
        const clone = source.cloneNode(true) as HTMLElement
        const wrapper = document.createElement('div')
        wrapper.style.position = 'fixed'
        wrapper.style.left = '-99999px'
        wrapper.style.top = '0'
        wrapper.style.background = '#ffffff'
        wrapper.style.width = `${source.offsetWidth || 800}px`
        wrapper.appendChild(clone)
        document.body.appendChild(wrapper)
        
        clone.querySelectorAll('.pdf-only').forEach(el => (el as HTMLElement).style.display = 'block')
        clone.querySelectorAll('.pdf-exclude').forEach(el => (el as HTMLElement).style.display = 'none')
        
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default
        const opt = {
          margin: 0.5,
          filename: `${brandDetails.name.replace(/\s+/g, '-').toLowerCase()}-style-guide-preview.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }
        
        try {
          await html2pdf().set(opt).from(clone).save()
        } finally {
          if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
        }
      } else {
        const file = await generateFile(format as FileFormat, content, brandDetails.name)
        const url = window.URL.createObjectURL(file)
        const a = document.createElement("a")
        a.href = url
        a.download = `${brandDetails.name.replace(/\s+/g, '-').toLowerCase()}-style-guide-preview.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      toast({
        title: "Download started",
        description: `Your style guide preview is downloading in ${format.toUpperCase()} format.`,
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
    }
  }
  
  // Handle download (full-access flow)
  const handleDownloadFullAccess = async (format: string) => {
    if (!content || !brandDetails) return
    
    setIsDownloading(true)
    setDownloadFormat(format)
    
    try {
      const processedContent = processFullAccessContent(content, brandDetails.name)
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
  
  // Process content for download (remove redundant headers)
  const processFullAccessContent = (content: string, brandName: string = "") => {
    if (!content) return content
    
    let lines = content.split('\n')
    const h1Idx = lines.findIndex(l => /^#\s+/.test(l))
    if (h1Idx !== -1) {
      const h1Text = lines[h1Idx].replace(/^#\s+/, '')
      if ((brandName && h1Text.includes(brandName)) || h1Text.toLowerCase().includes('style guide')) {
        lines.splice(h1Idx, 1)
      }
    }
    
    const dateIdx = lines.findIndex((l, i) => i < 10 && /^\w+\s+\d{1,2},\s+\d{4}/.test(l.trim()))
    if (dateIdx !== -1) lines.splice(dateIdx, 1)
    
    lines = lines.filter(l => {
      const lower = l.trim().toLowerCase()
      return !lower.includes('essential guide') && !lower.includes('clear and consistent')
    })
    
    lines = lines.filter(l => !/^-{3,}$/.test(l.trim()))
    
    lines = lines.map(l => {
      if (/^##\s+Brand Voice/i.test(l) && brandName && !l.includes(brandName)) {
        return `## ${brandName} Brand Voice`
      }
      return l
    })
    
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
  
  // Export PDF (full-access flow)
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
  
  // Retry function (full-access flow)
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
  
  // Loading state
  if (isLoading || !content || sections.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading style guide...</p>
      </div>
    )
  }
  
  // Error state (full-access flow only)
  if (apiError && !content && !isPreviewFlow) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-8 flex h-16 items-center">
            <Link href="/" className="font-semibold text-lg">AI Style Guide</Link>
          </div>
        </header>
        <main className="flex-1 py-8">
          <div className="max-w-2xl mx-auto px-8">
            <ErrorMessage
              error={apiError}
              onRetry={handleRetry}
              isRetrying={isRetrying}
              showRetryButton={true}
            />
          </div>
        </main>
      </div>
    )
  }
  
  // Build header content
  const headerContent = isPreviewFlow ? null : (
    <div className="flex items-center gap-3">
      {subscriptionTier !== "starter" && (
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
    <div className="animate-in fade-in duration-500">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://aistyleguide.com" },
        { name: "Brand Details", url: "https://aistyleguide.com/brand-details" },
        { name: "Style Guide", url: "https://aistyleguide.com/guide" }
      ]} />
      
      <StyleGuideLayout
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={handleSectionSelect}
        subscriptionTier={subscriptionTier}
        brandName={brandDetails?.name || 'Your Brand'}
        onUpgrade={() => {
          if (isPreviewFlow) {
            track('Paywall Clicked', { 
              location: 'guide-page',
              action: 'unlock-style-guide'
            })
            setPaymentDialogOpen(true)
          } else {
            router.push("/dashboard/billing")
          }
        }}
        viewMode={viewMode}
        onModeSwitch={handleModeSwitch}
        showEditTools={true}
        headerContent={headerContent}
      >
        <StyleGuideView
          sections={sections}
          activeSectionId={activeSectionId}
          scrollContainerRef={scrollContainerRef}
          viewMode={viewMode}
          onModeSwitch={handleModeSwitch}
          content={content}
          onContentChange={(full) => {
            if (!isPreviewFlow) {
              setHasEdits(true)
            }
            setContent(full)
            try {
              if (isPreviewFlow) {
                localStorage.setItem("previewContent", full)
              } else {
                localStorage.setItem("generatedStyleGuide", full)
              }
            } catch (e) {
              console.warn("[Guide] Failed to save", e)
            }
          }}
          brandName={brandDetails?.name || "Your Brand"}
          guideType={guideType as "core" | "complete" | "style_guide"}
          showPreviewBadge={isPreviewFlow}
          isUnlocked={isUnlocked}
          onRewrite={handleRewrite}
          isRewriting={isRewriting}
          isSectionLocked={isSectionLocked}
          onUpgrade={() => {
            if (isPreviewFlow) {
              track("Paywall Clicked", { location: "guide-page", action: "unlock-section" })
              setPaymentDialogOpen(true)
            } else {
              router.push("/dashboard/billing")
            }
          }}
          editorKey={editorKey}
          editorRef={editorRef}
          storageKey={isPreviewFlow ? "preview-full" : "full-access-full"}
          editorId={isPreviewFlow ? "preview-single-editor" : "full-access-single-editor"}
          showEditTools={true}
          pdfFooter={
            isPreviewFlow ? (
              <div className="pdf-only mt-12 pt-8 border-t border-gray-200 px-8 pb-8">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-800">AI Style Guide Preview</div>
                    <div>Generated by aistyleguide.com</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Questions? Contact: support@aistyleguide.com</div>
                    <div>Get the complete guide: aistyleguide.com</div>
                  </div>
                  <div className="text-xs text-gray-500">© 2025 AI Style Guide. All rights reserved.</div>
                </div>
              </div>
            ) : null
          }
          editorBanner={
            contentUpdated && (content?.length ?? 0) > 0 ? (
              <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-500 z-10 shadow-md">
                <Check className="h-4 w-4 animate-in zoom-in duration-300" />
                Style Guide Updated
              </div>
            ) : undefined
          }
          contentClassName={`transition-all duration-500 ${isRetrying ? "opacity-50 blur-sm" : "opacity-100"}`}
        />
      </StyleGuideLayout>
      
      {/* Payment Dialog (preview flow) */}
      {isPreviewFlow && (
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[640px] text-sm sm:text-base">
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-base sm:text-xl">Get your full style guide</DialogTitle>
              <DialogDescription className="text-xs sm:text-base">
                Subscribe to unlock all rules, editing, and exports
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-blue-300 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900">RECOMMENDED</span>
                  <h4 className="mt-1 font-semibold">Pro — $29/mo</h4>
                  <p className="mt-1 text-xs text-muted-foreground">5 guides, full editing & export</p>
                  <Button
                    onClick={() => {
                      track("Payment Started", { plan: "pro", type: "subscription" })
                      handleSubscription("pro")
                    }}
                    disabled={processingPlan !== null}
                    className="mt-3 w-full"
                  >
                    {processingPlan === "pro" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Subscribe
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold">Team — $79/mo</h4>
                  <p className="mt-1 text-xs text-muted-foreground">99 guides, 5 seats, collaboration</p>
                  <Button
                    onClick={() => {
                      track("Payment Started", { plan: "team", type: "subscription" })
                      handleSubscription("team")
                    }}
                    disabled={processingPlan !== null}
                    className="mt-3 w-full"
                  >
                    {processingPlan === "team" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-start">
              <Button
                variant="secondary"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={processingPlan !== null}
                className="w-full text-base sm:text-lg py-4 sm:py-6"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Regenerate confirmation (full-access flow) */}
      {!isPreviewFlow && (
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
      )}
      
      {/* Download Options Dialog (full-access flow) */}
      {!isPreviewFlow && (
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
                onClick={() => handleDownloadFullAccess("docx")}
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
                onClick={() => handleDownloadFullAccess("md")}
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
      )}
      
      {/* Error message if there was an issue but we have existing content (full-access flow) */}
      {!isPreviewFlow && apiError && sections.length > 0 && (
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
    </div>
  )
}

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <GuideContent />
    </Suspense>
  )
}
