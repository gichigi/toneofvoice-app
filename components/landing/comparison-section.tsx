"use client"

import { Check, X } from "lucide-react"
import {
  COMPARISON_ROWS,
  COMPARISON_ROW_MOBILE_FEATURE_2,
  type ComparisonCell,
} from "@/lib/landing-data"

function CellIcon({ cell }: { cell: ComparisonCell }) {
  if (cell === "check") {
    return (
      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="h-5 w-5 text-emerald-600" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
      <X className="h-5 w-5 text-orange-600" />
    </div>
  )
}

function MobileCellIcon({ cell }: { cell: ComparisonCell }) {
  if (cell === "check") {
    return (
      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="h-4 w-4 text-emerald-600" />
      </div>
    )
  }
  return (
    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
      <X className="h-4 w-4 text-orange-600" />
    </div>
  )
}

function AisgLabel() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-6 h-6 rounded-md overflow-hidden shadow-sm">
        <div className="h-full w-full grid grid-cols-2">
          <div className="bg-primary"></div>
          <div className="bg-blue-500"></div>
          <div className="bg-gray-200"></div>
          <div className="bg-indigo-600"></div>
        </div>
      </div>
      <span>AISG</span>
    </div>
  )
}

function MobileAisgLabel() {
  return (
    <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
      <div className="w-4 h-4 rounded-sm overflow-hidden">
        <div className="h-full w-full grid grid-cols-2">
          <div className="bg-primary"></div>
          <div className="bg-blue-500"></div>
          <div className="bg-gray-200"></div>
          <div className="bg-indigo-600"></div>
        </div>
      </div>
      <span>AISG</span>
    </div>
  )
}

export default function ComparisonSection() {
  return (
    <section id="comparison" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why choose AIStyleGuide
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              See how we compare to using a template or ChatGPT
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl py-10">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-100">
                  <th className="text-left py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">
                    What you get
                  </th>
                  <th className="text-center py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">
                    Templates
                  </th>
                  <th className="text-center py-5 px-4 font-bold text-gray-900 text-xl sm:text-lg">
                    ChatGPT
                  </th>
                  <th className="text-center py-5 px-4 font-bold text-gray-700 text-xl sm:text-lg">
                    <AisgLabel />
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 1 ? "border-b border-gray-200" : "border-b border-gray-200 bg-slate-50"
                    }
                  >
                    <td className="py-5 px-4 font-medium text-gray-700 text-lg sm:text-base">
                      {row.feature}
                    </td>
                    <td className="py-5 px-4 text-center">
                      <CellIcon cell={row.templates} />
                    </td>
                    <td className="py-5 px-4 text-center">
                      <CellIcon cell={row.chatgpt} />
                    </td>
                    <td className="py-5 px-4 text-center">
                      <CellIcon cell={row.aisg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {COMPARISON_ROWS.map((row, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <h3 className="font-medium text-gray-900 text-base mb-3 text-center">
                  {idx === 1 ? COMPARISON_ROW_MOBILE_FEATURE_2 : row.feature}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Templates</div>
                    <MobileCellIcon cell={row.templates} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">ChatGPT</div>
                    <MobileCellIcon cell={row.chatgpt} />
                  </div>
                  <div>
                    <MobileAisgLabel />
                    <MobileCellIcon cell={row.aisg} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
