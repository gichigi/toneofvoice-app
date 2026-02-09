"use client"

import React, { Suspense, useCallback } from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, PenLine, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { callAPI, ErrorDetails } from "@/lib/api-utils"
import { ErrorMessage } from "@/components/ui/error-message"
import { Progress } from "@/components/ui/progress"

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const AUTO_REDIRECT_SECONDS = 3

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'complete' | 'error'>('generating')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<ErrorDetails | null>(null)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<string>('Preparing your brand details')
  const [progress, setProgress] = useState<number>(0)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-redirect countdown after generation completes
  const goToGuide = useCallback(() => {
    if (redirectUrl) router.push(redirectUrl)
  }, [redirectUrl, router])

  useEffect(() => {
    if (redirectCountdown === null || redirectCountdown < 0) return
    if (redirectCountdown === 0) {
      goToGuide()
      return
    }
    countdownRef.current = setInterval(() => {
      setRedirectCountdown((c) => (c !== null && c > 0 ? c - 1 : 0))
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [redirectCountdown, goToGuide])

  const getProgressSteps = () => [
    { message: 'Preparing your brand details', progress: 10 },
    { message: 'Analyzing your brand voice and personality', progress: 25 },
    { message: 'Creating writing rules and examples', progress: 50 },
    { message: 'Building before/after samples and word list', progress: 75 },
    { message: 'Finalizing your style guide', progress: 100 }
  ]

  const updateProgress = (stage: 'start' | 'voice' | 'rules' | 'examples' | 'complete') => {
    const steps = getProgressSteps()
    switch (stage) {
      case 'start':
        setCurrentStep(steps[0].message)
        setProgress(steps[0].progress)
        break
      case 'voice':
        setCurrentStep(steps[1].message)
        setProgress(steps[1].progress)
        break
      case 'rules':
        setCurrentStep(steps[2].message)
        setProgress(steps[2].progress)
        break
      case 'examples':
        setCurrentStep(steps[3].message)
        setProgress(steps[3].progress)
        break
      case 'complete':
        setCurrentStep(steps[4].message)
        setProgress(100)
        break
    }
  }

  // Generate style guide function (extracted for retry functionality)
  const generateStyleGuide = async () => {
    let progressInterval: ReturnType<typeof setInterval> | null = null
    try {
      setApiError(null)
      setGenerationStatus('generating')
      updateProgress('start')
      
      // Get brand details
      const brandDetails = localStorage.getItem("brandDetails")
      if (!brandDetails) {
        console.error("[Payment Success] No brand details found in localStorage")
        toast({
          title: "Session expired",
          description: "Please fill in your brand details again.",
          variant: "destructive",
        })
        // Redirect to brand details page with payment complete flag
        router.push("/brand-details?paymentComplete=true")
        return
      }

      console.log("[Payment Success] Found brand details, generating style guide...")
      
      // Parse and log the brand details
      const parsedBrandDetails = JSON.parse(brandDetails)
      console.log("[Payment Success] Parsed brand details:", parsedBrandDetails)
      console.log("[Payment Success] Sending to API")

      updateProgress('voice')

      progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 75) return p
          if (p < 25) {
            setCurrentStep('Analyzing your brand voice and personality')
            return 25
          }
          if (p < 50) {
            setCurrentStep('Creating writing rules and examples')
            return 50
          }
          setCurrentStep('Building before/after samples and word list')
          return 75
        })
      }, 25000)

      // Pass user email and preview content when available (preserve preview user liked)
      let userEmail = null
      let previewContent = null
      try {
        const captured = localStorage.getItem("emailCapture")
        if (captured) userEmail = JSON.parse(captured)?.email ?? null
        previewContent = localStorage.getItem("previewContent")
      } catch {}
      const data = await callAPI("/api/generate-styleguide", {
        brandDetails: parsedBrandDetails,
        userEmail: userEmail || undefined,
        previewContent: previewContent || undefined,
      })

      if (progressInterval) clearInterval(progressInterval)

      if (!data.success) {
        throw new Error(data.error || "Failed to generate style guide")
      }

      updateProgress('complete')

      // Save to localStorage for guide page
      localStorage.setItem("generatedStyleGuide", data.styleGuide)

      // Save to DB if user is logged in (best practice: persist immediately)
      try {
        const saveRes = await fetch("/api/save-style-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${parsedBrandDetails.name} Style Guide`,
            brand_name: parsedBrandDetails.name,
            content_md: data.styleGuide,
            plan_type: "style_guide",
            brand_details: parsedBrandDetails,
          }),
        })
        if (saveRes.ok) {
          const json = await saveRes.json()
          if (json.guide?.id) {
            localStorage.setItem("savedGuideId", json.guide.id)
          }
        }
      } catch {
        // Non-fatal; guide is in localStorage, user can still view
      }
      
      // Update status and start auto-redirect
      setGenerationStatus('complete')
      const gId = localStorage.getItem("savedGuideId")
      setRedirectUrl(gId ? `/guide?guideId=${gId}` : "/guide?generated=true")
      setRedirectCountdown(AUTO_REDIRECT_SECONDS)

    } catch (error) {
      if (progressInterval) clearInterval(progressInterval)
      console.error("Generation error:", error)
      
      // Use enhanced error handling
      if (error && typeof error === 'object' && 'message' in error && 'type' in error) {
        // This is already an ErrorDetails object from callAPI
        setApiError(error as ErrorDetails)
      } else {
        // Fallback for unexpected error format
        setApiError({
          message: "Something unexpected happened. Please try again or contact support if the issue persists.",
          type: "UNKNOWN_ERROR",
          canRetry: true,
          supportEmailLink: `mailto:support@aistyleguide.com?subject=${encodeURIComponent("Style Guide Generation Issue")}&body=${encodeURIComponent(`Hi AIStyleGuide Support Team,

I'm having trouble generating my style guide. Here are the details:

Error: UNKNOWN_ERROR
Time: ${new Date().toLocaleString()}

Please help me resolve this issue.

Thanks!`)}`
        })
      }
      
      setGenerationStatus('error')
      
      // Show basic toast for immediate feedback
      toast({
        title: "Generation failed",
        description: "Please see the detailed error message below.",
        variant: "destructive",
      })
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
    const sessionIdParam = searchParams.get("session_id")
    setSessionId(sessionIdParam)
    
    // Fire Google Ads conversion event (required even with page load conversion)
    if (typeof window !== 'undefined' && window.gtag) {
      console.log('🎯 Firing Google Ads conversion event...')
      
      // Event snippet as required by Google Ads documentation
      window.gtag('event', 'conversion', {
        'send_to': 'AW-943197631'  // Your conversion will be matched automatically
      })
    }
    
    // Temporarily commented out for testing conversion tracking
    // if (!sessionIdParam) {
    //   toast({
    //     title: "Invalid session",
    //     description: "Could not verify payment status. Please try again.",
    //     variant: "destructive",
    //   })
    //   router.push("/preview")
    //   return
    // }

    // Store payment status and guide type
    localStorage.setItem("styleGuidePaymentStatus", "completed")
    localStorage.setItem("styleGuidePlan", "style_guide")

    // Start generation process
    generateStyleGuide()
  }, [router, searchParams, toast])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50">
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-8 text-center max-w-md mx-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg ${
          generationStatus === 'error' 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          {generationStatus === 'generating' && (
            <>
              {/* Multiple pulsing rings for depth */}
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-blue-300 rounded-full animate-ping opacity-30" style={{ animationDelay: '150ms' }}></div>
              
              {/* Solid white spinning icon */}
              <Loader2 className="h-10 w-10 animate-spin text-white relative z-10" />
            </>
          )}
          {generationStatus === 'complete' && (
            <svg className="w-10 h-10 text-white animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {generationStatus === 'error' && (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          {generationStatus === 'generating' && "Payment Successful"}
          {generationStatus === 'complete' && "Your Style Guide is Ready"}
          {generationStatus === 'error' && "Generation Failed"}
        </h1>
        
        <p className="text-gray-600 text-sm mb-4">
          {generationStatus === 'generating' && "We're generating your personalized style guide now."}
          {generationStatus === 'complete' && "Your guide has been generated successfully"}
          {generationStatus === 'error' && "We couldn't make your guide. See details below."}
        </p>
        
        {generationStatus === 'generating' && (
          <div className="space-y-4 w-full">
            <p className="text-sm font-medium text-gray-700">{currentStep}</p>
            <Progress value={progress} className="h-2" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                This might take 1–2 minutes. Please don&apos;t leave this page.
              </p>
            </div>
            {/* Remind them what they can do once it's ready */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 text-left space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">When it&apos;s ready you can:</p>
              <div className="flex items-center gap-2.5">
                <PenLine className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Review and edit every section</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Download className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Export as PDF, Word, or Markdown</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Copy your brand voice for AI tools</span>
              </div>
            </div>
          </div>
        )}

        {generationStatus === 'complete' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            {/* What you unlocked */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <PenLine className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Review and edit every section</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Download className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Export as PDF, Word, or Markdown</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700">Copy your brand voice for AI tools</span>
              </div>
            </div>

            <Button
              onClick={goToGuide}
              className="w-full"
              size="lg"
            >
              View My Style Guide &rarr;
            </Button>

            {redirectCountdown !== null && redirectCountdown > 0 && (
              <p className="text-xs text-gray-400 animate-in fade-in duration-300">
                Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}…
              </p>
            )}
          </div>
        )}

        {generationStatus === 'error' && apiError && (
          <div className="space-y-6">
            {/* Reassuring message */}
            <div className="space-y-2">
              <p className="text-base text-gray-700">
                Something went wrong during generation, but <strong>your payment was successful</strong>.
              </p>
              <p className="text-sm text-gray-600">
                We'll get this sorted for you right away.
              </p>
            </div>

            {/* Enhanced ErrorMessage component with smart retry */}
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
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}