"use client"

import { useRouter } from "next/navigation"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, CheckCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PRICING_TIERS, type PricingTier } from "@/lib/landing-data"

// Single source of styling per tier; no ternaries in JSX
const TIER_THEME: Record<
  string,
  {
    border: string
    gradient: string
    nameClass: string
    priceClass: string
    buttonClass: string
    Icon: LucideIcon
    iconClass: string
    iconMargin: string
    listClass: string
    itemClass: string
  }
> = {
  starter: {
    border: "border-2 border-gray-300",
    gradient: "from-gray-50 to-background",
    nameClass: "text-gray-700",
    priceClass: "text-gray-700",
    buttonClass: "bg-gray-800 hover:bg-gray-700 text-white",
    Icon: CheckCircle,
    iconClass: "text-gray-500",
    iconMargin: "mr-2",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center",
  },
  pro: {
    border: "border-4 border-indigo-600",
    gradient: "from-indigo-50 to-background",
    nameClass: "text-indigo-700",
    priceClass: "text-indigo-700",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    Icon: Check,
    iconClass: "text-indigo-600",
    iconMargin: "",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center gap-2",
  },
  agency: {
    border: "border-2 border-blue-500",
    gradient: "from-blue-50 to-background",
    nameClass: "text-blue-700",
    priceClass: "text-blue-700",
    buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
    Icon: Check,
    iconClass: "text-blue-500",
    iconMargin: "",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center gap-2",
  },
}

function PricingCard({
  tier,
  onSelect,
}: {
  tier: PricingTier
  onSelect: (tier: PricingTier) => void
}) {
  const theme = TIER_THEME[tier.id] ?? TIER_THEME.starter
  const { Icon } = theme

  return (
    <Card
      className={`relative overflow-hidden ${theme.border} ${
        tier.highlight ? "shadow-lg scale-105" : ""
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
      />
      {tier.badge && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">
          {tier.badge}
        </div>
      )}
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h3 className={`text-2xl font-bold ${theme.nameClass}`}>
            {tier.name}
          </h3>
          <div className="space-y-1">
            <p className={`text-5xl font-bold ${theme.priceClass}`}>
              {tier.priceLabel}
            </p>
            <p className="text-sm text-muted-foreground">{tier.sublabel}</p>
          </div>
          <ul className={theme.listClass}>
            {tier.features.map((feature, i) => (
              <li key={i} className={theme.itemClass}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${theme.iconClass} ${theme.iconMargin}`}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            size="lg"
            className={`mt-2 font-bold rounded-full px-8 py-3 shadow-md ${theme.buttonClass}`}
            onClick={() => onSelect(tier)}
          >
            {tier.cta}
          </Button>
          <p className="text-xs text-muted-foreground">{tier.ctaSubtext}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PricingSection() {
  const router = useRouter()

  const handleSelect = (tier: PricingTier) => {
    track("Pricing Card Clicked", {
      plan: tier.id,
      price: tier.price,
      location: "homepage",
    })
    router.push("/brand-details")
  }

  return (
    <section id="pricing" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple pricing
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Unlock your full guide, edit anytime, and export in multiple formats
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </section>
  )
}
