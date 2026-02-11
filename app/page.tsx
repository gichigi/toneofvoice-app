"use client"

import dynamic from "next/dynamic"
import Header from "@/components/Header"
import BrandBanner from "@/components/BrandBanner"
import HeroSection from "@/components/landing/hero-section"
import FeaturesSection from "@/components/landing/features-section"
import WhatsIncludedSection from "@/components/landing/whats-included-section"
import ComparisonSection from "@/components/landing/comparison-section"
import HowItWorksSection from "@/components/landing/how-it-works-section"
import ExampleSection from "@/components/landing/example-section"
import PricingSection from "@/components/landing/pricing-section"
import FaqSection from "@/components/landing/faq-section"
import FinalCtaSection from "@/components/landing/final-cta-section"

// Lazy load non-critical sections (moved outside component to prevent re-creation on re-renders)
const TestimonialsSection = dynamic(
  () => import("../components/testimonials-section"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full py-12 md:py-20 lg:py-24 bg-muted"></div>
    ),
  }
)

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header showNavigation={true} showGetStarted={true} />
      <main className="flex-1">
        <HeroSection />
        <BrandBanner />
        <FeaturesSection />
        <WhatsIncludedSection />
        <ComparisonSection />
        <HowItWorksSection />
        <div key="testimonials-stable">
          <TestimonialsSection />
        </div>
        <ExampleSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
    </div>
  )
}
