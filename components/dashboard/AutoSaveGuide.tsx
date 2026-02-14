"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

// Module-level flag survives re-renders and StrictMode double-invocations
let _saving = false

/**
 * Auto-saves preview content as a free-tier guide after sign-up
 * if localStorage contains brandDetails and previewContent.
 * Runs on /guide and /dashboard. On success, removes previewContent
 * and redirects to guideId when on /guide so the guide appears on dashboard.
 */
export function AutoSaveGuide() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (authLoading || !user) return
    if (hasRun.current || _saving) return

    const brandDetails = localStorage.getItem("brandDetails")
    const previewContent = localStorage.getItem("previewContent")
    if (!brandDetails || !previewContent) {
      hasRun.current = true
      return
    }

    hasRun.current = true
    _saving = true

    const saveGuide = async () => {
      try {
        const parsedBrandDetails = JSON.parse(brandDetails)
        const res = await fetch("/api/save-style-guide", {
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
        const data = res.ok ? await res.json().catch(() => null) : null
        if (res.ok && data?.guide?.id) {
          localStorage.removeItem("previewContent")
          localStorage.setItem("savedGuideId", data.guide.id)
          const isOnGuide = typeof window !== "undefined" && window.location.pathname === "/guide"
          const hasGuideId = typeof window !== "undefined" && window.location.search.includes("guideId=")
          if (isOnGuide && !hasGuideId) {
            router.replace(`/guide?guideId=${data.guide.id}`)
          } else {
            router.refresh()
          }
        }
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
