"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  FileText,
  CheckCircle,
  ArrowRight,
  FileDown,
  PenTool,
  FileCode,
  Globe,
  Sparkles,
  Loader2,
  AlertTriangle,
  Users,
  Rocket,
  Briefcase,
  Check,
  X,
  FileQuestion,
  AlertCircle,
  FileCheck,
  UserCheck,
  Shield,
  Clock,
  Target,
  Heart,
  Zap,
  ShieldOff,
  Hash,
  Eye,
  BookOpen,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { validateInput, sanitizeInput, detectInputType } from "@/lib/input-utils"
import BrandBanner from "@/components/BrandBanner"
import Logo from "@/components/Logo"
import Header from "@/components/Header"
import { TRAITS, type TraitName } from "@/lib/traits"

// Lazy load non-critical sections (moved outside component to prevent re-creation on re-renders)
const TestimonialsSection = dynamic(() => import("../components/testimonials-section"), {
  ssr: false,
  loading: () => <div className="w-full py-12 md:py-20 lg:py-24 bg-muted"></div>,
})

const CompanyLogosSection = dynamic(() => import("../components/company-logos-section"), {
  ssr: false,
  loading: () => <div className="w-full py-6 bg-muted"></div>,
})

// Default brand details
const defaultBrandDetails = {
  name: "AIStyleGuide",
  description: "A web app that generates brand voice and content style guides",
  audience: "marketing professionals aged 25-45 who are interested in branding, content creation, and efficiency",
}

// Feature flag for Nike demo CTA
const SHOW_NIKE_DEMO_CTA = false;

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<string | null>(null) // Track error type for styling
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [extractionStartTime, setExtractionStartTime] = useState<number | null>(null)
  const [showSolutions, setShowSolutions] = useState(false) // Toggle state for brand voice section
  const [selectedTrait, setSelectedTrait] = useState<TraitName>("Direct") // Selected trait for preview
  const [traitCyclePaused, setTraitCyclePaused] = useState(false) // Pause auto-cycle when user clicks
  const traitCycleIntervalRef = useRef<NodeJS.Timeout | null>(null) // Ref for interval
  const traitCyclePausedRef = useRef(false) // Ref to track paused state without causing re-renders
  const [ruleCount, setRuleCount] = useState(0) // Counter for animated rule count
  const [hasAnimated, setHasAnimated] = useState(false) // Track if counter has animated
  const [inputAnimating, setInputAnimating] = useState(false) // Track input animation state
  const inputRef = useRef<HTMLInputElement>(null) // Ref for input field

  // Handle "Get Started" button click - animate and focus input
  useEffect(() => {
    const animateAndFocusInput = () => {
      if (inputRef.current) {
        // Check if we're already at the hero section
        const heroElement = document.getElementById('hero')
        const isAtHero = heroElement && 
          window.scrollY < heroElement.offsetTop + heroElement.offsetHeight
        
        if (isAtHero) {
          // User is already at top, focus immediately
          setInputAnimating(true)
          inputRef.current.focus()
          setTimeout(() => setInputAnimating(false), 2000)
        } else {
          // User needs to scroll, wait for scroll then focus
          setTimeout(() => {
            setInputAnimating(true)
            inputRef.current?.focus()
            setTimeout(() => setInputAnimating(false), 2000)
          }, 500)
        }
      }
    }

    const handleHashChange = () => {
      if (window.location.hash === '#hero') {
        animateAndFocusInput()
      }
    }

    // Check on mount if hash is #hero
    if (window.location.hash === '#hero') {
      animateAndFocusInput()
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    // Also listen for custom event from Header component
    const handleGetStartedClick = () => {
      animateAndFocusInput()
    }
    window.addEventListener('get-started-clicked', handleGetStartedClick)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('get-started-clicked', handleGetStartedClick)
    }
  }, [])

  // Auto-cycle through traits for demo
  useEffect(() => {
    const traits: TraitName[] = ["Direct", "Refined", "Witty", "Warm"]

    // Clear any existing interval first
    if (traitCycleIntervalRef.current) {
      clearInterval(traitCycleIntervalRef.current)
    }

    traitCycleIntervalRef.current = setInterval(() => {
      // Check paused state via ref (doesn't cause re-render)
      if (traitCyclePausedRef.current) return
      
      setSelectedTrait((prevTrait) => {
        const prevIndex = traits.indexOf(prevTrait)
        const nextIndex = (prevIndex + 1) % traits.length
        return traits[nextIndex]
      })
    }, 5000) // 5 seconds per trait - enough time to scan

    return () => {
      if (traitCycleIntervalRef.current) {
        clearInterval(traitCycleIntervalRef.current)
        traitCycleIntervalRef.current = null
      }
    }
  }, []) // Empty deps - only run once on mount, never restart

  // Sync paused state to ref
  useEffect(() => {
    traitCyclePausedRef.current = traitCyclePaused
  }, [traitCyclePaused])

  // Counter animation for rules section with smooth easing
  useEffect(() => {
    if (hasAnimated) return

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px'
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          
          const startTime = Date.now()
          const duration = 2000 // 2 seconds
          const start = 0
          const end = 99
          
          // Ease-out function: easeOutQuad for gentler deceleration
          const easeOutQuad = (t: number): number => {
            return 1 - (1 - t) * (1 - t)
          }

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutQuad(progress)
            const current = Math.floor(start + (end - start) * eased)
            
            setRuleCount(current)
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setRuleCount(end)
            }
          }
          
          requestAnimationFrame(animate)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    const element = document.getElementById('whats-included')
    
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [hasAnimated])

  // Progressive loading word arrays
  const descriptionWords = ["Thinking...", "Exploring...", "Assembling...", "Creating..."]
  const urlWords = ["Reading...", "Understanding...", "Assembling...", "Creating..."]

  // Cycle through loading messages
  useEffect(() => {
    if (!isExtracting || !extractionStartTime) return

    // Determine input type from URL state
    const isUrl = url.trim().startsWith('http') || url.trim().includes('.')
    const words = isUrl ? urlWords : descriptionWords
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - extractionStartTime
      const wordIndex = Math.floor(elapsed / 2000) % words.length // Change word every 2 seconds
      setLoadingMessage(words[wordIndex])
    }, 200) // Update every 200ms for smooth transitions

    return () => clearInterval(interval)
  }, [isExtracting, extractionStartTime, url, urlWords, descriptionWords])

  // Helper to clamp descriptions to 200 chars for validation/submission
  const getEffectiveInput = (raw: string) => {
    const trimmed = raw.trim()
    const detection = detectInputType(trimmed)
    if (detection.inputType === 'description' && trimmed.length > 200) {
      return trimmed.slice(0, 200)
    }
    return trimmed
  }

  // Check if input is valid for submission
  const isInputValid = () => {
    const effective = getEffectiveInput(url)
    if (!effective) return false
    
    const validation = validateInput(effective)
    return validation.isValid
  }


  // Classify error types for better UX
  const classifyError = (error: any, response?: Response): { type: string; message: string } => {
    // Handle cases where error is an empty object or null
    let errorMessage = "Unknown error"
    
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      } else if (typeof error === 'object' && Object.keys(error).length === 0) {
        errorMessage = "Empty error response"
      } else if (error.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString()
      } else {
        errorMessage = "An unexpected error occurred"
      }
    }
    
    try {
      console.error(`[HOMEPAGE] Error classification:`, {
        errorMessage,
        errorName: error?.name,
        errorType: typeof error,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        responseStatus: response?.status,
        responseStatusText: response?.statusText,
        timestamp: new Date().toISOString()
      })
    } catch (logError) {
      console.error(`[HOMEPAGE] Error in error classification:`, logError)
    }

    // Network-specific errors
    if (error?.name === 'AbortError' || errorMessage.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        message: "Site didn't respond. Try again or add details manually."
      }
    }
    
    if (errorMessage.includes('ECONNRESET') || errorMessage.includes('connection reset')) {
      return {
        type: 'CONNECTION_RESET',
        message: "Connection was interrupted. Try again or add details manually."
      }
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
      return {
        type: 'NETWORK',
        message: "Can't reach this site. Try again later."
      }
    }
    
    if (errorMessage.includes('SSL') || errorMessage.includes('certificate') || errorMessage.includes('CERT')) {
      return {
        type: 'SSL',
        message: "Site has security issues. Add details manually."
      }
    }

    // API-specific errors based on response
    if (response?.status === 429) {
      return {
        type: 'RATE_LIMIT',
        message: "AI is overloaded. Try again in a few minutes."
      }
    }

    if (response?.status === 402 || errorMessage.includes('quota') || errorMessage.includes('billing')) {
      return {
        type: 'QUOTA_EXCEEDED',
        message: "AI unavailable. Try again later."
      }
    }

    if (errorMessage.includes('content policy') || errorMessage.includes('safety') || errorMessage.includes('inappropriate')) {
      return {
        type: 'CONTENT_POLICY',
        message: "Couldnt analyze content. Add details manually."
      }
    }

    // Website content issues
    if (errorMessage.includes('javascript') || errorMessage.includes('dynamic content')) {
      return {
        type: 'JAVASCRIPT_SITE',
        message: "Site uses dynamic content. Add details manually."
      }
    }

    if (errorMessage.includes('login') || errorMessage.includes('authentication') || errorMessage.includes('password')) {
      return {
        type: 'LOGIN_REQUIRED',
        message: "Login required. Add details manually."
      }
    }

    if (errorMessage.includes('no content') || errorMessage.includes('empty') || errorMessage.includes('insufficient content')) {
      return {
        type: 'NO_CONTENT',
        message: "Not enough content. Add details manually."
      }
    }

    // Input processing errors
    if (errorMessage.includes('Invalid URL') || errorMessage.includes('malformed')) {
      return {
        type: 'MALFORMED_URL',
        message: "Check URL format."
      }
    }

    if (errorMessage.includes('Description too short') || errorMessage.includes('at least 5 words')) {
      return {
        type: 'DESCRIPTION_TOO_SHORT',
        message: "Please enter at least 5 words to describe your brand"
      }
    }

    if (errorMessage.includes('Description is too long') || errorMessage.includes('under 200 characters')) {
      return {
        type: 'DESCRIPTION_TOO_LONG',
        message: "Description is too long. Please keep it under 200 characters"
      }
    }

    if (errorMessage.includes('unsupported') || errorMessage.includes('blocked')) {
      return {
        type: 'UNSUPPORTED_DOMAIN',
        message: "Can't access this site type. Add details manually."
      }
    }

    if (errorMessage.includes('test domain') || errorMessage.includes('example domain')) {
      return {
        type: 'TEST_DOMAIN',
        message: "This is a test domain. Enter a real site."
      }
    }

    // Handle empty error responses  
    if (errorMessage === "Empty error response") {
      return {
        type: 'EMPTY_RESPONSE',
        message: "Can't analyze this site. Try again or add details manually."
      }
    }

    // Default error
    return {
      type: 'UNKNOWN',
      message: "Problem analyzing site. Try again or add details manually."
    }
  }

  // Input validation using our new utility functions
  const handleInputValidation = (input: string) => {
    const validation = validateInput(input)
    if (!validation.isValid && validation.error) {
      setError(validation.error)
      return false
    }
    setError("")
    return validation
  }

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setErrorType(null)
    setIsSuccess(false)
    
    console.log(`[HOMEPAGE] Starting extraction process`)
    const extractionStart = performance.now()

    // Get effective input (clamped to 200 for descriptions)
    const effective = getEffectiveInput(url)
    
    // Validate input using our utility
    const validation = handleInputValidation(effective)
    if (!validation) return

    console.log(`[HOMEPAGE] Input validation passed:`, {
      inputType: validation.inputType,
      cleanInput: validation.cleanInput.substring(0, 100) + '...',
      originalLength: url.length,
      cleanLength: validation.cleanInput.length
    })

    // Handle empty input - navigate to manual entry
    if (validation.inputType === 'empty') {
      console.log(`[USER_JOURNEY] Empty input - redirecting to manual entry`)
      router.push("/brand-details")
      return
    }
    
    setIsExtracting(true)
    const startTime = Date.now()
    setExtractionStartTime(startTime)
    
    // Set initial loading message
    const isUrl = validation.inputType === 'url'
    const words = isUrl ? urlWords : descriptionWords
    setLoadingMessage(words[0])
    
    console.log(`[HOMEPAGE] Starting ${validation.inputType} extraction for: ${validation.cleanInput.substring(0, 50)}...`)

    try {
      let response
      const apiStartTime = performance.now()
      
      if (validation.inputType === 'url') {
        console.log(`[HOMEPAGE] Calling extract-website API (URL mode)`)
        response = await fetch("/api/extract-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: validation.cleanInput }),
        })
      } else {
        console.log(`[HOMEPAGE] Calling extract-website API (description mode)`)
        response = await fetch("/api/extract-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: validation.cleanInput }),
        })
      }

      const apiTime = performance.now() - apiStartTime
      console.log(`[PERFORMANCE] API call completed in ${apiTime.toFixed(2)}ms`)

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error(`[HOMEPAGE] Failed to parse JSON response:`, jsonError)
        data = { success: false, error: 'Invalid response format' }
      }
      
      console.log(`[HOMEPAGE] API response received:`, {
        success: data?.success,
        hasName: !!data?.brandName,
        hasDescription: !!data?.brandDetailsDescription,
        status: response.status,
        responseTime: apiTime,
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : []
      })

      if (data.success) {
        // Save to localStorage with both name and description
        const brandDetails = {
          name: data.brandName || "",
          brandDetailsDescription: data.brandDetailsDescription,
          audience: data.audience || ""
        }
        if (data.keywords) {
          localStorage.setItem("brandKeywords", data.keywords)
        }
        
        if (data.suggestedTraits) {
          localStorage.setItem("suggestedTraits", JSON.stringify(data.suggestedTraits))
        }
        
        localStorage.setItem("brandDetails", JSON.stringify(brandDetails))
        console.log(`[USER_JOURNEY] Brand details saved to localStorage:`, {
          hasName: !!brandDetails.name,
          descriptionLength: brandDetails.brandDetailsDescription?.length || 0
        })

        // Show success state briefly before redirecting
        setIsSuccess(true)
        setIsExtracting(false)
        setLoadingMessage("")
        setExtractionStartTime(null)

        const totalTime = performance.now() - extractionStart
        console.log(`[PERFORMANCE] Total extraction completed in ${totalTime.toFixed(2)}ms`)
        console.log(`[USER_JOURNEY] Extraction successful - redirecting to brand-details`)

        // Navigate to brand details page after a short delay for transition
        setTimeout(() => {
          router.push("/brand-details?fromExtraction=true")
        }, 800)
      } else {
        // Classify and show specific error
        const { type, message } = classifyError(data || {}, response)
        setError(message)
        setErrorType(type)

        console.error(`[HOMEPAGE] API returned error:`, {
          errorType: type,
          message: data?.message || 'No error message',
          originalError: data?.error || 'No original error',
          status: response?.status || 'No status',
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : []
        })

        // Reset states
        setIsExtracting(false)
        setIsSuccess(false)
        setLoadingMessage("")
        setExtractionStartTime(null)

        console.log(`[USER_JOURNEY] Error occurred - staying on homepage for retry`)
        // Don't redirect - let user fix the error and try again
      }
    } catch (error) {
      const totalTime = performance.now() - extractionStart
      const { type, message } = classifyError(error)
      
      console.error(`[HOMEPAGE] Extraction failed after ${totalTime.toFixed(2)}ms:`, {
        errorType: type,
        originalError: error,
        inputType: validation?.inputType,
        url: validation?.cleanInput?.substring(0, 100),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString()
      })

      setError(message)
      setErrorType(type)

      // Reset states
      setIsExtracting(false)
      setIsSuccess(false)
      setLoadingMessage("")
      setExtractionStartTime(null)

      console.log(`[USER_JOURNEY] Exception occurred - staying on homepage for retry`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <style jsx global>{logoStyles}</style>
      <Header showNavigation={true} showGetStarted={true} />
      <main className="flex-1">
        {/* 
          Background Pattern: Hero (gradient) → Features (muted) → Comparison (background) → How It Works (muted) → Example (background) → Pricing (muted) → Who It's For (background) → FAQ (muted) → Final CTA (background)
        */}
        {/* Hero Section - Redesigned with URL input */}
        <section id="hero" className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md">
                <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                AI-Powered Brand Voice Guidelines
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4">
                Get ChatGPT to <em>finally</em> sound like you
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8 hero-lead">
                Create a professional brand tone of voice and content style guide to use with AI so you always sound like you.  
              </p>

              <form onSubmit={handleExtraction} className="w-full max-w-2xl">
                {/* Mobile-optimized input layout */}
                <div className="w-full max-w-2xl mx-auto mt-4 mb-6">
                  {/* Mobile: Stack vertically, Desktop: Side by side */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-1 sm:p-1 sm:rounded-xl sm:bg-white sm:border sm:border-blue-200 sm:shadow-sm">
                    <div className="relative flex-1">
                      {/* Icon - smaller on mobile, normal on desktop */}
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter URL or short description"
                        className={`
                          w-full py-4 pl-10 pr-4 sm:pl-11 sm:pr-4 sm:py-3
                          text-base font-medium 
                          bg-white sm:bg-transparent 
                          border border-blue-200 sm:border-none 
                          rounded-lg sm:rounded-none
                          shadow-sm sm:shadow-none
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:focus:ring-0 sm:focus:outline-none 
                          placeholder:text-gray-500 placeholder:font-normal placeholder:text-sm
                          transition-all duration-200 
                          ${error ? "ring-2 ring-red-500 border-red-500" : ""} 
                          ${isSuccess ? "ring-2 ring-green-500 bg-green-50" : ""}
                          ${inputAnimating ? "ring-4 ring-blue-400 animate-glow-pulse" : ""}
                        `}
                        value={url}
                        onChange={(e) => {
                          const sanitizedValue = sanitizeInput(e.target.value, url)
                          setUrl(sanitizedValue)

                          if (error) {
                            setError("")
                            setErrorType(null)
                          }
                        }}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        inputMode="text"
                        disabled={isExtracting || isSuccess}
                        aria-label="Website URL or brand description"
                        aria-describedby={error ? "input-error" : undefined}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      onClick={() => track('Generate Button Clicked', { 
                        hasUrl: !!url.trim(),
                        location: 'hero'
                      })}
                      className={`
                        w-full sm:w-auto
                        h-14 sm:h-12 px-6 sm:px-4 
                        rounded-lg sm:rounded-lg
                        bg-black text-white font-semibold text-base sm:text-sm
                        shadow-sm sm:shadow-none 
                        hover:bg-gray-800 focus:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 
                        transition-all duration-200 
                        ${isSuccess ? "bg-green-500 hover:bg-green-600 text-white focus:ring-green-400" : ""}
                        ${!isInputValid() && !isExtracting && !isSuccess ? "opacity-75 cursor-not-allowed" : ""}
                      `}
                      disabled={isExtracting || isSuccess || !isInputValid()}
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>{loadingMessage || "Processing"}</span>
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          <span>Done!</span>
                        </>
                      ) : (() => {
                        const trimmed = url.trim()
                        const hasSpace = trimmed.includes(" ")
                        const detection = detectInputType(trimmed)
                        const isDesc = detection.inputType === "description" && hasSpace
                        
                        if (isDesc && trimmed.length < 25) {
                          return <span>Min. 25 characters</span>
                        }
                        
                        return (
                          <>
                            <span>Generate</span> 
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )
                      })()}
                    </Button>
                  </div>
                  
                  {/* Inline error display */}
                  {error && (
                    <div 
                      id="input-error" 
                      className="mt-3 text-red-600 text-sm font-medium flex items-start gap-1 leading-5 max-w-lg"
                      role="alert"
                      aria-live="polite"
                    >
                      <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 text-left">
                      {(() => {
                        const trimmed = url.trim()
                        const hasSpace = trimmed.includes(" ")
                        const detection = detectInputType(trimmed)
                        const isDesc = detection.inputType === "description" && hasSpace
                        
                        if (!isDesc || error) return null
                        
                        const len = trimmed.length
                        
                        return (
                          <span
                            className="text-xs sm:text-sm font-medium tabular-nums text-muted-foreground"
                            role="status"
                          >
                            {len <= 200 ? `${len}/200 characters` : "Using first 200 characters"}
                          </span>
                        )
                      })()}
                    </div>
                    <Link 
                      href="/brand-details" 
                      onClick={() => track('Manual Entry Clicked', { location: 'hero' })}
                      className="text-gray-500 underline font-medium text-xs whitespace-nowrap" 
                      style={{ textTransform: 'lowercase' }}
                    >
                      add manually
                    </Link>
                  </div>
                </div>
              </form>
              
              {/* Secondary CTA: View Demo */}
              <div className="mt-6 flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 border-0"
                >
                  <Link 
                    href="/demo"
                    onClick={() => track('View Demo Clicked', { location: 'hero' })}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    See Example
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <BrandBanner />
        
        {/* Why Brand Voice Matters - Interactive Toggle Pattern */}
        <section id="features" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            {/* Interactive Toggle Header */}
            <div className="flex flex-col items-start space-y-4 max-w-5xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
                When you
              </h2>
              <div className="flex flex-row items-center gap-3">
                <button
                  onClick={() => {
                    setShowSolutions(!showSolutions)
                    track('Toggle Problems Solutions', { 
                      showing: !showSolutions ? 'solutions' : 'problems'
                    })
                  }}
                  className="relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: showSolutions ? '#3b82f6' : '#ef4444'
                  }}
                  aria-label={showSolutions ? "Show problems" : "Show solutions"}
                  aria-pressed={showSolutions}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ease-out ${
                      showSolutions ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter transition-colors duration-300 break-words md:break-normal" style={{
                  color: showSolutions ? '#3b82f6' : '#ef4444'
                }}>
                  {showSolutions ? 'have a brand voice' : "don't have a brand voice"}
                </h2>
              </div>
            </div>

            {/* Content Area - Switches Based on Toggle */}
            <div className="mx-auto max-w-5xl mb-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {showSolutions ? (
                  // Solutions (Toggle ON)
                  <>
                    {[
                      { icon: CheckCircle, title: "Consistent messaging", desc: "Clear, unified voice across all content that resonates with your audience and builds trust" },
                      { icon: FileCheck, title: "Complete style guidelines", desc: "Detailed guidelines with brand voice, do's/don'ts, and examples to align your entire team" },
                      { icon: UserCheck, title: "Team alignment", desc: "Everyone writes in your brand's voice, creating consistent experiences at every touchpoint" },
                      { icon: Shield, title: "Strong brand identity", desc: "Every message reinforces who you are, making your brand instantly recognizable and memorable" },
                      { icon: Heart, title: "Customer trust", desc: "Clear, consistent voice builds credibility and makes customers feel confident choosing you" },
                      { icon: Zap, title: "Faster content creation", desc: "Guidelines eliminate guesswork, so your team spends less time debating and more time creating" },
                    ].map((card, index) => {
                      const Icon = card.icon
                      const delay = index * 100 // Stagger: 0ms, 100ms, 200ms, 300ms, 400ms, 500ms
                      return (
                        <div
                          key={`solution-${index}`}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade"
                          style={{
                            animationDelay: `${delay}ms`
                          }}
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  // Problems (Toggle OFF)
                  <>
                    {[
                      { icon: AlertTriangle, title: "Inconsistent messaging", desc: "Inconsistent messages that don't resonate with your audience, causing confusion and disconnect" },
                      { icon: FileQuestion, title: "Unclear guidelines", desc: "Guidelines missing critical sections, leaving your team guessing and even disagreeing" },
                      { icon: AlertCircle, title: "Team confusion", desc: "Everyone writes differently, creating mixed messages, lost brand equity and identity" },
                      { icon: ShieldOff, title: "Lost brand identity", desc: "Every piece of content sounds different, diluting your brand and making you forgettable" },
                      { icon: X, title: "Customer confusion", desc: "Mixed messages erode trust and make customers question whether you're the right choice" },
                      { icon: Clock, title: "Time wasted", desc: "Teams spend hours debating tone and rewriting content instead of focusing on what matters" },
                    ].map((card, index) => {
                      const Icon = card.icon
                      const delay = index * 100 // Stagger: 0ms, 100ms, 200ms, 300ms, 400ms, 500ms
                      return (
                        <div
                          key={`problem-${index}`}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade"
                          style={{
                            animationDelay: `${delay}ms`
                          }}
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* What's Included - Enhanced Section */}
        <section id="whats-included" className="w-full py-12 md:py-20 lg:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  What's included in your style guide
                </h2>
                <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
                  Everything you need to create compelling content that always sounds like you
                </p>
              </div>
            </div>

            {/* Card-based Layout: Stats + Features */}
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    number: ruleCount > 0 ? ruleCount : '99',
                    suffix: '+',
                    title: "Enterprise writing rules",
                    description: "Based on style guides from Apple, Spotify, BBC, and other top brands",
                    iconBg: "bg-blue-100",
                    delay: '0ms'
                  },
                  {
                    number: '3',
                    suffix: '',
                    title: "Brand voice traits",
                    description: "Complete definitions, do's, don'ts customised for your brand",
                    iconBg: "bg-purple-100",
                    delay: '100ms'
                  },
                  {
                    number: '15',
                    suffix: '',
                    title: "Keywords",
                    description: "Brand-specific terms included in your guide to ensure consistency",
                    iconBg: "bg-green-100",
                    delay: '200ms'
                  },
                  {
                    number: '3',
                    suffix: '',
                    title: "Before/After examples",
                    description: "See your brand voice applied to content examples for your brand",
                    iconBg: "bg-orange-100",
                    delay: '300ms'
                  },
                  {
                    number: '4',
                    suffix: '',
                    title: "Export formats",
                    description: "Export as PDF to share, Microsoft Word to edit, or markdown for AI",
                    iconBg: "bg-indigo-100",
                    delay: '400ms'
                  },
                  {
                    number: '5',
                    suffix: '',
                    title: "Minutes to complete",
                    description: "No prompting, no templates. Enter the URL or description to start",
                    iconBg: "bg-pink-100",
                    delay: '500ms'
                  },
                ].map((feature, index) => {
                  return (
                    <div
                      key={`feature-${index}`}
                      className={`${feature.iconBg} rounded-lg border border-transparent shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade`}
                      style={{
                        animationDelay: feature.delay,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl md:text-6xl font-bold text-gray-900 tabular-nums">
                          {feature.number}
                        </span>
                        {feature.suffix && (
                          <span className="text-4xl md:text-5xl font-bold text-gray-900">
                            {feature.suffix}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl text-gray-900 font-medium mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose AIStyleGuide - Comparison Table */}
        <section id="comparison" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Why choose AIStyleGuide
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  See how we compare to using a template or ChatGPT
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl py-10">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-100">
                      <th className="text-left py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">What you get</th>
                      <th className="text-center py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">Templates</th>
                      <th className="text-center py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">ChatGPT</th>
                      <th className="text-center py-5 px-4 font-bold text-gray-700 text-xl sm:text-lg">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-md overflow-hidden shadow-sm">
                            <div className="h-full w-full grid grid-cols-2">
                              <div className="bg-primary"></div>
                              <div className="bg-blue-500"></div>
                              <div className="bg-gray-200"></div>
                              <div className="bg-indigo-600"></div>
                            </div>
                          </div>
                          <span>AISG</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 bg-slate-50">
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">Complete brand voice & style guidelines</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">Writing rules from Apple, BBC, Spotify</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-slate-50">
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">Analyse any brand website with a click</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">No prompt engineering required</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">Beautiful, clean style document</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">Ready to use in under 5 minutes</td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <X className="h-5 w-5 text-orange-600" />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {/* Feature Card 1 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">Complete brand voice & style guidelines</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">Writing rules from Apple, BBC, Spotify etc.</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">Analyse any brand website with a click</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 4 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">No prompt engineering required</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 5 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">Beautiful, clean style document</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 6 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 text-base mb-3 text-center">Ready to use in under 5 minutes</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Templates</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-sm overflow-hidden">
                          <div className="h-full w-full grid grid-cols-2">
                            <div className="bg-primary"></div>
                            <div className="bg-blue-500"></div>
                            <div className="bg-gray-200"></div>
                            <div className="bg-indigo-600"></div>
                          </div>
                        </div>
                        <span>AISG</span>
                      </div>
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Input to impact */}
        <section id="how-it-works" className="w-full py-12 md:py-20 lg:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Input to impact in 3 steps
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Generate a professional writing style guide tailored to your brand in just a few clicks
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold">Get started</h3>
                <p className="text-center text-muted-foreground">
                  Enter the URL or description of your brand to get started
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold">Pick voice traits</h3>
                <p className="text-center text-muted-foreground">
                  Select the right voice traits and brand details for your style guide
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold">Generate your guide</h3>
                <p className="text-center text-muted-foreground">
                  Generate your full writing style guide and export with just a click
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <div key="testimonials-stable">
          <TestimonialsSection />
        </div>

        {/* Example Output Preview - Redesigned with annotations - BACKGROUND CHANGED TO WHITE FOR ALTERNATION */}
        <section id="example" className="w-full py-6 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Brand voice traits in action
                </h2>
                <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mb-4">
                  Click through different traits to see definitions, do's, don'ts, and before/after examples
                </p>
              </div>
            </div>

            {/* Trait Selector with Example Card */}
            <div className="mx-auto max-w-4xl py-10">
              {/* Trait Tabs */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {(["Direct", "Refined", "Witty", "Warm"] as TraitName[]).map((trait) => {
                  const isSelected = selectedTrait === trait
                  return (
                    <button
                      key={trait}
                      onClick={() => {
                        setSelectedTrait(trait)
                        setTraitCyclePaused(true) // Pause auto-cycle when user clicks
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {trait}
                    </button>
                  )
                })}
              </div>

              {/* Trait Card */}
              <div key={selectedTrait} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <PenTool className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">The "{selectedTrait}" trait</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Here's how one trait translates into actionable writing guidance:
                  </p>
                  
                  <div className="space-y-6">
                    {/* Definition */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Definition</p>
                      <p className="text-sm text-gray-700">
                        {TRAITS[selectedTrait].definition}
                      </p>
                    </div>

                    {/* Do's and Don'ts */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                        <p className="text-sm font-medium mb-2 text-green-900">Do</p>
                        <ul className="text-sm text-green-800 space-y-2">
                          {TRAITS[selectedTrait].do.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
                        <p className="text-sm font-medium mb-2 text-red-900">Don't</p>
                        <ul className="text-sm text-red-800 space-y-2">
                          {TRAITS[selectedTrait].dont.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Before/After Example */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">Before → After</p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-medium">Before:</span>
                          <p className="text-sm text-gray-700 flex-1">
                            "{TRAITS[selectedTrait].example.before}"
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-medium">After:</span>
                          <p className="text-sm text-gray-700 flex-1">
                            "{TRAITS[selectedTrait].example.after}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - BACKGROUND CHANGED TO MUTED FOR ALTERNATION */}
        <section id="pricing" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Pay once, use forever</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  No subscriptions or hidden fees
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-background"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-blue-700">Core Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-blue-700">$99</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Brand voice guidelines</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>25 supporting rules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Before/After examples</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Do's and don'ts</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Multiple export formats</span>
                      </li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-8 py-3 shadow-md" onClick={() => {
                      track('Pricing Card Clicked', {
                        guideType: 'core',
                        price: 99,
                        location: 'homepage'
                      });
                      router.push("/brand-details");
                    }}>Get Core Guide</Button>
                    
                    {/* Add guarantee */}
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600 mt-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">Best for startups & small teams</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-4 border-indigo-600 shadow-lg scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-background"></div>
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">Most Popular</div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-indigo-700">Complete Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-indigo-700">$149</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <ul className="text-left space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />Everything in Core Guide</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />99+ supporting rules</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />Best practices guidelines</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />Before/After examples</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />Dos and don'ts</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" />Multiple download formats</li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-8 py-3 shadow-md" onClick={() => {
                      track('Pricing Card Clicked', {
                        guideType: 'complete',
                        price: 149,
                        location: 'homepage'
                      })
                      router.push("/brand-details?guideType=complete");
                    }}>Get Complete Guide</Button>
                    
                    {/* Add guarantee */}
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600 mt-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">Best for agencies & large teams</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 border-black">
                <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900"></div>
                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">Enterprise</div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-white">Custom Enterprise</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-white">Contact</p>
                      <p className="text-sm text-gray-200">Custom pricing</p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Everything in Complete</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Custom onboarding</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Dedicated account manager</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Team training sessions</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Custom integrations</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Priority support</span>
                      </li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-white hover:bg-gray-200 text-black font-bold rounded-full px-8 py-3 shadow-md" variant="outline" asChild>
                      <Link 
                        href="mailto:enterprise@styleguideai.com"
                        onClick={() => track('Contact Sales Clicked', { plan: 'enterprise', location: 'pricing' })}
                      >
                        Contact Sales
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who It's For - Redesigned and moved below pricing */}
        <section className="w-full py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Who uses our style guides</h2>
              <p className="text-base text-gray-500">For teams and creators who care about consistency.</p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <PenTool className="h-10 w-10 text-blue-500 mb-2" />
                <h3 className="text-lg font-bold">Copywriters</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Users className="h-10 w-10 text-indigo-600 mb-2" />
                <h3 className="text-lg font-bold">Marketing</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Rocket className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="text-lg font-bold">Founders</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Briefcase className="h-10 w-10 text-gray-700 mb-2" />
                <h3 className="text-lg font-bold">Agencies</h3>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - BACKGROUND CHANGED TO MUTED FOR ALTERNATION */}
        <section id="faq" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Got questions?</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We've got answers
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl divide-y py-8">
              {[
                {
                  q: "What if I don't have a brand yet?",
                  a: "Our tool helps you define your brand voice from scratch. Just answer a few questions about your audience and goals.",
                },
                {
                  q: "How long does it take?",
                  a: "Most style guides are generated in under 2 minutes. You can review, download in multiple formats, and share with your team.",
                },
                {
                  q: "What formats can I download?",
                  a: "Your style guide is available in PDF, Word, HTML, and Markdown formats for easy sharing and integration with any workflow.",
                },
                {
                  q: "What's included in the style guide?",
                  a: "You'll get a brand voice definition, up to 99+ writing rules, tone guidelines, and practical examples tailored to your brand.",
                },
                {
                  q: "Can I edit my style guide?",
                  a: "Absolutely. Once generated, you can download Word, HTML, or Markdown, then edit however you like before saving or sharing.",
                },
                {
                  q: "Is this better than hiring a copywriter?",
                  a: "We deliver 90% of what most brands need in minutes instead of weeks, at a fraction of the cost of hiring a professional writer.",
                },
                {
                  q: "Can I share with my team?",
                  a: "Yes! Share your style guide with your entire team. You receive a permanent access link plus downloadable files.",
                },
                {
                  q: "How do I contact support?",
                  a: <span>Email us at <a href="mailto:support@aistyleguide.com?subject=Support%20Request&body=Hello%20AIStyleGuide%20Support%20Team,%0A%0AI%20need%20help%20with:%0A%0A[Please%20describe%20your%20issue%20here]%0A%0AThanks,%0A[Your%20Name]" className="text-primary hover:underline">support@aistyleguide.com</a> for any questions. We typically respond within 24 hours on business days.</span>,
                },
                {
                  q: "How do I get a refund?",
                  a: <span>We offer a 30-day money-back guarantee. Simply email <a href="mailto:support@aistyleguide.com?subject=Refund%20Request%20-%20Style%20Guide%20Purchase&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20would%20like%20to%20request%20a%20refund%20for%20my%20style%20guide%20purchase.%0A%0APurchase%20Details:%0A- Guide%20Type:%20[Core%20or%20Complete]%0A- Purchase%20Date:%20[Date]%0A- Email%20used%20for%20purchase:%20[Email]%0A%0AReason%20for%20refund%20(optional):%20%0A%0AThanks,%0A[Your%20Name]" className="text-primary hover:underline">support@aistyleguide.com</a> within 30 days of your purchase for a full refund. No questions asked - we process refunds quickly, usually within 1-2 business days.</span>,
                },
              ].map((item, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <p className="mt-2 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-12 md:py-20 lg:py-24 bg-background text-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Build brand consistency in minutes
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                No more guesswork. Just consistent content at every single touchpoint.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gap-1"
                  onClick={() => {
                    // Scroll to hero section
                    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Create your style guide <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 md:py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="mb-2">
                <div className="logo-light">
                  <Logo size="lg" linkToHome={false} />
                </div>
              </div>
              <p className="text-sm text-primary-foreground/80">
                Create professional brand voice and style guides in minutes, not months.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Pages</h3>
              <ul className="space-y-2">
                <li><Link href="#how-it-works" className="text-sm hover:underline">How It Works</Link></li>
                <li><Link href="#features" className="text-sm hover:underline">Features</Link></li>
                <li><Link href="#pricing" className="text-sm hover:underline">Pricing</Link></li>
                <li><Link href="#faq" className="text-sm hover:underline">FAQ</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@aistyleguide.com" className="text-sm hover:underline">support@aistyleguide.com</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:underline">Terms of Service</Link></li>
                <li><Link href="#" className="text-sm hover:underline">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-primary-foreground/80">
              © {new Date().getFullYear()} AIStyleGuide. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Custom styles for the footer logo
const logoStyles = `
  .logo-light span {
    color: white !important; 
  }
`



