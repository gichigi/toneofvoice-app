"use client"

import { useState, useEffect } from "react"

// 768 matches Tailwind's md breakpoint, which is also when the desktop sidebar CSS shows (md:block).
// Using 640 caused a 640-767px dead zone: no Sheet and no visible desktop sidebar.
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      // Initial check
      setIsMobile(window.innerWidth < breakpoint)

      // Set up event listener for window resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < breakpoint)
      }

      // Add event listener
      window.addEventListener("resize", handleResize)

      // Clean up
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [breakpoint])

  return isMobile
}

// Alias for shadcn sidebar (expects useIsMobile)
export const useIsMobile = useMobile
