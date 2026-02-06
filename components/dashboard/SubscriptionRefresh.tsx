"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

/**
 * Verifies subscription status after checkout redirect.
 * If the webhook hasn't processed yet, calls verify-subscription
 * as a fallback to update the profile directly via Stripe API.
 */
export function SubscriptionRefresh() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [hasVerified, setHasVerified] = useState(false)

  useEffect(() => {
    const subscription = searchParams.get("subscription")
    
    if (subscription !== "success" || hasVerified) return
    setHasVerified(true)

    const verify = async () => {
      try {
        // Call verify-subscription to ensure profile is updated
        const res = await fetch("/api/verify-subscription", { method: "POST" })
        const data = await res.json()
        
        if (data.subscription_tier && data.subscription_tier !== "free") {
          toast({
            title: "Subscription activated!",
            description: `Your ${data.subscription_tier} plan is now active.`,
          })
        } else {
          toast({
            title: "Processing subscription...",
            description: "Your payment was received. Refresh in a moment if your plan hasn't updated.",
          })
        }
      } catch (error) {
        console.error("[SubscriptionRefresh] Verify error:", error)
      }

      // Clean up URL and refresh page data
      router.replace("/dashboard", { scroll: false })
      router.refresh()
    }

    verify()
  }, [searchParams, router, toast, hasVerified])

  return null
}
