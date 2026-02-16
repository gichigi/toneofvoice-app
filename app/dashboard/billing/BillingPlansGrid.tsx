"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PRICING_TIERS, TIER_THEME, REFUND_ANSWER, SUPPORT_ANSWER, type PricingTier } from "@/lib/landing-data"
import { BillingActions } from "./BillingActions"

// Billing FAQs: aligned with homepage refund/support; Pro = 2 guides, Agency = unlimited (matches codebase)
const BILLING_FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What do I get with Pro?",
    a: "Full access: all sections (25 writing rules, Before & After examples, word list), AI assist, and up to 2 saved guides. Export as PDF, Word, or Markdown with subtle branding.",
  },
  {
    q: "What do I get with Agency?",
    a: "Everything in Pro, plus unlimited guides, white-label exports (no branding), multiple client brands from one account, and priority email support.",
  },
  {
    q: "How do I cancel or get a refund?",
    a: REFUND_ANSWER,
  },
  {
    q: "Questions? Contact support",
    a: SUPPORT_ANSWER,
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
  return (
    <section className="w-full pt-4 pb-8 md:pt-6 md:pb-12">
      <div className="container px-4 md:px-6">
        {/* Section heading */}
        <div className="flex flex-col items-center justify-center space-y-3 text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Choose your plan
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Unlock your full guide, edit anytime, and export in multiple formats
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
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
        <div className="mx-auto max-w-5xl text-center pt-10 pb-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-muted-foreground">
            30-day money-back guarantee
            {" "}
            <a
              href="mailto:support@toneofvoice.app?subject=Support%20Request"
              className="text-primary hover:underline"
            >
              Questions? support@toneofvoice.app
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
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex flex-col items-center space-y-5 text-center">
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
            {tierData.features.map((feature, i) => {
              const text = typeof feature === "string" ? feature : feature.text
              const isSoon = typeof feature === "object" && feature.soon
              return (
                <li key={i} className={theme.itemClass}>
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${theme.iconClass} ${theme.iconMargin}`}
                  />
                  <span>{text}</span>
                  {isSoon && (
                    <span className="ml-1.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {/* CTA: BillingActions for pro/agency; starter has no button */}
          {tierData.id === "starter" ? (
            <p className="text-xs text-muted-foreground mt-4">
              {tierData.ctaSubtext}
            </p>
          ) : (
            <div className="mt-6 w-full flex flex-col items-center gap-3">
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
