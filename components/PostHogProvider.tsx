"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { POSTHOG_PERSON_PROPERTIES, POSTHOG_USER_TYPES } from "@/lib/posthog-properties"

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    })

    // Suppress PostHog toolbar experiments loading errors (common with proxy setup)
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error
      console.error = (...args) => {
        const errorMessage = args[0]?.toString?.() || args[0] || ''
        if (errorMessage.includes('Error loading experiments')) {
          return
        }
        originalError.apply(console, args)
      }
      
      setTimeout(() => {
        console.error = originalError
      }, 5000)
    }

    const identifyUser = () => {
      const isInternal = localStorage.getItem('posthog_internal') === 'true'
      
      if (isInternal) {
        const customId = localStorage.getItem('posthog_user_id')
        const userId = customId && !customId.includes('your-email@example.com') 
          ? customId 
          : `internal-${Date.now()}`
        
        console.log('[PostHog] Identifying internal user:', userId)
        posthog.identify(userId, {
          [POSTHOG_PERSON_PROPERTIES.IS_INTERNAL]: true,
          [POSTHOG_PERSON_PROPERTIES.USER_TYPE]: localStorage.getItem('posthog_user_type') || POSTHOG_USER_TYPES.VISITOR,
        })
      }
    }

    setTimeout(identifyUser, 100)
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
