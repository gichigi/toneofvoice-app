"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ReactNode } from "react"
import { track } from "@vercel/analytics"
import { HeaderAuth } from "@/components/HeaderAuth"

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
      <div className={containerClass || "container grid h-16 grid-cols-3 items-center"}>
        <div className="flex items-center">
          <Logo size="md" linkToHome={true} />
        </div>
        
        {showNavigation && (
          <nav className="hidden md:flex justify-center gap-6">
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
        
        <div className="flex items-center justify-end gap-4">
          {showGetStarted && <HeaderAuth />}
          {rightContent}
        </div>
      </div>
    </header>
  )
} 