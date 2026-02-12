"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Footer from "@/components/Footer"

export default function FinalCtaSection() {
  return (
    <>
      <section className="w-full py-12 md:py-20 lg:py-24 bg-muted text-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Build brand consistency in minutes
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                No more guesswork. Just consistent content at every single touchpoint.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                size="lg"
                className="gap-1"
                onClick={() => {
                  document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Create your style guide <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
