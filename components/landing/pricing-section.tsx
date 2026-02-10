"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, CheckCircle } from "lucide-react"
import { PRICING_TIERS } from "@/lib/landing-data"

export default function PricingSection() {
  const router = useRouter()

  return (
    <section id="pricing" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple subscription pricing
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Full guide access, editing, and exports
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden ${tier.borderClass} ${
                tier.highlight ? "shadow-lg scale-105" : ""
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tier.gradientClass}`}
              ></div>
              {tier.badge && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">
                  {tier.badge}
                </div>
              )}
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <h3
                    className={`text-2xl font-bold ${
                      tier.isPro ? "text-indigo-700" : tier.isTeam ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <div className="space-y-1">
                    <p
                      className={`text-5xl font-bold ${
                        tier.isPro ? "text-indigo-700" : tier.isTeam ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {tier.priceLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">{tier.sublabel}</p>
                  </div>
                  <ul
                    className={`space-y-2 text-left ${
                      tier.isPro ? "text-sm" : ""
                    }`}
                  >
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className={`flex items-center ${
                          tier.isPro || tier.isTeam ? "gap-2" : ""
                        }`}
                      >
                        {tier.isPro || tier.isTeam ? (
                          <Check
                            className={`h-4 w-4 flex-shrink-0 ${
                              tier.isPro ? "text-indigo-600" : "text-blue-500"
                            }`}
                          />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                        )}
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className={`mt-2 font-bold rounded-full px-8 py-3 shadow-md ${
                      tier.isPro
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : tier.isTeam
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                    onClick={() => {
                      track("Pricing Card Clicked", {
                        plan: tier.id,
                        price: tier.price,
                        location: "homepage",
                      })
                      router.push("/brand-details")
                    }}
                  >
                    {tier.cta}
                  </Button>
                  <p className="text-xs text-muted-foreground">{tier.ctaSubtext}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
