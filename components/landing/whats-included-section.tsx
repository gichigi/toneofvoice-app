"use client"

import { WHATS_INCLUDED_FEATURES } from "@/lib/landing-data"

export default function WhatsIncludedSection() {
  return (
    <section id="whats-included" className="w-full py-12 md:py-20 lg:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What&apos;s included in your style guide
            </h2>
            <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
              Everything you need to create compelling content that always sounds like you
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHATS_INCLUDED_FEATURES.map((feature, index) => (
              <div
                key={`feature-${index}`}
                className={`${feature.iconBg} rounded-lg border border-transparent shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade`}
                style={{
                  animationDelay: feature.delay,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold text-gray-900 tabular-nums">
                    {feature.number}
                  </span>
                  {feature.suffix && (
                    <span className="text-4xl md:text-5xl font-bold text-gray-900">
                      {feature.suffix}
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-xl text-gray-900 font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
