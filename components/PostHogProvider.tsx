"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    })

    // Filter out internal users in production
    // Set this in browser console: localStorage.setItem('posthog_internal', 'true')
    if (process.env.NODE_ENV === "production" && typeof window !== 'undefined') {
      if (localStorage.getItem('posthog_internal') === 'true') {
        posthog.register({ is_internal: true })
      }
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
