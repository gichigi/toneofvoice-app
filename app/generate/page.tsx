"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { FileText, Loader2, AlertCircle, Key } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/Header"
import { getBrandName } from "@/lib/utils"

// Default brand details to use as fallback
const DEFAULT_BRAND_DETAILS = {
  name: "Style Guide AI",
  description: "A web app that generates brand voice and content style guides",
  audience: "marketing teams",
}

// Fallback content for when generation fails
const FALLBACK_CONTENT = `# Style Guide for ${DEFAULT_BRAND_DETAILS.name}

## Brand Voice
- Professional and clear
- Focus on solutions
- Use active voice

## Writing Rules
1. Keep sentences short and clear
2. Use bullet points for lists
3. Avoid jargon and complex terms

## Examples
- Right: "Our product helps teams work better"
- Wrong: "Our solution enables synergistic team collaboration"`

export default function GeneratePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Analyzing brand information")
  const [error, setError] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [fadeIn, setFadeIn] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    // Check if we're in preview mode
    const mode = localStorage.getItem("generationMode")
    setIsPreviewMode(mode === "preview")
  }, [])

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Check if brand details exist in localStorage
    const savedDetails = localStorage.getItem("brandDetails")

    if (!savedDetails) {
      // If no details in localStorage, use default values and save them
      localStorage.setItem("brandDetails", JSON.stringify(DEFAULT_BRAND_DETAILS))
      setBrandDetails(DEFAULT_BRAND_DETAILS)
    } else {
      try {
        // Parse saved details
        const parsedDetails = JSON.parse(savedDetails)
        setBrandDetails(parsedDetails)
      } catch (e) {
        console.error("Error parsing brand details:", e)
        // If parsing fails, use defaults
        localStorage.setItem("brandDetails", JSON.stringify(DEFAULT_BRAND_DETAILS))
        setBrandDetails(DEFAULT_BRAND_DETAILS)
      }
    }
  }, [])

  useEffect(() => {
    // Only proceed with generation if we have brand details and not already generating
    if (!brandDetails || isGenerating) return

    setIsGenerating(true)

    const steps = [
      { message: "Analyzing brand information", duration: 2000 },
      { message: "Defining brand voice", duration: 3000 },
      { message: "Creating tone guidelines", duration: 2500 },
      { message: "Generating grammar rules", duration: 2000 },
      { message: "Crafting formatting standards", duration: 2000 },
      { message: "Developing content examples", duration: 3000 },
      { message: "Finalizing style guide", duration: 1500 },
    ]

    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0)
    let elapsed = 0

    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setCurrentStep(step.message)

        const startProgress = (elapsed / totalDuration) * 100
        const endProgress = ((elapsed + step.duration) / totalDuration) * 100
        const startTime = Date.now()

        const intervalId = setInterval(() => {
          const timeElapsed = Date.now() - startTime
          const stepProgress = Math.min(timeElapsed / step.duration, 1)
          const currentProgress = startProgress + (endProgress - startProgress) * stepProgress
          setProgress(currentProgress)

          if (stepProgress >= 1) {
            clearInterval(intervalId)
          }
        }, 50)

        await new Promise((resolve) => setTimeout(resolve, step.duration))
        clearInterval(intervalId)

        elapsed += step.duration
      }

      // After all steps complete
      setProgress(100)

      setTimeout(async () => {
        if (isPreviewMode) {
          // In preview mode, just redirect to preview
          router.push("/preview")
        } else {
          try {
            // Map brandName to name for API compatibility
            const mappedBrandDetails = {
              ...brandDetails,
              name: brandDetails.name || brandDetails.brandName || getBrandName(brandDetails)
            }
            
            console.log("Calling generate-styleguide API with brand details:", mappedBrandDetails)
            const response = await fetch("/api/generate-styleguide", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brandDetails: mappedBrandDetails,
                plan: localStorage.getItem("styleGuidePlan") || "core",
              }),
            })

            // Check for HTTP errors
            if (!response.ok) {
              const errorText = await response.text()
              console.error(`API error: ${response.status} ${response.statusText}`, errorText)
              throw new Error(`API error: ${response.status} ${response.statusText}`)
            }

            // Parse the JSON response
            let data
            try {
              data = await response.json()
            } catch (jsonError) {
              console.error("Failed to parse JSON response:", jsonError)
              throw new Error("Invalid response format from API")
            }

            // Check for API-level errors
            if (!data.success && !data.styleGuide) {
              console.error("API returned error:", data)
              throw new Error(data.error || "Failed to generate style guide")
            }

            // Check for missing style guide
            if (!data.styleGuide) {
              console.error("API returned missing styleGuide:", data)
              throw new Error("The style guide could not be generated. Please try again.")
            }

            console.log("Style guide generated successfully")

            // Save generated guide and brand details
            localStorage.setItem("generatedStyleGuide", data.styleGuide)
            localStorage.setItem("brandDetails", JSON.stringify(brandDetails))

            // Navigate to preview
            router.push("/preview")
          } catch (error) {
            console.error("Error during style guide generation:", error)

            // Provide a user-friendly error message
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Something went wrong generating the style guide. Please try again."

            setError(errorMessage)

            // Check if it's an API key error
            const isApiKeyError = errorMessage.toLowerCase().includes("api key") || 
                                errorMessage.toLowerCase().includes("openai")

            // Show appropriate toast message
            toast({
              title: isApiKeyError ? "API Key Error" : "Generation Error",
              description: isApiKeyError 
                ? "There was an issue with the API key. Please check your configuration."
                : "There was a problem generating your style guide. We'll use a simplified version instead.",
              variant: "destructive",
            })

            // If it's an API key error, use fallback content
            if (isApiKeyError) {
              localStorage.setItem("generatedStyleGuide", FALLBACK_CONTENT)
            }

            // Navigate to preview
            setTimeout(() => {
              router.push("/preview")
            }, 2000)
          }
        }
      }, 500)
    }

    processSteps()
  }, [brandDetails, router, toast, isGenerating, isPreviewMode])

  // If there's an error, show an error message with a button to go back to brand details
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main
          className={`flex-1 container py-12 flex items-center justify-center transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          <div className="mx-auto max-w-md w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Error
                </CardTitle>
                <CardDescription>We encountered a problem while generating your style guide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => router.push("/brand-details")} className="w-full sm:w-auto">
                  Edit Brand Details
                </Button>
                <Button
                  onClick={() => {
                    setError(null)
                    setIsGenerating(false)
                    setBrandDetails({ ...brandDetails })
                  }}
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={`flex-1 container py-12 flex items-center justify-center transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="mx-auto max-w-xl w-full">
          <Card className="shadow-lg border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Generating your style guide</CardTitle>
              <CardDescription className="text-base">
                Our AI is creating a personalized style guide based on your brand details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium">{currentStep}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Clean loading animation without duplication */}
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                  {/* Pulsing background effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                </div>
              </div>
              
              {/* Single informative message */}
              <p className="text-center text-muted-foreground">
                This process usually takes a few minutes as we craft your personalized guide
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
