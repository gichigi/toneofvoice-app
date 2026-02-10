"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PRICING_TIERS, TIER_THEME, type PricingTier } from "@/lib/landing-data"
import { BillingActions } from "./BillingActions"

// Billing-specific FAQs: compelling, aligned with Pro/Agency plan cards
const BILLING_FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What do I get with Pro?",
    a: "Full access: unlock all sections (25 style rules, Before & After examples, key terminology), AI assist to refine your guidelines, and up to 5 saved guides. Update every section with AI assistand export as PDF, Word, or Markdown.",
  },
  {
    q: "What do I get with Agency?",
    a: "Everything in Pro, plus unlimited style guides, the ability to manage multiple client brands from one account, and priority email support. Built for agencies and freelancers who need to scale.",
  },
  {
    q: "How do I cancel or get a refund?",
    a: (
      <span>
        Manage your subscription anytime in your account. We offer a 30-day money-back guarantee. Email{" "}
        <a
          href="mailto:support@aistyleguide.com?subject=Refund%20Request"
          className="text-primary hover:underline"
        >
          support@aistyleguide.com
        </a>{" "}
        within 30 days of purchase for a full refund.
      </span>
    ),
  },
  {
    q: "Questions? Contact support",
    a: (
      <span>
        Email{" "}
        <a
          href="mailto:support@aistyleguide.com?subject=Support%20Request"
          className="text-primary hover:underline"
        >
          support@aistyleguide.com
        </a>
        . Agency subscribers get priority support; we reply to all plans on business days.
      </span>
    ),
  },
]

type Props = {
  tier: string
  used: number
  limit: number
  hasCustomer: boolean
  nextBilling: string | null
}

export function BillingPlansGrid({
  tier,
  used,
  limit,
  hasCustomer,
  nextBilling,
}: Props) {
  const limitLabel = limit === 99 ? "unlimited" : String(limit)

  return (
    <section className="w-full py-8 md:py-12">
      <div className="container px-4 md:px-6">
        {/* Hero: one step away */}
        <div className="mx-auto max-w-5xl text-center mb-6">
          <p className="text-sm font-medium text-primary">
            You&apos;re one step away from full access
          </p>
        </div>

        {/* Current plan summary: styled to match cards */}
        <div className="mx-auto max-w-5xl mb-10">
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-950 dark:bg-gray-950">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Current plan: {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Guides: {used} of {limitLabel}
                  {nextBilling && tier !== "starter" && (
                    <span className="ml-2">Next billing: {nextBilling}</span>
                  )}
                </p>
                {tier === "starter" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <i>Upgrade to generate all sections, create up to 5 guidelines, and export in multiple formats.</i>
                  </p>
                )}
              </div>
              {(hasCustomer && (tier === "pro" || tier === "agency")) && (
                <BillingActions
                  hasCustomer={hasCustomer}
                  tier={tier}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section heading: mirror pricing section */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Choose your plan
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Unlock your full guide, edit anytime, and export in multiple formats
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
          {PRICING_TIERS.map((t) => (
            <BillingPlanCard
              key={t.id}
              tierData={t}
              currentTier={tier}
              hasCustomer={hasCustomer}
            />
          ))}
        </div>

        {/* Trust strip */}
        <div className="mx-auto max-w-5xl text-center py-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-muted-foreground">
            30-day money-back guarantee
            {" "}
            <a
              href="mailto:support@aistyleguide.com?subject=Support%20Request"
              className="text-primary hover:underline"
            >
              Questions? support@aistyleguide.com
            </a>
          </p>
        </div>

        {/* Billing FAQ */}
        <div className="mx-auto max-w-3xl py-8">
          <h3 className="text-lg font-semibold text-center mb-6">
            Billing & plans
          </h3>
          <div className="space-y-6 divide-y divide-gray-200 dark:divide-gray-800">
            {BILLING_FAQS.map((item, i) => (
              <div key={i} className="pt-6 first:pt-0">
                <h4 className="text-sm font-medium">{item.q}</h4>
                <div className="mt-2 text-sm text-muted-foreground [&_a]:text-primary [&_a]:hover:underline">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BillingPlanCard({
  tierData,
  currentTier,
  hasCustomer,
}: {
  tierData: PricingTier
  currentTier: string
  hasCustomer: boolean
}) {
  const theme = TIER_THEME[tierData.id] ?? TIER_THEME.starter
  const { Icon } = theme
  const isCurrent = currentTier === tierData.id

  return (
    <Card
      className={`relative overflow-hidden ${theme.border} ${
        tierData.highlight ? "shadow-lg scale-105" : ""
      } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
      />
      {tierData.badge && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">
          {tierData.badge}
        </div>
      )}
      {isCurrent && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-br-lg shadow">
          Current
        </div>
      )}
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h3 className={`text-2xl font-bold ${theme.nameClass}`}>
            {tierData.name}
          </h3>
          <div className="space-y-1">
            <p className={`text-5xl font-bold ${theme.priceClass}`}>
              {tierData.priceLabel}
            </p>
            <p className="text-sm text-muted-foreground">{tierData.sublabel}</p>
          </div>
          <ul className={theme.listClass}>
            {tierData.features.map((feature, i) => (
              <li key={i} className={theme.itemClass}>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${theme.iconClass} ${theme.iconMargin}`}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {/* CTA: BillingActions for pro/agency; starter has no button */}
          {tierData.id === "starter" ? (
            <p className="text-xs text-muted-foreground mt-2">
              {tierData.ctaSubtext}
            </p>
          ) : (
            <div className="mt-2 w-full flex flex-col items-center gap-1">
              <BillingActions
                hasCustomer={hasCustomer}
                tier={currentTier}
                plan={tierData.id as "pro" | "agency"}
                compact={false}
                buttonClass={`font-bold rounded-full px-8 py-3 shadow-md ${theme.buttonClass}`}
              />
              <p className="text-xs text-muted-foreground">{tierData.ctaSubtext}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
