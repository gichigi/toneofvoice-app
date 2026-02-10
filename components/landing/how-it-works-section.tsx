"use client"

import { HOW_IT_WORKS_STEPS } from "@/lib/landing-data"
import { ArrowRight } from "lucide-react"

// Step card styling: colored left border + tinted bg to match rest of landing
const STEP_CARD_STYLES = [
  {
    leftBorder: "border-l-4 border-l-blue-500",
    bg: "bg-blue-50/80 dark:bg-blue-950/20",
    numBg: "bg-blue-500 text-white",
    label: "text-blue-700 dark:text-blue-300",
  },
  {
    leftBorder: "border-l-4 border-l-purple-500",
    bg: "bg-purple-50/80 dark:bg-purple-950/20",
    numBg: "bg-purple-500 text-white",
    label: "text-purple-700 dark:text-purple-300",
  },
  {
    leftBorder: "border-l-4 border-l-green-500",
    bg: "bg-green-50/80 dark:bg-green-950/20",
    numBg: "bg-green-500 text-white",
    label: "text-green-700 dark:text-green-300",
  },
] as const

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full py-12 md:py-20 lg:py-24 bg-muted/50 dark:bg-muted/20"
    >
      <div className="container px-4 md:px-6">
        {/* Section header — match pricing / whats-included weight */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Input to impact in 3 steps
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            No long forms. Enter your website or a short description, generate your
            guidelines, and start writing in your voice.
          </p>
        </div>

        {/* Step cards — clear hierarchy, readable text */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS_STEPS.map(({ title, body }, i) => {
              const style = STEP_CARD_STYLES[i]
              const isLast = i === HOW_IT_WORKS_STEPS.length - 1
              return (
                <div key={i} className="relative flex flex-col">
                  <div
                    className={`flex flex-col gap-4 p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow ${style.leftBorder} ${style.bg} opacity-0 animate-slide-in-right-fade`}
                    style={{
                      animationDelay: `${i * 120}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <span
                      className={`inline-flex w-10 h-10 rounded-full items-center justify-center text-lg font-bold tabular-nums ${style.numBg}`}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={`text-xl font-semibold mb-2 ${style.label}`}
                      >
                        {title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                  {/* Connector arrow on desktop (hidden on last card) */}
                  {!isLast && (
                    <div
                      className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 -translate-y-1/2 items-center justify-center rounded-full bg-muted border border-border"
                      aria-hidden
                    >
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
