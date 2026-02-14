"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

// Module-level flag prevents concurrent saves across instances
let _saving = false

/**
 * Auto-saves preview content as a guide after sign-in/sign-up
 * if localStorage contains brandDetails and previewContent.
 * Runs on /guide and /dashboard. On success, removes previewContent
 * and redirects to guideId when on /guide so the guide appears on dashboard.
 */
export function AutoSaveGuide() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const attempted = useRef(false)

  useEffect(() => {
    if (authLoading || !user) return
    if (_saving) return

    const brandDetails = localStorage.getItem("brandDetails")
    const previewContent = localStorage.getItem("previewContent")
    if (!brandDetails || !previewContent) return
    // Only attempt once per mount cycle
    if (attempted.current) return
    attempted.current = true

    _saving = true

    const saveGuide = async (retries = 0): Promise<void> => {
      try {
        const parsedBrandDetails = JSON.parse(brandDetails)
        console.log("[AutoSaveGuide] Saving preview guide for", parsedBrandDetails.name)

        const res = await fetch("/api/save-style-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${parsedBrandDetails.name || "Brand"} Style Guide`,
            brand_name: parsedBrandDetails.name || "Brand",
            content_md: previewContent,
            plan_type: "style_guide",
            brand_details: parsedBrandDetails,
          }),
        })

        if (!res.ok) {
          const errorBody = await res.text().catch(() => "")
          console.warn(`[AutoSaveGuide] Save failed (${res.status}): ${errorBody}`)

          // Retry on 401 (session cookie may not be ready yet after sign-in)
          if (res.status === 401 && retries < 3) {
            const delay = 1000 * (retries + 1)
            console.log(`[AutoSaveGuide] Retrying in ${delay}ms (attempt ${retries + 2}/4)`)
            await new Promise(r => setTimeout(r, delay))
            return saveGuide(retries + 1)
          }
          return
        }

        const data = await res.json().catch(() => null)
        if (data?.guide?.id) {
          console.log("[AutoSaveGuide] Saved guide:", data.guide.id)
          localStorage.removeItem("previewContent")
          localStorage.setItem("savedGuideId", data.guide.id)

          const isOnGuide = window.location.pathname === "/guide"
          const hasGuideId = window.location.search.includes("guideId=")
          if (isOnGuide && !hasGuideId) {
            router.replace(`/guide?guideId=${data.guide.id}`)
          } else {
            router.refresh()
          }
        } else {
          console.warn("[AutoSaveGuide] Save response missing guide id:", data)
        }
      } catch (error) {
        console.error("[AutoSaveGuide] Failed to save guide:", error)
        // Allow retry on next auth state change
        attempted.current = false
      } finally {
        _saving = false
      }
    }

    saveGuide()
  }, [user, authLoading, router])

  return null
}
