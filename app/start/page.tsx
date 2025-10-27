"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Globe, Loader2, AlertTriangle, ArrowRight, CheckCircle } from "lucide-react"

export default function StartPage() {
  const router = useRouter()
  const [isExtracting, setIsExtracting] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [manualDetails, setManualDetails] = useState("")
  const [showCharCount, setShowCharCount] = useState(false)
  const [tone, setTone] = useState("friendly")
  const [showManual, setShowManual] = useState(false)

  // URL validation function (copied from homepage)
  const isValidUrl = (urlString: string): boolean => {
    try {
      if (!urlString.trim()) return true
      const urlToCheck = urlString.match(/^https?:\/\//) ? urlString : `https://${urlString}`
      new URL(urlToCheck)
      return urlToCheck.includes(".") && urlToCheck.match(/^https?:\/\/[^.]+\..+/) !== null
    } catch (e) {
      return false
    }
  }

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSuccess(false)
    setIsExtracting(false)
    if (!url.trim()) {
      router.push("/brand-details")
      return
    }
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., example.com)")
      return
    }
    setIsExtracting(true)
    try {
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl
      }
      const response = await fetch("/api/extract-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl }),
      })
      const data = await response.json()
      if (data.success) {
        // Don't save to localStorage - pass data via URL params
        setIsSuccess(true)
        setIsExtracting(false)
        setTimeout(() => {
          // Pass extracted data via URL params
          const params = new URLSearchParams({
            fromExtraction: "true",
            brandName: data.brandName || "",
            description: data.brandDetailsText || "",
            audience: data.audience || ""
          })
          if (data.keywords) {
            // Preload keywords into localStorage for brand-details
            try { localStorage.setItem('brandKeywords', data.keywords) } catch {}
          }
          if (data.suggestedTraits) {
            // Preload suggested traits into localStorage for brand-details
            try { localStorage.setItem('suggestedTraits', JSON.stringify(data.suggestedTraits)) } catch {}
          }
          router.push(`/brand-details?${params.toString()}`)
        }, 800)
      } else {
        setIsExtracting(false)
        setIsSuccess(false)
        router.push("/brand-details")
      }
    } catch (error) {
      setError("There was a problem analyzing this website. Please try again or enter details manually.")
      setIsExtracting(false)
      setIsSuccess(false)
    }
  }

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualDetails.trim()) return
    // Don't save to localStorage - pass data via URL params
    const params = new URLSearchParams({
      description: manualDetails
    })
    router.push(`/brand-details?${params.toString()}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-xl mx-auto shadow-lg border-2 border-gray-200 bg-white/90">
        <CardContent className="py-10 px-6">
          <h1 className="text-3xl font-bold mb-6 text-center">Generate your style guide</h1>
          {/* Website analysis form */}
          <form onSubmit={handleExtraction} className="space-y-4">
            <div className="relative mt-4 mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Globe className="h-6 w-6 text-orange-500 transition-colors duration-200" />
              </div>
              <Input
                type="text"
                placeholder="e.g. nike.com"
                className={`pl-12 py-8 text-lg font-sans font-medium bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:shadow-lg transition-all duration-200 placeholder:text-gray-400 placeholder:font-medium placeholder:text-base ${error ? "border-red-500 focus-visible:ring-red-500" : ""} ${isSuccess ? "border-green-500 focus-visible:ring-green-500 bg-green-50" : ""}`}
                value={url}
                onChange={e => {
                  setUrl(e.target.value)
                  if (error) setError("")
                }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="url"
                disabled={isExtracting || isSuccess}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className={`w-full py-6 text-lg transition-all duration-300 ${isSuccess ? "bg-green-500 hover:bg-green-600" : ""}`}
              disabled={isExtracting || isSuccess}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking your site...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Success
                </>
              ) : (
                <>
                  Analyze my website <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
          {/* Secondary manual entry link */}
          <div className="text-center mt-6 mb-2">
            <button
              type="button"
              className="text-primary hover:underline text-base font-medium"
              onClick={() => setShowManual(v => !v)}
              aria-expanded={showManual}
            >
              Or enter your brand details manually
            </button>
          </div>
          {/* Manual entry form, hidden by default */}
          {showManual && (
            <form onSubmit={handleManual} className="space-y-4 mt-4">
              <textarea
                id="manualDetails"
                name="manualDetails"
                placeholder="Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment."
                value={manualDetails}
                onChange={e => {
                  setManualDetails(e.target.value)
                  setShowCharCount(true)
                  e.target.style.height = "auto"
                  e.target.style.height = e.target.scrollHeight + "px"
                }}
                rows={4}
                className="resize-none min-h-[40px] max-h-[200px] w-full border rounded-md p-4 text-lg"
                onFocus={e => setShowCharCount(true)}
                onBlur={e => setShowCharCount(!!e.target.value)}
                maxLength={500}
              />
              {showCharCount && (
                <div className={`text-xs mt-1 ${manualDetails.length > 450 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{manualDetails.length}/500 characters</div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full py-6 text-lg"
                disabled={!manualDetails.trim()}
              >
                Generate your style guide <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 