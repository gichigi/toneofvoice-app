"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MetaPixel } from "@/lib/meta-pixel"

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

    // Read plan here - MetaPixelPurchase (inside Suspense) mounts too late and
    // misses the params after we call router.replace below. Fire pixel here instead.
    const plan = searchParams.get("plan") as "pro" | "agency" | null

    const verify = async () => {
      try {
        // Call verify-subscription to ensure profile is updated
        const res = await fetch("/api/verify-subscription", { method: "POST" })
        const data = await res.json()

        if (data.subscription_tier && data.subscription_tier !== "starter" && data.subscription_tier !== "free") {
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

      // Fire Purchase pixel before clearing the URL - must happen here because
      // MetaPixelPurchase (Suspense-wrapped) mounts after this effect clears params.
      if (plan === "pro" || plan === "agency") {
        MetaPixel.purchase(plan)
      }

      // Clean up URL and refresh page data
      router.replace("/dashboard", { scroll: false })
      router.refresh()
    }

    verify()
  }, [searchParams, router, toast, hasVerified])

  return null
}
