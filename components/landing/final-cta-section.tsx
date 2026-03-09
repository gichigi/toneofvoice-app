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
                Create your tone of voice <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <div className="flex" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                Trusted by brands worldwide
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
