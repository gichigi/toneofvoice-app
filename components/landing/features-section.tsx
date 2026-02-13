"use client"

import { useState } from "react"
import { track } from "@vercel/analytics"
import { FEATURES_SOLUTIONS, FEATURES_PROBLEMS } from "@/lib/landing-data"

export default function FeaturesSection() {
  const [showSolutions, setShowSolutions] = useState(false)

  const cards = showSolutions ? FEATURES_SOLUTIONS : FEATURES_PROBLEMS
  const cardType = showSolutions ? "solution" : "problem"

  return (
    <section
      id="features"
      className="w-full py-12 md:py-20 lg:py-24 bg-muted"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-start space-y-4 max-w-5xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
            When you
          </h2>
          <div className="flex flex-row items-center gap-3">
            <button
              onClick={() => {
                setShowSolutions(!showSolutions)
                track("Toggle Problems Solutions", {
                  showing: !showSolutions ? "solutions" : "problems",
                })
              }}
              className="relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: showSolutions ? "#3b82f6" : "#ef4444",
              }}
              aria-label={showSolutions ? "Show problems" : "Show solutions"}
              aria-pressed={showSolutions}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ease-out ${
                  showSolutions ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter transition-colors duration-300 break-words md:break-normal"
              style={{
                color: showSolutions ? "#3b82f6" : "#ef4444",
              }}
            >
              {showSolutions ? "have a strong tone of voice" : "don't have a strong tone of voice"}
            </h2>
          </div>
        </div>

        <div className="mx-auto max-w-5xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon
              const delay = index * 100
              return (
                <div
                  key={`${cardType}-${index}`}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-slide-in-right-fade ${
                    showSolutions
                      ? ""
                      : ""
                  }`}
                  style={{
                    animationDelay: `${delay}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                      showSolutions
                        ? "bg-blue-100 text-blue-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
