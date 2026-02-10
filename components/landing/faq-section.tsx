"use client"

import { FAQ_ITEMS } from "@/lib/landing-data"

export default function FaqSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-20 lg:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Got questions?
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We&apos;ve got answers
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl divide-y py-8">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-6">
              <h3 className="text-lg font-semibold">{item.q}</h3>
              <p className="mt-2 text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
