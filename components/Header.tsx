"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ReactNode } from "react"
import { PhoneCall } from "lucide-react"
import { track } from "@vercel/analytics"

interface HeaderProps {
  showNavigation?: boolean
  showGetStarted?: boolean
  variant?: "default" | "minimal"
  rightContent?: ReactNode
  containerClass?: string
}

export default function Header({ 
  showNavigation = false, 
  showGetStarted = false,
  variant = "minimal",
  rightContent,
  containerClass
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={containerClass || "container flex h-16 items-center justify-between"}>
        <Logo size="md" linkToHome={true} />
        
        {showNavigation && (
          <nav className="hidden md:flex gap-6">
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              How It Works
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary">
              FAQ
            </Link>
          </nav>
        )}
        
        {showGetStarted && (
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link
                href="https://calendly.com/l-gichigi/customer-chat"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 text-sm font-medium"
              >
                <PhoneCall className="h-4 w-4" />
                Book a Call
              </Link>
            </Button>
            <Button asChild>
              <Link 
                href="#hero"
                onClick={(e) => {
                  track('Get Started Clicked', { location: 'header' })
                  // Dispatch custom event to trigger input animation even if already at top
                  window.dispatchEvent(new CustomEvent('get-started-clicked'))
                  // If already at top, prevent default scroll behavior
                  const heroElement = document.getElementById('hero')
                  if (heroElement && window.scrollY < heroElement.offsetTop + heroElement.offsetHeight) {
                    e.preventDefault()
                    // Manually scroll to ensure we're at the exact position
                    heroElement.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                Get Started
              </Link>
            </Button>
          </div>
        )}
        
        {rightContent && (
          <div className="flex items-center gap-4">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  )
} 