"use client"

import { useState, useEffect, useRef } from "react"
import { PenTool } from "lucide-react"
import { TRAITS, type TraitName } from "@/lib/traits"

const DEMO_TRAITS: TraitName[] = ["Direct", "Refined", "Witty", "Warm"]

export default function ExampleSection() {
  const [selectedTrait, setSelectedTrait] = useState<TraitName>("Direct")
  const [traitCyclePaused, setTraitCyclePaused] = useState(false)
  const traitCyclePausedRef = useRef(false)
  const traitCycleIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-cycle through traits for demo
  useEffect(() => {
    if (traitCycleIntervalRef.current) {
      clearInterval(traitCycleIntervalRef.current)
    }

    traitCycleIntervalRef.current = setInterval(() => {
      if (traitCyclePausedRef.current) return

      setSelectedTrait((prevTrait) => {
        const prevIndex = DEMO_TRAITS.indexOf(prevTrait)
        const nextIndex = (prevIndex + 1) % DEMO_TRAITS.length
        return DEMO_TRAITS[nextIndex]
      })
    }, 5000)

    return () => {
      if (traitCycleIntervalRef.current) {
        clearInterval(traitCycleIntervalRef.current)
        traitCycleIntervalRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    traitCyclePausedRef.current = traitCyclePaused
  }, [traitCyclePaused])

  return (
    <section id="example" className="w-full py-6 md:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Brand voice traits in action
            </h2>
            <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mb-4">
              See how each trait shapes your guide. Click a trait for definitions,
              do&apos;s, don&apos;ts, and a before/after example.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl py-10">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {DEMO_TRAITS.map((trait) => {
              const isSelected = selectedTrait === trait
              return (
                <button
                  key={trait}
                  onClick={() => {
                    setSelectedTrait(trait)
                    setTraitCyclePaused(true)
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {trait}
                </button>
              )
            })}
          </div>

          <div
            key={selectedTrait}
            className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <PenTool className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  The &quot;{selectedTrait}&quot; trait
                </h3>
              </div>
              <p className="text-base text-muted-foreground mb-6">
                One trait, one set of rules—here&apos;s how it shows up in your
                guide.
              </p>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-base font-semibold mb-2">Definition</p>
                  <p className="text-base text-gray-700">
                    {TRAITS[selectedTrait].definition}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                    <p className="text-base font-semibold mb-2 text-green-900">
                      Do
                    </p>
                    <ul className="text-base text-green-800 space-y-2">
                      {TRAITS[selectedTrait].do.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
                    <p className="text-base font-semibold mb-2 text-red-900">
                      Don&apos;t
                    </p>
                    <ul className="text-base text-red-800 space-y-2">
                      {TRAITS[selectedTrait].dont.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Before / After
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-medium">Before:</span>
                      <p className="text-base text-gray-700 flex-1">
                        &quot;{TRAITS[selectedTrait].example.before}&quot;
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-medium">After:</span>
                      <p className="text-base text-gray-700 flex-1">
                        &quot;{TRAITS[selectedTrait].example.after}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
