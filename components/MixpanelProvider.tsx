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
      track_pageview: "full-url",
      persistence: "localStorage",
      // EU data residency - project hosted on eu.mixpanel.com
      api_host: "https://api-eu.mixpanel.com",
      // Session replay: capture 100% of sessions (free plan allows 10k/mo)
      record_sessions_percent: 100,
    })
  }, [])

  return <>{children}</>
}
