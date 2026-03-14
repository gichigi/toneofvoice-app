"use client"

import { useEffect } from "react"
import mixpanel from "mixpanel-browser"

interface MixpanelProviderProps {
  children: React.ReactNode
}

// Client-side Mixpanel initialization with session replay
export function MixpanelProvider({ children }: MixpanelProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Skip in development to avoid polluting analytics
    if (process.env.NODE_ENV === "development") {
      console.log("[Mixpanel] Skipping initialization in development mode")
      return
    }

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    if (!token) {
      console.warn("[Mixpanel] Missing NEXT_PUBLIC_MIXPANEL_TOKEN")
      return
    }

    mixpanel.init(token, {
      autocapture: true,
      track_pageview: "full-url",
      persistence: "localStorage",
      // EU data residency - project hosted on eu.mixpanel.com
      api_host: "https://api-eu.mixpanel.com",
      // Session replay + heatmaps: capture 100% of sessions (free plan allows 10k/mo)
      record_sessions_percent: 100,
      record_heatmap_data: true,
      // Discard replays shorter than 8s - removes low-signal bounces at SDK level
      record_min_ms: 8000,
      // Show all text and inputs in replays - mask only password/email/tel fields
      // (those are always masked by Mixpanel regardless of this setting)
      record_mask_all_text: false,
      record_mask_all_inputs: false,
    })

    // If this browser was previously flagged as an internal user, suppress all tracking.
    // This runs after init so the SDK is ready to accept super properties.
    if (localStorage.getItem("mp_internal_user") === "true") {
      mixpanel.register({ $ignore: true })
      mixpanel.stop_session_recording()
    }
  }, [])

  return <>{children}</>
}
