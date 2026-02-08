"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Preserve query params when redirecting
    const params = new URLSearchParams(searchParams.toString())
    router.replace(`/guide${params.toString() ? `?${params.toString()}` : ''}`)
  }, [router, searchParams])
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <PreviewContent />
    </Suspense>
  )
}
