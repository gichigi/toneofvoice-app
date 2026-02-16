"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ReactNode } from "react"
import { HeaderAuth } from "@/components/HeaderAuth"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const

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
  containerClass,
}: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={containerClass || "container flex h-16 items-center px-4 md:px-6"}>
        <div className="flex items-center min-w-0">
          <Logo size="md" linkToHome={true} />
        </div>

        {showNavigation && (
          <>
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-6">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className="text-sm font-medium hover:text-primary">
                  {label}
                </Link>
              ))}
            </nav>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(18rem,100vw-2rem)]">
                <nav className="flex flex-col gap-4 pt-8">
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-base font-medium hover:text-primary"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </>
        )}

        <div className="flex items-center justify-end gap-2 md:gap-4 ml-auto min-w-0 relative z-10">
          {showGetStarted && <HeaderAuth />}
          {rightContent}
        </div>
      </div>
    </header>
  )
} 