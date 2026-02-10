"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { validateInput, sanitizeInput, detectInputType } from "@/lib/input-utils"

// Progressive loading word arrays (stable refs for effect deps)
const DESCRIPTION_WORDS = ["Thinking...", "Exploring...", "Assembling...", "Creating..."]
const URL_WORDS = ["Reading...", "Understanding...", "Assembling...", "Creating..."]

/** Classify API/network errors for user-friendly messages. */
function classifyError(
  error: unknown,
  response?: Response
): { type: string; message: string } {
  let errorMessage = "Unknown error"

  if (error) {
    const err = error as Record<string, unknown>
    if (typeof error === "string") {
      errorMessage = error
    } else if (err.message) {
      errorMessage = String(err.message)
    } else if (err.error) {
      errorMessage = String(err.error)
    } else if (
      typeof error === "object" &&
      Object.keys(err).length === 0
    ) {
      errorMessage = "Empty error response"
    } else if (
      typeof (error as { toString?: () => string }).toString === "function" &&
      (error as { toString: () => string }).toString() !== "[object Object]"
    ) {
      errorMessage = (error as { toString: () => string }).toString()
    } else {
      errorMessage = "An unexpected error occurred"
    }
  }

  try {
    console.error(`[HOMEPAGE] Error classification:`, {
      errorMessage,
      errorName: (error as { name?: string })?.name,
      errorType: typeof error,
      errorKeys:
        error && typeof error === "object" ? Object.keys(error as object) : [],
      responseStatus: response?.status,
      responseStatusText: response?.statusText,
      timestamp: new Date().toISOString(),
    })
  } catch (logError) {
    console.error(`[HOMEPAGE] Error in error classification:`, logError)
  }

  const err = error as { name?: string }
  if (err?.name === "AbortError" || String(errorMessage).includes("timeout")) {
    return {
      type: "TIMEOUT",
      message: "Site didn't respond. Try again or add details manually.",
    }
  }

  if (
    String(errorMessage).includes("ECONNRESET") ||
    String(errorMessage).includes("connection reset")
  ) {
    return {
      type: "CONNECTION_RESET",
      message: "Connection was interrupted. Try again or add details manually.",
    }
  }

  if (
    String(errorMessage).includes("fetch") ||
    String(errorMessage).includes("network") ||
    String(errorMessage).includes("Failed to fetch")
  ) {
    return {
      type: "NETWORK",
      message: "Can't reach this site. Try again later.",
    }
  }

  if (
    String(errorMessage).includes("SSL") ||
    String(errorMessage).includes("certificate") ||
    String(errorMessage).includes("CERT")
  ) {
    return {
      type: "SSL",
      message: "Site has security issues. Add brand details manually.",
    }
  }

  if (response?.status === 429) {
    return {
      type: "RATE_LIMIT",
      message: "AI is overloaded. Try again in a few minutes.",
    }
  }

  if (
    response?.status === 402 ||
    String(errorMessage).includes("quota") ||
    String(errorMessage).includes("billing")
  ) {
    return {
      type: "QUOTA_EXCEEDED",
      message: "AI unavailable. Try again later.",
    }
  }

  if (
    String(errorMessage).includes("content policy") ||
    String(errorMessage).includes("safety") ||
    String(errorMessage).includes("inappropriate")
  ) {
    return {
      type: "CONTENT_POLICY",
      message: "Couldnt analyze content. Add brand details manually.",
    }
  }

  if (
    String(errorMessage).includes("javascript") ||
    String(errorMessage).includes("dynamic content")
  ) {
    return {
      type: "JAVASCRIPT_SITE",
      message: "Site uses dynamic content. Add brand details manually.",
    }
  }

  if (
    String(errorMessage).includes("login") ||
    String(errorMessage).includes("authentication") ||
    String(errorMessage).includes("password")
  ) {
    return {
      type: "LOGIN_REQUIRED",
      message: "Login required. Add brand details manually.",
    }
  }

  if (
    String(errorMessage).includes("no content") ||
    String(errorMessage).includes("empty") ||
    String(errorMessage).includes("insufficient content")
  ) {
    return {
      type: "NO_CONTENT",
      message: "Not enough content. Add brand details manually.",
    }
  }

  if (
    String(errorMessage).includes("Invalid URL") ||
    String(errorMessage).includes("malformed")
  ) {
    return {
      type: "MALFORMED_URL",
      message: "Check URL format.",
    }
  }

  if (
    String(errorMessage).includes("Description too short") ||
    String(errorMessage).includes("at least 5 words")
  ) {
    return {
      type: "DESCRIPTION_TOO_SHORT",
      message: "Please enter at least 5 words to describe your brand",
    }
  }

  if (
    String(errorMessage).includes("Description is too long") ||
    String(errorMessage).includes("under 200 characters")
  ) {
    return {
      type: "DESCRIPTION_TOO_LONG",
      message: "Description is too long. Please keep it under 200 characters",
    }
  }

  if (
    String(errorMessage).includes("unsupported") ||
    String(errorMessage).includes("blocked")
  ) {
    return {
      type: "UNSUPPORTED_DOMAIN",
      message: "Can't access this site type. Add brand details manually.",
    }
  }

  if (
    String(errorMessage).includes("test domain") ||
    String(errorMessage).includes("example domain")
  ) {
    return {
      type: "TEST_DOMAIN",
      message: "This is a test domain. Enter a real site.",
    }
  }

  if (errorMessage === "Empty error response") {
    return {
      type: "EMPTY_RESPONSE",
      message: "Can't analyze this site. Try again or add details manually.",
    }
  }

  return {
    type: "UNKNOWN",
    message: "Problem analyzing site. Try again or add details manually.",
  }
}

export interface UseExtractionReturn {
  url: string
  setUrl: (value: string | ((prev: string) => string)) => void
  error: string
  clearError: () => void
  isExtracting: boolean
  isSuccess: boolean
  loadingMessage: string
  inputAnimating: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  handleExtraction: (e: React.FormEvent) => Promise<void>
  isInputValid: () => boolean
  sanitizeInput: (value: string, currentValue: string) => string
  detectInputType: typeof detectInputType
  getEffectiveInput: (raw: string) => string
  // TODO: errorType is set but unused in UI - reserved for future error-specific styling
}

export function useExtraction(): UseExtractionReturn {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [, setErrorType] = useState<string | null>(null) // TODO: errorType is set but unused in UI
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [extractionStartTime, setExtractionStartTime] = useState<number | null>(
    null
  )
  const [inputAnimating, setInputAnimating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle "Get Started" button click - animate and focus input
  useEffect(() => {
    const animateAndFocusInput = () => {
      if (inputRef.current) {
        const heroElement = document.getElementById("hero")
        const isAtHero =
          heroElement &&
          window.scrollY < heroElement.offsetTop + heroElement.offsetHeight

        if (isAtHero) {
          setInputAnimating(true)
          inputRef.current.focus()
          setTimeout(() => setInputAnimating(false), 2000)
        } else {
          setTimeout(() => {
            setInputAnimating(true)
            inputRef.current?.focus()
            setTimeout(() => setInputAnimating(false), 2000)
          }, 500)
        }
      }
    }

    const handleHashChange = () => {
      if (window.location.hash === "#hero") {
        animateAndFocusInput()
      }
    }

    if (window.location.hash === "#hero") {
      animateAndFocusInput()
    }

    window.addEventListener("hashchange", handleHashChange)
    const handleGetStartedClick = () => animateAndFocusInput()
    window.addEventListener("get-started-clicked", handleGetStartedClick)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("get-started-clicked", handleGetStartedClick)
    }
  }, [])

  // Cycle through loading messages during extraction
  useEffect(() => {
    if (!isExtracting || !extractionStartTime) return

    const isUrl = url.trim().startsWith("http") || url.trim().includes(".")
    const words = isUrl ? URL_WORDS : DESCRIPTION_WORDS

    const interval = setInterval(() => {
      const elapsed = Date.now() - extractionStartTime
      const wordIndex = Math.floor(elapsed / 2000) % words.length
      setLoadingMessage(words[wordIndex])
    }, 200)

    return () => clearInterval(interval)
  }, [isExtracting, extractionStartTime, url])

  const getEffectiveInput = (raw: string) => {
    const trimmed = raw.trim()
    const detection = detectInputType(trimmed)
    if (
      detection.inputType === "description" &&
      trimmed.length > 200
    ) {
      return trimmed.slice(0, 200)
    }
    return trimmed
  }

  const isInputValid = () => {
    const effective = getEffectiveInput(url)
    if (!effective) return false
    const validation = validateInput(effective)
    return validation.isValid
  }

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

    const effective = getEffectiveInput(url)
    const validation = handleInputValidation(effective)
    if (!validation) return

    console.log(`[HOMEPAGE] Input validation passed:`, {
      inputType: validation.inputType,
      cleanInput: validation.cleanInput.substring(0, 100) + "...",
      originalLength: url.length,
      cleanLength: validation.cleanInput.length,
    })

    if (validation.inputType === "empty") {
      console.log(`[USER_JOURNEY] Empty input - redirecting to manual entry`)
      router.push("/brand-details")
      return
    }

    setIsExtracting(true)
    const startTime = Date.now()
    setExtractionStartTime(startTime)

    const isUrl = validation.inputType === "url"
    const words = isUrl ? URL_WORDS : DESCRIPTION_WORDS
    setLoadingMessage(words[0])

    console.log(
      `[HOMEPAGE] Starting ${validation.inputType} extraction for: ${validation.cleanInput.substring(0, 50)}...`
    )

    try {
      let response
      const apiStartTime = performance.now()

      if (validation.inputType === "url") {
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
        data = { success: false, error: "Invalid response format" }
      }

      console.log(`[HOMEPAGE] API response received:`, {
        success: data?.success,
        hasName: !!data?.brandName,
        hasDescription: !!data?.brandDetailsDescription,
        status: response.status,
        responseTime: apiTime,
        dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
      })

      if (data.success) {
        const brandDetails = {
          name: data.brandName || "",
          brandDetailsDescription: data.brandDetailsDescription,
          audience: data.audience || "",
        }
        if (data.keywords) {
          const kw = Array.isArray(data.keywords)
            ? data.keywords.join("\n")
            : String(data.keywords)
          localStorage.setItem("brandKeywords", kw)
        }
        if (data.suggestedTraits) {
          localStorage.setItem(
            "suggestedTraits",
            JSON.stringify(data.suggestedTraits)
          )
        }
        localStorage.setItem("brandDetails", JSON.stringify(brandDetails))
        console.log(`[USER_JOURNEY] Brand details saved to localStorage:`, {
          hasName: !!brandDetails.name,
          descriptionLength: brandDetails.brandDetailsDescription?.length || 0,
        })

        setIsSuccess(true)
        setIsExtracting(false)
        setLoadingMessage("")
        setExtractionStartTime(null)

        const totalTime = performance.now() - extractionStart
        console.log(
          `[PERFORMANCE] Total extraction completed in ${totalTime.toFixed(2)}ms`
        )
        console.log(
          `[USER_JOURNEY] Extraction successful - redirecting to brand-details`
        )

        setTimeout(() => {
          router.push("/brand-details?fromExtraction=true")
        }, 800)
      } else {
        const { type, message } = classifyError(data || {}, response)
        setError(message)
        setErrorType(type)

        console.error(`[HOMEPAGE] API returned error:`, {
          errorType: type,
          message: data?.message || "No error message",
          originalError: data?.error || "No original error",
          status: response?.status || "No status",
          dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
        })

        setIsExtracting(false)
        setIsSuccess(false)
        setLoadingMessage("")
        setExtractionStartTime(null)

        console.log(`[USER_JOURNEY] Error occurred - staying on homepage for retry`)
      }
    } catch (err) {
      const totalTime = performance.now() - extractionStart
      const { type, message } = classifyError(err)

      console.error(`[HOMEPAGE] Extraction failed after ${totalTime.toFixed(2)}ms:`, {
        errorType: type,
        originalError: err,
        inputType: validation?.inputType,
        url: validation?.cleanInput?.substring(0, 100),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "server",
        timestamp: new Date().toISOString(),
      })

      setError(message)
      setErrorType(type)

      setIsExtracting(false)
      setIsSuccess(false)
      setLoadingMessage("")
      setExtractionStartTime(null)

      console.log(
        `[USER_JOURNEY] Exception occurred - staying on homepage for retry`
      )
    }
  }

  const clearError = () => {
    setError("")
    setErrorType(null)
  }

  return {
    url,
    setUrl,
    error,
    clearError,
    isExtracting,
    isSuccess,
    loadingMessage,
    inputAnimating,
    inputRef,
    handleExtraction,
    isInputValid,
    sanitizeInput,
    detectInputType,
    getEffectiveInput,
  }
}
