"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

// Module-level flag survives re-renders and StrictMode double-invocations
let _saving = false

/**
 * Auto-saves preview content as a free-tier guide after sign-up
 * if localStorage contains brandDetails and previewContent.
 * Runs once on dashboard load.
 */
export function AutoSaveGuide() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (authLoading || !user) return
    if (hasRun.current || _saving) return

    // Check localStorage for brand data
    const brandDetails = localStorage.getItem("brandDetails")
    const previewContent = localStorage.getItem("previewContent")
    
    if (!brandDetails || !previewContent) {
      hasRun.current = true
      return
    }

    // Claim the save immediately to prevent duplicates
    hasRun.current = true
    _saving = true
    // Remove previewContent right away so parallel renders can't re-trigger
    localStorage.removeItem("previewContent")

    const saveGuide = async () => {
      try {
        const parsedBrandDetails = JSON.parse(brandDetails)
        await fetch("/api/save-style-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${parsedBrandDetails.name || "Brand"} Style Guide`,
            brand_name: parsedBrandDetails.name || "Brand",
            content_md: previewContent,
            plan_type: "core",
            brand_details: parsedBrandDetails,
          }),
        })
        router.refresh()
      } catch (error) {
        console.error("[AutoSaveGuide] Failed to save guide:", error)
      } finally {
        _saving = false
      }
    }

    saveGuide()
  }, [user, authLoading, router])

  return null
}
