"use client"

import { HOW_IT_WORKS_STEPS } from "@/lib/landing-data"

// Static class names so Tailwind includes them (lib/ not in content paths, dynamic classes get purged)
const STEP_STYLES = [
  { accent: "border-t-blue-300", numBg: "bg-blue-100 text-blue-700" },
  { accent: "border-t-purple-300", numBg: "bg-purple-100 text-purple-700" },
  { accent: "border-t-green-300", numBg: "bg-green-100 text-green-700" },
] as const

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-20 lg:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Input to impact in 3 steps
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
            No long forms. Just tell us your website, generate your guidelines and start
            using it to guide your writing.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 lg:gap-10">
            {HOW_IT_WORKS_STEPS.map(({ title, body }, i) => {
              const { accent, numBg } = STEP_STYLES[i]
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center text-center gap-4 p-6 rounded-lg border border-gray-200 border-t-4 bg-white shadow-sm ${accent} opacity-0 animate-slide-in-right-fade`}
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards" }}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold tabular-nums ${numBg}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
