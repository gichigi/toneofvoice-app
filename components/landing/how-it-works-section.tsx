"use client"

import { HOW_IT_WORKS_STEPS } from "@/lib/landing-data"
import { ArrowRight } from "lucide-react"

// Subtle color styling for steps
const STEP_COLORS = [
  {
    bg: "bg-blue-50",
    circleBg: "bg-blue-100",
    circleText: "text-blue-700",
  },
  {
    bg: "bg-purple-50",
    circleBg: "bg-purple-100",
    circleText: "text-purple-700",
  },
  {
    bg: "bg-green-50",
    circleBg: "bg-green-100",
    circleText: "text-green-700",
  },
] as const

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full py-12 md:py-20 lg:py-24 bg-background"
    >
      <div className="container px-4 md:px-6">
        {/* Section header - match pricing / whats-included weight */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Input to impact in 3 steps
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            No long forms. Enter your website or a short description, generate your
            guidelines, and start writing in your voice.
          </p>
        </div>

        {/* Step cards - minimal, clean design with subtle color */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS_STEPS.map(({ title, body }, i) => {
              const isLast = i === HOW_IT_WORKS_STEPS.length - 1
              const color = STEP_COLORS[i]
              return (
                <div key={i} className="relative flex flex-col">
                  <div
                    className={`flex flex-col gap-4 p-6 md:p-8 rounded-lg border border-gray-200 ${color.bg} shadow-sm hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade text-center`}
                    style={{
                      animationDelay: `${i * 120}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex w-10 h-10 rounded-full items-center justify-center text-lg font-bold tabular-nums ${color.circleBg} ${color.circleText}`}
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
                        {title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                  {/* Connector arrow on desktop (hidden on last card) */}
                  {!isLast && (
                    <div
                      className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 -translate-y-1/2 items-center justify-center rounded-full bg-white border border-gray-200"
                      aria-hidden
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
