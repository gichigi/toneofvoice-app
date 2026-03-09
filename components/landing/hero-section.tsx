"use client"

import Link from "next/link"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, CheckCircle, ArrowRight, Eye } from "lucide-react"
import { useExtraction } from "@/hooks/use-extraction"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const PLACEHOLDER_EXAMPLES = [
  "apple.com",
  "A luxury skincare brand for women 35+",
  "spotify.com",
  "An indie coffee shop with personality",
  "Your website URL or brand description",
]

export default function HeroSection() {
  const {
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
  } = useExtraction()

  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  // Cycle placeholder every 3s — pause when focused or user has typed
  useEffect(() => {
    if (isFocused || url) return
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length)
    }, 3000)
    return () => clearInterval(id)
  }, [isFocused, url])

  const borderClass = error
    ? "bg-red-400"
    : isSuccess
    ? "bg-green-400"
    : isFocused || inputAnimating
    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
    : "bg-gradient-to-r from-blue-400 to-indigo-400"

  const shadowClass =
    isFocused || inputAnimating
      ? "shadow-lg shadow-blue-500/20"
      : "shadow-md shadow-blue-500/10"

  return (
    <section
      id="hero"
      className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border border-blue-200 shadow-sm">
            <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Tone of Voice Guidelines
          </div>

          {/* Headline */}
          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4">
            Create your tone of voice guidelines in minutes
          </h1>

          {/* Subtext */}
          <p className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 text-xl text-muted-foreground max-w-2xl mb-8 hero-lead">
            Stop asking AI to &quot;make it sound good.&quot; Create high-quality, professional{" "}
            <strong>tone of voice guidelines</strong> to make sure you always sound like you.
          </p>

          {/* Form */}
          <form
            onSubmit={handleExtraction}
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 w-full max-w-2xl"
          >
            <div className="w-full mx-auto mb-3">

              {/* Gradient border wrapper */}
              <div className={cn("p-[1.5px] rounded-2xl transition-all duration-300", borderClass, shadowClass)}>
                <div className="flex items-center bg-white rounded-[14px] px-3 py-2 gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500 shrink-0 ml-1" />

                  {/* Input + animated placeholder overlay */}
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      // Native placeholder hidden — custom overlay handles it
                      placeholder=""
                      className="w-full py-3 text-base font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                      value={url}
                      onChange={(e) => {
                        const sanitizedValue = sanitizeInput(e.target.value, url)
                        setUrl(sanitizedValue)
                        if (error) clearError()
                      }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      inputMode="text"
                      disabled={isExtracting || isSuccess}
                      aria-label="Website URL or brand description"
                      aria-describedby={error ? "input-error" : undefined}
                    />
                    {/* Animated placeholder — fades in on each cycle change */}
                    {!url && (
                      <div className="absolute inset-0 flex items-center pointer-events-none select-none">
                        <span
                          key={placeholderIdx}
                          className="text-gray-400 text-sm font-normal animate-in fade-in duration-500 truncate"
                        >
                          {PLACEHOLDER_EXAMPLES[placeholderIdx]}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    onClick={() =>
                      track("Generate Button Clicked", { hasUrl: !!url.trim(), location: "hero" })
                    }
                    disabled={isExtracting || isSuccess || !isInputValid()}
                    className={cn(
                      "shrink-0 rounded-xl px-5 h-11 bg-black text-white font-semibold text-sm",
                      "hover:bg-gray-800 focus:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1",
                      "transition-all duration-200",
                      isSuccess && "bg-green-500 hover:bg-green-600 focus:ring-green-400",
                      !isInputValid() && !isExtracting && !isSuccess && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>{loadingMessage || "Processing"}</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Done!</span>
                      </>
                    ) : (() => {
                      const trimmed = url.trim()
                      const detection = detectInputType(trimmed)
                      const isDesc = detection.inputType === "description" && trimmed.includes(" ")
                      if (isDesc && trimmed.length < 25) return <span>Min. 25 chars</span>
                      return (
                        <>
                          <span>Get Started</span>
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </>
                      )
                    })()}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  id="input-error"
                  className="mt-3 text-red-600 text-sm font-medium flex items-start gap-1 leading-5 max-w-lg"
                  role="alert"
                  aria-live="polite"
                >
                  <svg className="h-4 w-4 flex-shrink-0 mt-px" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Character counter */}
              {(() => {
                const trimmed = url.trim()
                const detection = detectInputType(trimmed)
                const isDesc = detection.inputType === "description" && trimmed.includes(" ")
                if (!isDesc || error) return null
                const len = trimmed.length
                return (
                  <div className="mt-3 text-left">
                    <span className="text-xs sm:text-sm font-medium tabular-nums text-muted-foreground" role="status">
                      {len <= 200 ? `${len}/200 characters` : "Using first 200 characters"}
                    </span>
                  </div>
                )
              })()}

              {/* Social proof — star rating for credibility */}
              <div className="animate-in fade-in duration-700 delay-1000 mt-4 flex items-center justify-center gap-1.5">
                <div className="flex" aria-hidden="true">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  Trusted by brands worldwide
                </span>
              </div>
            </div>

            {/* Secondary CTA — or-divider pattern makes it an alternative, not an afterthought */}
            <div className="animate-in fade-in duration-700 delay-700">
              <div className="mt-5 flex items-center gap-3 max-w-xs mx-auto">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-semibold">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              <div className="mt-3 text-center">
                <Link
                  href="/example"
                  onClick={() => track("Sample Guide Clicked", { location: "hero" })}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group rounded-full border border-gray-300 hover:border-gray-400 px-4 py-1.5"
                >
                  See a sample guide first
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

          </form>
        </div>
      </div>
    </section>
  )
}
