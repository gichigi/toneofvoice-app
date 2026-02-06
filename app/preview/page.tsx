"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CreditCard, Loader2, CheckCircle, Download } from "lucide-react"
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
// Tabs removed - subscription-only payment dialog no longer needs tabs
import Logo from "@/components/Logo"
import { StyleGuideHeader } from "@/components/StyleGuideHeader"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { ContentGate } from "@/components/ContentGate"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"

// (MiniPaywallBanner removed)

// Process preview content to remove duplicate title/subtitle but keep How to Use section
const processPreviewContent = (content: string, brandName: string = "") => {
  if (!content) return content;
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Remove the first paragraph that contains the date (May 29, 2025)
  const firstP = tempDiv.querySelector('p');
  if (firstP && firstP.textContent?.match(/\w+\s+\d{1,2},\s+\d{4}/)) {
    firstP.remove();
  }
  
  // Find and remove the first h1 that contains brand name or "Style Guide"
  const firstH1 = tempDiv.querySelector('h1');
  if (firstH1 && (
    (brandName && firstH1.textContent?.includes(brandName)) ||
    firstH1.textContent?.toLowerCase().includes('style guide')
  )) {
    firstH1.remove();
  }
  
  // Remove the subtitle paragraph "An essential guide..."
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    if (p.textContent?.toLowerCase().includes('essential guide') || 
        p.textContent?.toLowerCase().includes('clear and consistent')) {
      p.remove();
    }
  });
  
  // Remove any horizontal divider lines (hr tags) that are orphaned
  const hrTags = tempDiv.querySelectorAll('hr');
  hrTags.forEach(hr => hr.remove());
  
  // Wrap "How to Use This Document" section in a callout
  const howToUseH2 = Array.from(tempDiv.querySelectorAll('h2')).find(h2 => 
    h2.textContent?.toLowerCase().includes('how to use this document')
  );
  if (howToUseH2) {
    const calloutDiv = document.createElement('div');
    calloutDiv.className = 'how-to-use-callout';
    
    // Move the h2 into the callout
    calloutDiv.appendChild(howToUseH2.cloneNode(true));
    
    // Move following paragraphs until we hit another h2
    let nextElement = howToUseH2.nextElementSibling;
    while (nextElement && nextElement.tagName.toLowerCase() !== 'h2') {
      const elementToMove = nextElement;
      nextElement = nextElement.nextElementSibling;
      calloutDiv.appendChild(elementToMove.cloneNode(true));
      elementToMove.remove();
    }
    
    // Replace the original h2 with the callout
    howToUseH2.parentNode?.replaceChild(calloutDiv, howToUseH2);
  }
  
  // Add divider and brand name to Brand Voice section
  const brandVoiceH2 = Array.from(tempDiv.querySelectorAll('h2')).find(h2 => 
    h2.textContent?.toLowerCase().includes('brand voice')
  );
  if (brandVoiceH2) {
    // Add brand name to the heading
    const currentText = brandVoiceH2.textContent || 'Brand Voice';
    if (brandName && !currentText.includes(brandName)) {
      brandVoiceH2.textContent = `${brandName} Brand Voice`;
    }
    
    // Add divider before Brand Voice section
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid #e2e8f0';
    divider.style.margin = '2rem 0';
    brandVoiceH2.parentNode?.insertBefore(divider, brandVoiceH2);
    
    // Add numbering to brand voice traits
    let currentElement = brandVoiceH2.nextElementSibling;
    let traitNumber = 1;
    
    while (currentElement) {
      if (currentElement.tagName.toLowerCase() === 'h2') {
        // Stop if we hit another major section
        break;
      }
      if (currentElement.tagName.toLowerCase() === 'h3') {
        // Add numbering to trait titles
        const traitTitle = currentElement.textContent;
        if (traitTitle && !traitTitle.match(/^\d+\./)) {
          currentElement.textContent = `${traitNumber}. ${traitTitle}`;
          traitNumber++;
        }
      }
      currentElement = currentElement.nextElementSibling;
    }
  }
  
  return tempDiv.innerHTML;
};

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [processingPlan, setProcessingPlan] = useState<"pro" | "team" | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    // Load brand details with error handling
    try {
      const savedBrandDetails = localStorage.getItem("brandDetails")
      if (savedBrandDetails) {
        setBrandDetails(JSON.parse(savedBrandDetails))
      } else {
        // No brand details found, redirect to home
        setShouldRedirect(true)
      }
    } catch (error) {
      console.error('[Preview Page] Failed to load brand details from localStorage:', error)
      // If localStorage fails, redirect to home
      setShouldRedirect(true)
    }

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
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
        // Check if we already have the preview content saved from brand-details page
        const savedPreviewContent = localStorage.getItem("previewContent")
        if (savedPreviewContent) {
          console.log('[Preview Page] Using saved preview content (no API call needed)')
          if (isMounted) {
            setPreviewContent(savedPreviewContent)
            
            // Extract and save the generated trait descriptions for reuse in full-access
            const brandVoiceMatch = savedPreviewContent.match(/## Brand Voice([\s\S]*?)(?=##|$)/)
            if (brandVoiceMatch) {
              // Save only the content without the heading (full-access templates already have ## Brand Voice)
              const brandVoiceContent = brandVoiceMatch[1].trim()
              localStorage.setItem("generatedPreviewTraits", brandVoiceContent)
              localStorage.setItem("previewTraitsTimestamp", Date.now().toString())
              console.log('[Preview Page] Saved generated traits for reuse')
            }
          }
          return
        }
        
        // Only call API if no saved content exists (fallback case)
        console.log('[Preview Page] No saved content found, generating dynamic preview with AI content...')
        // Get selectedTraits from localStorage with error handling
        let selectedTraits = []
        try {
          const savedSelectedTraits = localStorage.getItem("selectedTraits")
          selectedTraits = savedSelectedTraits ? JSON.parse(savedSelectedTraits) : []
        } catch (parseError) {
          console.warn('[Preview Page] Failed to parse selectedTraits from localStorage:', parseError)
          selectedTraits = []
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
        console.log(`[Preview Page] Preview generated successfully in ${data.duration}`)
        
        if (isMounted) {
          setPreviewContent(data.preview)
          
          // Save the generated trait descriptions for reuse in full-access
          // Extract just the brand voice traits section from the preview
          const brandVoiceMatch = data.preview.match(/## Brand Voice([\s\S]*?)(?=##|$)/)
          if (brandVoiceMatch) {
            // Save only the content without the heading (full-access templates already have ## Brand Voice)
            const brandVoiceContent = brandVoiceMatch[1].trim()
            localStorage.setItem("generatedPreviewTraits", brandVoiceContent)
            localStorage.setItem("previewTraitsTimestamp", Date.now().toString())
            console.log('[Preview Page] Saved generated traits for reuse')
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
  // After sign-up/sign-in with subscribe param, start subscription checkout
  useEffect(() => {
    const sub = searchParams.get("subscribe")
    if (!sub || (sub !== "pro" && sub !== "team") || !user || subscribeTriggered.current) return
    subscribeTriggered.current = true
    const run = async () => {
      setIsProcessingPayment(true)
      try {
        const res = await fetch("/api/create-subscription-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: sub }),
        })
        const data = await res.json()
        if (res.ok && data.url) window.location.href = data.url
        else toast({ title: "Could not start checkout", variant: "destructive" })
      } finally {
        setIsProcessingPayment(false)
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
        console.error("[handleSubscription] API error:", {
          status: res.status,
          error: data.error,
          code: data.code,
          type: data.type,
        })
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

  const handlePayment = async (guideType: 'core' | 'complete') => {
    try {
      setIsProcessingPayment(true);
      
      // Get email capture token for abandoned cart tracking
      const emailCaptureToken = localStorage.getItem('emailCaptureToken');
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guideType,
          emailCaptureToken // Include for abandoned cart connection
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  // Download functionality (same as full-access page)
  const handleDownload = async (format: string) => {
    if (!previewContent || !brandDetails) return

    setIsDownloading(true)

    try {
      if (format === "pdf") {
        // Use html2pdf for PDF generation (same as full-access)
        const source = document.getElementById('pdf-export-content')
        if (!source) {
          throw new Error('PDF content not found')
        }

        // Create an offscreen clone to avoid mutating React-managed DOM
        const clone = source.cloneNode(true) as HTMLElement
        const wrapper = document.createElement('div')
        wrapper.style.position = 'fixed'
        wrapper.style.left = '-99999px'
        wrapper.style.top = '0'
        wrapper.style.background = '#ffffff'
        // Match width so line wraps are consistent
        wrapper.style.width = `${source.offsetWidth || 800}px`
        wrapper.appendChild(clone)
        document.body.appendChild(wrapper)

        // Show/hide PDF-specific elements on the clone only
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
          // Clean up offscreen wrapper
          if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
        }
      } else {
        // Keep existing method for other formats
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

  // If no preview content yet, show loading state
  if (!previewContent) {
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
      {/* (Mini paywall CSS removed) */}
      <div className="bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header with CTAs */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:border-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" linkToHome={true} />
          </div>
          
          {/* CTAs in header */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("pdf")}
              disabled={isDownloading}
              className="text-sm"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Preview
            </Button>
            
            <Button
              size="sm"
              onClick={() => {
                track('Header CTA Clicked', { 
                  location: 'sticky-header',
                  action: 'get-full-access'
                });
                setPaymentDialogOpen(true);
              }}
              className="text-sm bg-gray-900 hover:bg-gray-800 text-white"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Unlock Full Guide
            </Button>
          </div>
        </div>
      </header>

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

      {/* Download modal removed; immediate PDF download */}

      {/* Main Content */}
      <main className={`pt-24 pb-8 transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 px-8">
          <Link
            href="/brand-details"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

          <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
            <div id="pdf-export-content">
              <StyleGuideHeader 
                brandName={brandDetails?.name || 'Your Brand'} 
                guideType="core"
                showPreviewBadge={true}
              />
                <div className="p-8 bg-white">
                  <div className="max-w-2xl mx-auto space-y-12">
                    <div className="prose prose-slate dark:prose-invert max-w-none style-guide-content prose-sm sm:prose-base">
                      <ContentGate
                        content={previewContent || ""}
                        showUpgradeCTA={true}
                        onUpgrade={() => {
                          track('Paywall Clicked', { 
                            location: 'preview-page',
                            action: 'unlock-style-guide'
                          });
                          setPaymentDialogOpen(true);
                        }}
                        selectedTraits={(() => {
                          try {
                            const savedTraits = localStorage.getItem("selectedTraits")
                            return savedTraits ? JSON.parse(savedTraits) : []
                          } catch (e) {
                            return []
                          }
                        })()}
                      />
                    </div>
                  
                  {/* Professional PDF Footer - only in PDF */}
                  <div className="pdf-only mt-12 pt-8 border-t border-gray-200">
                    <div className="text-center space-y-3">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-800">AI Style Guide Preview</div>
                        <div>Generated by aistyleguide.com</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Questions? Contact: support@aistyleguide.com</div>
                        <div>Get the complete guide: aistyleguide.com</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        © 2025 AI Style Guide. All rights reserved.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
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

