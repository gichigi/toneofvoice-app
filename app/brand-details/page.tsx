"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import VoiceTraitSelector from "@/components/VoiceTraitSelector"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"
import { useAuth } from "@/components/AuthProvider"
import { UpgradeNudgeModal } from "@/components/dashboard/UpgradeNudgeModal"

// Default brand details
const defaultBrandDetails = {
  name: "",
  brandDetailsDescription: "",
  audience: "",
  englishVariant: "american" as "american" | "british",
  formalityLevel: "Neutral", // Default to neutral
  readingLevel: "6-8" as "6-8" | "10-12" | "13+", // Default to general public (6-8=General Public, 10-12=Professional, 13+=Technical/Academic)
}

// Token counting function for description validation
const estimateTokens = (text: string): number => {
  if (!text.trim()) return 0

  // Simple tokenization: split by whitespace and count words + punctuation
  const words = text.trim().split(/\s+/).filter(Boolean)
  const punctuation = (text.match(/[.!?,:;()"-]/g) || []).length

  // Estimate tokens: words + partial tokens for punctuation
  return words.length + Math.ceil(punctuation * 0.5)
}

// Description limit: fits 3-6 paragraphs from extraction (no truncation)
const DESC_MAX_CHARS = 2500

// Capitalize first letter of string
const capitalizeFirstLetter = (str: string): string => {
  if (!str || str.length === 0) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}





// Format auto-populated descriptions with paragraph breaks between sentences
function formatAutoPopulatedDescription(description: string): string {
  if (!description || description.length < 20) {
    return description
  }
  
  // Split by sentence endings (., !, ?) but keep the punctuation
  const sentences = description.split(/(?<=[.!?])\s+/)
  
  // Join with double line breaks to create paragraphs
  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .join('\n\n')
}

export default function BrandDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [atLimit, setAtLimit] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState<'idle' | 'processing' | 'complete'>('idle')
  const [loadingMessage, setLoadingMessage] = useState("")
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const fromExtraction = searchParams.get("fromExtraction") === "true"
  const urlAudience = searchParams.get("audience") || ""
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [suggestedTraits, setSuggestedTraits] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [showCharCount, setShowCharCount] = useState(false)
  const keywordInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [email, setEmail] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [showEmailCapture, setShowEmailCapture] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepTransitioning, setStepTransitioning] = useState(false)
  const stepRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)
  const minSwipeDistance = 50 // Minimum distance for swipe

  // Initialize state with default values to ensure inputs are always controlled
  const [brandDetails, setBrandDetails] = useState({ ...defaultBrandDetails })
  const [keywordInput, setKeywordInput] = useState<string>("")
  const [keywordTags, setKeywordTags] = useState<string[]>([])
  const KEYWORD_LIMIT = 15

  // Progressive loading words for brand details generation
  const loadingWords = ["Defining...", "Drafting...", "Crafting...", "Editing...", "Refining..."]

  // When authed, check if user is at guide limit (for upgrade nudge on Generate)
  useEffect(() => {
    if (!user) {
      setAtLimit(false)
      return
    }
    let cancelled = false
    fetch("/api/user-guide-limit", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.atLimit) setAtLimit(true)
        if (!cancelled && data && !data.atLimit) setAtLimit(false)
      })
      .catch(() => {
        if (!cancelled) setAtLimit(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Trigger fade-in animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Generate session token on component mount
  useEffect(() => {
    if (!sessionToken) {
      const token = crypto.randomUUID()
      setSessionToken(token)
      localStorage.setItem("emailCaptureToken", token)
    }
  }, [])

  // Progressive loading message cycling with isMounted check
  useEffect(() => {
    if (!loading || !generationStartTime) return
    
    let isMounted = true
    const interval = setInterval(() => {
      if (!isMounted) return
      const elapsed = Date.now() - generationStartTime
      const wordIndex = Math.floor(elapsed / 2000) % loadingWords.length // Change word every 2 seconds
      setLoadingMessage(loadingWords[wordIndex])
    }, 200) // Update every 200ms for smooth transitions
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [loading, generationStartTime, loadingWords])


  // Show toast if brand details were filled from extraction
  useEffect(() => {
    if (fromExtraction) {
      toast({
        title: "Brand details filled",
        description: "We filled the brand details from the website.",
        duration: 3500,
      })
    }
  }, [fromExtraction, toast])

  // Auto-resize textarea when content changes or on load
  useEffect(() => {
    const textarea = document.getElementById('brandDetailsDescription') as HTMLTextAreaElement
    if (textarea) {
      setTimeout(() => {
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
      }, 100)
    }
  }, [brandDetails.brandDetailsDescription])

  // Load saved brand details and email from localStorage
  useEffect(() => {
    const savedDetails = localStorage.getItem("brandDetails")
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails)
        
        // Convert old numeric formalityLevel to string if needed
        let formalityLevelValue = parsedDetails.formalityLevel
        if (typeof formalityLevelValue === 'number') {
          const formalityLabels = ["Very Casual", "Casual", "Neutral", "Formal", "Very Formal"]
          formalityLevelValue = formalityLabels[formalityLevelValue] || "Neutral"
        }
        
        // Format auto-populated descriptions with paragraph breaks (only for extracted content)
        let formattedBrandDetailsDescription = parsedDetails.brandDetailsDescription
        if (fromExtraction && formattedBrandDetailsDescription && formattedBrandDetailsDescription.length > 20) {
          formattedBrandDetailsDescription = formatAutoPopulatedDescription(formattedBrandDetailsDescription)
        }
        
        // Ensure all required fields have values by merging with defaults
        const updatedDetails = {
          ...defaultBrandDetails,
          ...parsedDetails,
          brandDetailsDescription: formattedBrandDetailsDescription || parsedDetails.brandDetailsDescription,
          englishVariant: parsedDetails.englishVariant || "american",
          formalityLevel: formalityLevelValue || "Neutral",
          readingLevel: parsedDetails.readingLevel || "6-8",
          audience: urlAudience || parsedDetails.audience || ""
        }

        setBrandDetails(updatedDetails)
        // Load saved keywords if present
        try {
          const savedKeywords = localStorage.getItem("brandKeywords")
          if (savedKeywords) {
            const parsed = savedKeywords
              .split(/\r?\n|,/) // support newlines or commas
              .map(k => k.trim())
              .filter(Boolean)
              .filter(k => {
                const validation = validateKeyword(k)
                return validation.isValid
              })
              .slice(0, KEYWORD_LIMIT) // Ensure we don't exceed limit
            setKeywordTags(parsed)
          }
        } catch (error) {
          console.error("Error loading saved keywords:", error)
          // Clear corrupted data
          try {
            localStorage.removeItem("brandKeywords")
          } catch {}
        }

        // Load suggested traits if present (from extraction)
        const savedSuggestedTraits = localStorage.getItem("suggestedTraits")
        if (savedSuggestedTraits) {
          try {
            const parsed = JSON.parse(savedSuggestedTraits)
            setSuggestedTraits(Array.isArray(parsed) ? parsed : [])
          } catch (e) {
            console.error("Error parsing suggested traits:", e)
          }
        }

        // Update localStorage with the validated details
        localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
      } catch (e) {
        console.error("Error parsing saved brand details:", e)
        // If there's an error parsing, ensure we save the default details
        localStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
        setBrandDetails(defaultBrandDetails)
      }
    } else {
      // If no saved details, initialize localStorage with default values
      localStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
      setBrandDetails(defaultBrandDetails)
    }

    // Load saved email
    const savedEmail = localStorage.getItem("emailCapture")
    if (savedEmail) {
      try {
        const parsedEmail = JSON.parse(savedEmail)
        setEmail(parsedEmail.email || "")
      } catch (e) {
        console.error("Error parsing saved email:", e)
      }
    }
  }, [])

  // Persist keywords to localStorage when tags change
  // Also clear cached preview content when keywords change (to force regeneration)
  useEffect(() => {
    try {
      localStorage.setItem("brandKeywords", keywordTags.join("\n"))
      // Clear cached preview content when keywords change to ensure fresh generation
      localStorage.removeItem("previewContent")
      localStorage.removeItem("generatedPreviewTraits")
      localStorage.removeItem("previewTraitsTimestamp")
    } catch {}
  }, [keywordTags])

  const addKeyword = () => {
    let term = keywordInput.trim()
    if (!term) return

    // Capitalize first letter
    term = capitalizeFirstLetter(term)

    // Clear previous error
    setKeywordError("")

    // Validate keyword
    const validation = validateKeyword(term)
    if (!validation.isValid) {
      setKeywordError(validation.error || "Invalid format")
      return
    }

    if (keywordTags.includes(term)) {
      setKeywordError("Already added")
      setKeywordInput("")
      return
    }

    if (keywordTags.length >= KEYWORD_LIMIT) {
      setKeywordError(`Max ${KEYWORD_LIMIT} keywords`)
      return
    }

    setKeywordTags(prev => [...prev, term])
    setKeywordInput("")
  }

  const removeKeyword = (term: string) => {
    setKeywordTags(prev => prev.filter(t => t !== term))
  }

  const addKeywordsBulk = (terms: string[]) => {
    setKeywordError("") // Clear previous error

    const validTerms = terms
      .map(t => capitalizeFirstLetter(t.trim()))
      .filter(Boolean)
      .filter(t => !keywordTags.includes(t))
      .filter(t => {
        const validation = validateKeyword(t)
        return validation.isValid
      })
    
    if (validTerms.length === 0) return
    
    const available = Math.max(0, KEYWORD_LIMIT - keywordTags.length)
    if (available === 0) {
      setKeywordError(`Max ${KEYWORD_LIMIT} keywords`)
      return
    }
    
    const toAdd = validTerms.slice(0, available)
    setKeywordTags(prev => [...prev, ...toAdd])
    
    // Show info if some terms were filtered out
    const filtered = terms.length - toAdd.length
    if (filtered > 0) {
      setKeywordError(`Added ${toAdd.length}. ${filtered} filtered (invalid or duplicate).`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Only handle name field (description is handled inline)
    if (name === "name") {
      // Brand name: max 50 chars, no special chars
      const validatedValue = value.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 50)
      validateNameField(validatedValue)
      
      setBrandDetails((prev) => {
        const updatedDetails = { ...prev, [name]: validatedValue }
        // Save to localStorage
        localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
        return updatedDetails
      })

      // Clear form error when user starts typing
      if (formError) {
        setFormError("")
      }
    }
  }

  // Validate both name and description fields
  const [formError, setFormError] = useState("")
  const [keywordError, setKeywordError] = useState("")

  // Combined validation for step 1 fields
  const validateStep1Fields = () => {
    const name = brandDetails.name?.trim() || ""
    const desc = brandDetails.brandDetailsDescription?.trim() || ""

    if (!name) {
      setFormError("Brand name is required.")
      return false
    }

    if (name.length > 50) {
      setFormError("Brand name is too long (max 50 characters).")
      return false
    }

    if (!desc) {
      setFormError("Description is required.")
      return false
    }

    if (desc.length < 20) {
      setFormError("Description must be at least 20 characters.")
      return false
    }

    if (desc.length > DESC_MAX_CHARS) {
      setFormError(`Description is too long (max ${DESC_MAX_CHARS} characters).`)
      return false
    }

    setFormError("")
    return true
  }

  const validateMainField = (value: string) => {
    // Just validate description, combined validation happens on submit/blur
    const trimmed = value.trim()
    if (!trimmed) {
      return false
    } else if (trimmed.length < 20) {
      return false
    } else if (value.length > DESC_MAX_CHARS) {
      return false
    }
    return true
  }

  const validateNameField = (value: string) => {
    // Just validate name, combined validation happens on submit/blur
    if (!value.trim()) {
      return false
    } else if (value.length > 50) {
      return false
    }
    return true
  }

  // Validate individual keyword
  const validateKeyword = (keyword: string): { isValid: boolean; error?: string } => {
    const trimmed = keyword.trim()
    
    if (trimmed.length < 2) {
      return { isValid: false, error: "At least 2 characters" }
    }
    
    if (trimmed.length > 20) {
      return { isValid: false, error: "Max 20 characters" }
    }
    
    // Only allow alphanumeric, spaces, hyphens
    const validPattern = /^[a-zA-Z0-9\s\-]+$/
    if (!validPattern.test(trimmed)) {
      return { isValid: false, error: "Letters, numbers, spaces, and hyphens only" }
    }
    
    return { isValid: true }
  }


  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
  };

  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim();
    
    // Save email capture data to localStorage (for immediate UI)
    if (trimmedEmail && sessionToken) {
      const emailCaptureData = {
        sessionToken,
        email: trimmedEmail,
        capturedAt: Date.now(),
        brandDetails,
        paymentCompleted: false,
        emailsSent: []
      };
      localStorage.setItem("emailCapture", JSON.stringify(emailCaptureData));
      
      // Also save to server-side for abandoned cart tracking
      try {
        if (process.env.NODE_ENV !== "production") {
          console.log('[Email Capture Client] Starting server-side storage...', {
            sessionToken: sessionToken?.substring(0, 8) + '***',
            email: trimmedEmail.substring(0, 3) + '***',
            timestamp: new Date().toISOString()
          });
        }
        
        const response = await fetch('/api/capture-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken,
            email: trimmedEmail
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (process.env.NODE_ENV !== "production") {
            console.log('[Email Capture Client] Successfully stored server-side:', {
              success: result.success,
              captureId: result.captureId,
              duration: result.duration
            });
          }
        } else {
          const errorText = await response.text();
          if (process.env.NODE_ENV !== "production") {
            console.error('[Email Capture Client] Failed to store server-side:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error('[Email Capture Client] Network error storing server-side:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
    } else if (!trimmedEmail) {
      localStorage.removeItem("emailCapture");
      // Note: We don't delete from server-side as we want to track all attempts
    }
  };


  // Step validation functions
  const isStep1Valid = () => {
    const nameValid = !!brandDetails.name?.trim() && brandDetails.name.trim().length > 0
    const descValid = !!brandDetails.brandDetailsDescription?.trim() && brandDetails.brandDetailsDescription.trim().length >= 20 && brandDetails.brandDetailsDescription.length <= DESC_MAX_CHARS
    return nameValid && descValid
  }

  const isStep2Valid = () => {
    return selectedTraits.length === 3
  }

  // Check if core form is ready (without email)
  const isCoreFormReady = () => {
    return (
      !!brandDetails.name?.trim() && 
      !!brandDetails.brandDetailsDescription?.trim() && 
      selectedTraits.length === 3
    )
  }

  // Navigate to next step with smooth scroll
  const goToNextStep = () => {
    if (stepTransitioning) return
    
    if (currentStep === 1 && isStep1Valid()) {
      scrollToStep(2)
    }
  }

  // Navigate to previous step with smooth scroll
  const goToPreviousStep = () => {
    if (stepTransitioning || currentStep === 1) return
    scrollToStep(currentStep - 1)
  }

  // Typeform-style smooth slide transition (cards slide up/down)
  const scrollToStep = (stepNumber: number) => {
    if (stepTransitioning) return
    setStepTransitioning(true)
    
    // Update step immediately for smooth transition
    setCurrentStep(stepNumber)
    
    // Scroll to top of page after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })
    
    // Reset transition flag after animation completes
    setTimeout(() => {
      setStepTransitioning(false)
    }, 500)
  }

  // Show email capture when on step 2
  useEffect(() => {
    if (currentStep === 2 && !showEmailCapture) {
      setShowEmailCapture(true)
    } else if (currentStep !== 2 && showEmailCapture) {
      setShowEmailCapture(false)
    }
  }, [currentStep, showEmailCapture])


  // Keyboard navigation for steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === 'ArrowLeft' && currentStep > 1 && !stepTransitioning) {
        e.preventDefault()
        goToPreviousStep()
      } else if (e.key === 'ArrowRight' && !stepTransitioning) {
        if (currentStep === 1 && isStep1Valid()) {
          e.preventDefault()
          goToNextStep()
        } else if (currentStep === 2 && isStep2Valid()) {
          e.preventDefault()
          goToNextStep()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, stepTransitioning, isStep1Valid, isStep2Valid, goToNextStep, goToPreviousStep])

  // Update isFormValid function - email is optional, no validation needed
  const isFormValid = () => {
    return isCoreFormReady()
  }

  // Handle the form submission
  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If form is valid, proceed with generation
    if (isFormValid()) {
      handleSubmit(e)
    }
  }

  // Redirect to guide page immediately; guide page handles API call and shows loading
  const handleSubmit = async (e: React.FormEvent) => {
    // Authed user at guide limit: show upgrade nudge instead of generating
    if (user && atLimit) {
      setUpgradeModalOpen(true)
      return
    }

    setLoading(true)
    setProcessingStep('processing')

    try {
      // Clear cached preview so guide page triggers fresh generation
      localStorage.removeItem("previewContent")
      localStorage.removeItem("generatedPreviewTraits")
      localStorage.removeItem("previewTraitsTimestamp")

      const brandName = brandDetails.name?.trim() || ""
      const detailsWithName = {
        ...brandDetails,
        name: brandName,
        audience: brandDetails.audience || "",
        keywords: keywordTags,
        traits: selectedTraits,
        englishVariant: brandDetails.englishVariant,
        formalityLevel: brandDetails.formalityLevel,
        readingLevel: brandDetails.readingLevel,
      }

      localStorage.setItem("brandDetails", JSON.stringify(detailsWithName))
      localStorage.setItem("selectedTraits", JSON.stringify(selectedTraits))

      setProcessingStep('complete')
      setLoadingMessage("")

      // Forward to guide page; it will call /api/preview and show loading
      router.push("/guide")
    } catch (error) {
      setLoading(false)
      setProcessingStep('idle')
      setLoadingMessage("")
      setGenerationStartTime(null)
      console.error("[Brand Details] Error preparing redirect:", error)
      toast({
        title: "Error",
        description: "Could not proceed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleVariantChange = (value: "american" | "british") => {
    setBrandDetails(prev => {
      const updated = { ...prev, englishVariant: value }
      localStorage.setItem("brandDetails", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://aistyleguide.com" },
        { name: "Brand Details", url: "https://aistyleguide.com/brand-details" }
      ]} />
      <Header />
      <main
        className={`flex-1 container transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 pt-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {/* Persistent Page Title */}
          <div className="mb-8 px-4" data-header-section>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand details</h1>
            <p className="text-base text-muted-foreground">Tell us about your brand to get started.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Steps Container - Fixed viewport, cards slide up/down */}
            <div 
              className="relative h-[calc(100vh-250px)] sm:h-[600px] overflow-visible"
              onTouchStart={(e) => {
                // Only track swipe if not interacting with input/textarea
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea')) {
                  return
                }
                touchStartY.current = e.touches[0].clientY
              }}
              onTouchMove={(e) => {
                // Only track swipe if not interacting with input/textarea
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea')) {
                  return
                }
                touchEndY.current = e.touches[0].clientY
              }}
              onTouchEnd={(e) => {
                // Only handle swipe if not interacting with input/textarea
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea')) {
                  touchStartY.current = null
                  touchEndY.current = null
                  return
                }
                
                if (!touchStartY.current || !touchEndY.current || stepTransitioning) return
                
                const distance = touchStartY.current - touchEndY.current
                const isUpSwipe = distance > minSwipeDistance
                const isDownSwipe = distance < -minSwipeDistance
                
                if (isUpSwipe && currentStep === 1 && isStep1Valid()) {
                  // Swipe up - go to next step
                  e.preventDefault()
                  goToNextStep()
                } else if (isDownSwipe && currentStep === 2) {
                  // Swipe down - go to previous step
                  e.preventDefault()
                  goToPreviousStep()
                }
                
                touchStartY.current = null
                touchEndY.current = null
              }}
            >
              {/* Step 1: Brand information */}
              <Card
                ref={stepRefs[0]}
                className={`absolute inset-x-0 shadow-lg border-2 border-gray-200 bg-white transition-all duration-500 ease-in-out ${
                  currentStep === 1
                    ? "opacity-100 translate-y-0 scale-100 z-10"
                    : currentStep === 2
                    ? "opacity-0 translate-y-[-100%] scale-95 z-0"
                    : "opacity-0 translate-y-[-100%] scale-95 z-0"
                }`}
              >
              {/* Step Badge */}
              <div className="absolute -top-3 right-6 z-20 pointer-events-none">
                <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-md">
                  Step 1 of 2
                </span>
              </div>
              <CardContent className="space-y-6 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-base font-semibold">Brand Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Nike"
                    value={brandDetails.name || ""}
                    onChange={handleChange}
                    onBlur={() => {
                      // Capitalize first letter
                      const capitalized = capitalizeFirstLetter(brandDetails.name || "")
                      if (capitalized !== brandDetails.name) {
                        setBrandDetails(prev => ({ ...prev, name: capitalized }))
                      }
                      validateStep1Fields()
                    }}
                    className="text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    autoFocus={currentStep === 1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brandDetailsDescription" className="text-base font-semibold">Description</Label>
                  <p className="text-sm text-muted-foreground">Describe what your brand does.</p>
                  <Textarea
                    id="brandDetailsDescription"
                    name="brandDetailsDescription"
                    placeholder="Describe your brand in a few sentences. What do you do? Who do you serve?"
                    value={brandDetails.brandDetailsDescription || ""}
                    onChange={e => {
                      const value = e.target.value.slice(0, DESC_MAX_CHARS)
                      setBrandDetails(prev => {
                        const updatedDetails = { ...prev, brandDetailsDescription: value }
                        localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
                        return updatedDetails
                      })
                      validateMainField(value)
                      e.target.style.height = "auto"
                      e.target.style.height = e.target.scrollHeight + "px"
                      // Clear form error when user types
                      if (formError) {
                        setFormError("")
                      }
                    }}
                    rows={8}
                    className="resize-none min-h-[200px] leading-relaxed text-sm p-3 placeholder:text-gray-400"
                    onFocus={e => setShowCharCount(true)}
                    onBlur={e => {
                      setShowCharCount(!!e.target.value)
                      validateStep1Fields()
                    }}
                  />
                  {showCharCount && (
                    <div className={`text-xs mt-1 ${
                      (brandDetails.brandDetailsDescription?.length || 0) > DESC_MAX_CHARS
                        ? 'text-red-600'
                        : brandDetails.brandDetailsDescription && brandDetails.brandDetailsDescription.trim().length < 20
                        ? 'text-red-600'
                        : (brandDetails.brandDetailsDescription?.length || 0) > DESC_MAX_CHARS * 0.9
                        ? 'text-yellow-600'
                        : 'text-muted-foreground'
                    }`}>
                      {(brandDetails.brandDetailsDescription?.length || 0)}/{DESC_MAX_CHARS} characters
                      {brandDetails.brandDetailsDescription && brandDetails.brandDetailsDescription.trim().length < 20 && brandDetails.brandDetailsDescription.trim().length > 0 && (
                        <span className="ml-1">(min 20)</span>
                      )}
                    </div>
                  )}
                </div>
                {formError && currentStep === 1 && (
                  <div className="text-xs text-red-600 -mt-2">{formError}</div>
                )}
                {currentStep === 1 && (
                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep1Fields()) {
                          goToNextStep()
                        }
                      }}
                      disabled={!isStep1Valid()}
                      className="w-full sm:w-auto"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </CardContent>
              </Card>

              {/* Step 2: Brand Voice Traits */}
              <Card
                ref={stepRefs[1]}
                className={`absolute inset-x-0 shadow-lg border-2 border-gray-200 bg-white transition-all duration-500 ease-in-out ${
                  currentStep === 2
                    ? "opacity-100 translate-y-0 scale-100 z-10"
                    : currentStep === 1
                    ? "opacity-0 translate-y-[100%] scale-95 z-0"
                    : "opacity-0 translate-y-[100%] scale-95 z-0"
                }`}
              >
              {/* Step Badge */}
              <div className="absolute -top-3 right-6 z-20 pointer-events-none">
                <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-md">
                  Step 2 of 2
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Select 3 traits</CardTitle>
                <CardDescription>Pick 3 traits that define your brand's personality.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Voice Traits */}
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-4">
                  <VoiceTraitSelector 
                    onChange={setSelectedTraits} 
                    suggestedTraits={suggestedTraits}
                    showSuggestions={showSuggestions}
                    onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
                  />
                </div>

                {/* Advanced Options - Expandable Accordion */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <h3 className="text-sm font-medium text-gray-600">Advanced options</h3>
                    <svg 
                      className={`h-4 w-4 text-gray-400 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showAdvancedOptions && (
                    <div className="p-6 bg-blue-50 space-y-4">
                      {/* Style Preferences Settings */}
                      <div className="border border-blue-200 rounded-lg bg-white p-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Style preferences</h4>
                          <p className="text-xs text-muted-foreground mt-1">Set your language variant, formality and reading level</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="englishVariant" className="text-sm font-medium">Language</Label>
                            <Select
                              onValueChange={(val) => handleVariantChange(val as "american" | "british")}
                              value={brandDetails.englishVariant}
                            >
                              <SelectTrigger id="englishVariant" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="american">US English</SelectItem>
                                <SelectItem value="british">UK English</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="formalityLevel" className="text-sm font-medium">Formality</Label>
                            <Select
                              onValueChange={(val) => {
                                setBrandDetails(prev => {
                                  const updated = { ...prev, formalityLevel: val }
                                  localStorage.setItem("brandDetails", JSON.stringify(updated))
                                  return updated
                                })
                              }}
                              value={brandDetails.formalityLevel || "Neutral"}
                            >
                              <SelectTrigger id="formalityLevel" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Very Casual">Very Casual</SelectItem>
                                <SelectItem value="Casual">Casual</SelectItem>
                                <SelectItem value="Neutral">Neutral</SelectItem>
                                <SelectItem value="Formal">Formal</SelectItem>
                                <SelectItem value="Very Formal">Very Formal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="readingLevel" className="text-sm font-medium">Reading Level</Label>
                            <Select
                              onValueChange={(val) => {
                                setBrandDetails(prev => {
                                  const updated = { ...prev, readingLevel: val as "6-8" | "10-12" | "13+" }
                                  localStorage.setItem("brandDetails", JSON.stringify(updated))
                                  return updated
                                })
                              }}
                              value={brandDetails.readingLevel || "6-8"}
                            >
                              <SelectTrigger id="readingLevel" className="w-full [&>span]:text-left [&>span]:justify-start">
                                <SelectValue placeholder="Select reading level">
                                  {brandDetails.readingLevel === "6-8" && "General Public"}
                                  {brandDetails.readingLevel === "10-12" && "Professional"}
                                  {brandDetails.readingLevel === "13+" && "Technical/Academic"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6-8">1. General Public</SelectItem>
                                <SelectItem value="10-12">2. Professional</SelectItem>
                                <SelectItem value="13+">3. Technical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Keywords Section */}
                      <div className="border border-blue-200 rounded-lg bg-white p-4 space-y-3">
                        <div>
                          <Label htmlFor="keywordInput" className="text-sm font-semibold text-gray-900">Keywords</Label>
                          <p className="text-xs text-muted-foreground mt-1">Key terms we'll use in your style guide.</p>
                        </div>
                        <div
                          className="flex w-full overflow-y-auto rounded-md border bg-white px-3 py-2 flex-wrap items-start gap-1 content-start"
                          onClick={() => keywordInputRef.current?.focus()}
                        >
                          {keywordTags.map(term => (
                            <span key={term} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white text-gray-800 border border-blue-200 hover:bg-blue-100">
                              {term}
                              <button type="button" aria-label={`Remove ${term}`} onClick={() => removeKeyword(term)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                                ×
                              </button>
                            </span>
                          ))}
                          <textarea
                            ref={keywordInputRef}
                            aria-label="Add keyword"
                            placeholder="+ add"
                            value={keywordInput}
                            onChange={e => setKeywordInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
                              else if (e.key === 'Backspace' && keywordInput === '') { removeKeyword(keywordTags[keywordTags.length - 1]); }
                            }}
                            onPaste={e => {
                              const text = e.clipboardData.getData('text')
                              const parts = text.split(/\r?\n|,|\t/)
                              addKeywordsBulk(parts)
                              e.preventDefault()
                            }}
                            rows={1}
                            className="flex-1 min-w-[8rem] bg-transparent text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-muted-foreground resize-none whitespace-pre-wrap break-words"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">{keywordTags.length}/{KEYWORD_LIMIT} keywords</div>
                        {keywordError && (
                          <div className="text-xs text-red-600 mt-1">{keywordError}</div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerateClick}
                    disabled={loading || !!formError || !isFormValid()} 
                    className="w-full sm:w-auto"
                  >
                    {processingStep === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingMessage || "Processing..."}
                      </>
                    ) : processingStep === 'complete' ? (
                      <>
                        <svg className="mr-2 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </>
                    ) : !isStep2Valid() ? (
                      `Pick ${3 - selectedTraits.length} trait${3 - selectedTraits.length !== 1 ? 's' : ''}`
                    ) : (
                      "Generate Preview"
                    )}
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>
      <UpgradeNudgeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  )
}

