"use client"

import Link from "next/link"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { useExtraction } from "@/hooks/use-extraction"

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

  return (
    <section
      id="hero"
      className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md">
            <svg
              className="w-3 h-3 mr-1.5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            AI-Powered Tone of Voice Guidelines
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4">
            Create your tone of voice guidelines in minutes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8 hero-lead">
            Stop asking AI to &quot;make it sound good.&quot; Create high-quality, professional{" "}
            <strong>tone of voice guidelines</strong> to make sure you always sound like you.
          </p>

          <form onSubmit={handleExtraction} className="w-full max-w-2xl">
            <div className="w-full max-w-2xl mx-auto mt-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-1 sm:p-1 sm:rounded-xl sm:bg-white sm:border sm:border-blue-200 sm:shadow-sm">
                <div className="relative flex-1">
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
                      if (error) clearError()
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
                  onClick={() =>
                    track("Generate Button Clicked", {
                      hasUrl: !!url.trim(),
                      location: "hero",
                    })
                  }
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
                    const isDesc =
                      detection.inputType === "description" && hasSpace

                    if (isDesc && trimmed.length < 25) {
                      return <span>Min. 25 characters</span>
                    }

                    return (
                      <>
                        <span>Get Started</span>
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )
                  })()}
                </Button>
              </div>

              {error && (
                <div
                  id="input-error"
                  className="mt-3 text-red-600 text-sm font-medium flex items-start gap-1 leading-5 max-w-lg"
                  role="alert"
                  aria-live="polite"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
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
                    const isDesc =
                      detection.inputType === "description" && hasSpace

                    if (!isDesc || error) return null

                    const len = trimmed.length

                    return (
                      <span
                        className="text-xs sm:text-sm font-medium tabular-nums text-muted-foreground"
                        role="status"
                      >
                        {len <= 200
                          ? `${len}/200 characters`
                          : "Using first 200 characters"}
                      </span>
                    )
                  })()}
                </div>
                <Link
                  href="/brand-details"
                  onClick={() =>
                    track("Manual Entry Clicked", { location: "hero" })
                  }
                  className="text-gray-500 underline font-medium text-xs whitespace-nowrap"
                >
                  Add brand details manually
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
