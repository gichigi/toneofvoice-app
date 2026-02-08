"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, PenLine } from "lucide-react"
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
import { cn } from "@/lib/utils"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [processingPlan, setProcessingPlan] = useState<"pro" | "team" | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<Tier>("free")
  const [sections, setSections] = useState<StyleGuideSection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>("cover")
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteSuccessAt, setRewriteSuccessAt] = useState<number>(0)
  const [editorKey, setEditorKey] = useState(0)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
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

  // Fetch subscription tier
  useEffect(() => {
    if (!user) {
      setSubscriptionTier("free")
      return
    }
    
    fetch("/api/user-subscription-tier")
      .then(res => res.json())
      .then(data => setSubscriptionTier((data.subscription_tier || "free") as Tier))
      .catch(() => setSubscriptionTier("free"))
  }, [user])

  useEffect(() => {
    try {
      const savedBrandDetails = localStorage.getItem("brandDetails")
      if (savedBrandDetails) {
        setBrandDetails(JSON.parse(savedBrandDetails))
      } else {
        setShouldRedirect(true)
      }
    } catch (error) {
      console.error('[Preview Page] Failed to load brand details:', error)
      setShouldRedirect(true)
    }
  }, [])

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/full-access")
    }
  }, [shouldRedirect, router])

  useEffect(() => {
    let isMounted = true

    const loadPreview = async () => {
      if (!brandDetails) return
      
      try {
        const savedPreviewContent = localStorage.getItem("previewContent")
        if (savedPreviewContent) {
          if (isMounted) {
            setPreviewContent(savedPreviewContent)
            
            // Parse markdown into sections directly
            const parsed = parseStyleGuideContent(savedPreviewContent)
            // Add cover section manually (it's not in the content)
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
            setActiveSectionId('cover')
            
            // Extract traits for reuse
            const brandVoiceMatch = savedPreviewContent.match(/## Brand Voice([\s\S]*?)(?=##|$)/)
            if (brandVoiceMatch) {
              const brandVoiceContent = brandVoiceMatch[1].trim()
              localStorage.setItem("generatedPreviewTraits", brandVoiceContent)
              localStorage.setItem("previewTraitsTimestamp", Date.now().toString())
            }
          }
          return
        }
        
        // Fallback: generate preview
        let selectedTraits = []
        try {
          const savedSelectedTraits = localStorage.getItem("selectedTraits")
          selectedTraits = savedSelectedTraits ? JSON.parse(savedSelectedTraits) : []
        } catch (parseError) {
          console.warn('[Preview Page] Failed to parse selectedTraits:', parseError)
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
          setPreviewContent(data.preview)
          
          // Parse markdown into sections directly
          const parsed = parseStyleGuideContent(data.preview)
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
          setActiveSectionId('cover')
          
          // Extract traits
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
  }, [brandDetails, toast])

  const subscribeTriggered = useRef(false)
  useEffect(() => {
    const sub = searchParams.get("subscribe")
    if (!sub || (sub !== "pro" && sub !== "team") || !user || subscribeTriggered.current) return
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
    router.replace("/preview", { scroll: false })
  }, [searchParams.get("subscribe"), user, router, toast])

  const handleSubscription = async (plan: "pro" | "team") => {
    try {
      setProcessingPlan(plan)
      if (!user) {
        router.push(`/sign-up?redirectTo=${encodeURIComponent(`/preview?subscribe=${plan}`)}`)
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

  const handleDownload = async (format: string = "pdf") => {
    if (!previewContent || !brandDetails) return

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
        const file = await generateFile(format as FileFormat, previewContent, brandDetails.name)
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

  const handleRewrite = async (instruction: string, scope: "section" | "selection" | "document", selectedText?: string) => {
    if (!previewContent) return

    setIsRewriting(true)
    try {
      let currentContent = ""
      if (scope === "selection" && selectedText) {
        currentContent = selectedText
      } else if (scope === "document") {
        currentContent = previewContent
      } else {
        // section scope
        if (!activeSectionId || activeSectionId === "cover") {
          throw new Error("No section selected")
        }
        currentContent = getSectionContentFromMarkdown(previewContent, activeSectionId)
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
        let newContent = previewContent
        if (scope === "selection" && selectedText && editorRef.current) {
          // For selection, we'd need to replace the selected text in the editor
          // This is more complex and would require editor manipulation
          // For now, fall back to section replacement
          if (activeSectionId && activeSectionId !== "cover") {
            newContent = replaceSectionInMarkdown(previewContent, activeSectionId, data.content)
          }
        } else if (scope === "document") {
          newContent = data.content
        } else {
          // section scope
          if (!activeSectionId || activeSectionId === "cover") {
            throw new Error("No section selected")
          }
          newContent = replaceSectionInMarkdown(previewContent, activeSectionId, data.content)
        }
        
        setPreviewContent(newContent)
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

  const activeSection = sections.find(s => s.id === activeSectionId)
  const isSectionLocked = activeSection ? !isUnlocked(activeSection.minTier) : false

  // Loading state
  if (!previewContent || sections.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading preview...</p>
      </div>
    )
  }

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://aistyleguide.com" },
        { name: "Brand Details", url: "https://aistyleguide.com/brand-details" },
        { name: "Preview", url: "https://aistyleguide.com/preview" }
      ]} />
      
      <StyleGuideLayout
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={handleSectionSelect}
        subscriptionTier={subscriptionTier}
        brandName={brandDetails?.name || 'Your Brand'}
        onUpgrade={() => {
          track('Paywall Clicked', { 
            location: 'preview-page',
            action: 'unlock-style-guide'
          })
          setPaymentDialogOpen(true)
        }}
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
          content={previewContent}
          onContentChange={(full) => {
            setPreviewContent(full)
            try {
              localStorage.setItem("previewContent", full)
            } catch (e) {
              console.warn("[Preview] Failed to save", e)
            }
          }}
          brandName={brandDetails?.name || "Your Brand"}
          guideType="core"
          showPreviewBadge={true}
          isUnlocked={isUnlocked}
          onRewrite={handleRewrite}
          isRewriting={isRewriting}
          isSectionLocked={isSectionLocked}
          onUpgrade={() => {
            track("Paywall Clicked", { location: "preview-page", action: "unlock-section" })
            setPaymentDialogOpen(true)
          }}
          editorKey={editorKey}
          editorRef={editorRef}
          storageKey="preview-full"
          editorId="preview-single-editor"
          showEditTools={true}
          pdfFooter={
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
          }
        />
      </StyleGuideLayout>

      {/* Payment Dialog */}
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
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold">Pro — $29/mo</h4>
                <p className="mt-1 text-xs text-muted-foreground">5 guides, core rules, AI editing</p>
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
              <div className="rounded-lg border border-blue-300 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900">RECOMMENDED</span>
                <h4 className="mt-1 font-semibold">Team — $79/mo</h4>
                <p className="mt-1 text-xs text-muted-foreground">Unlimited guides, complete rules</p>
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
    </>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <PreviewContent />
    </Suspense>
  )
}
