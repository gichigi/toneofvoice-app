"use client"

import Link from "next/link"
import { BookOpen, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface GuideCardProps {
  id: string
  title: string
  planType: string
  updatedAt: string
  /** Favicon URL when guide was generated from a website (e.g. Google favicon service). */
  faviconUrl?: string
}

export function GuideCard({ id, title, planType, updatedAt, faviconUrl }: GuideCardProps) {
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState(faviconUrl)
  const [faviconFailed, setFaviconFailed] = useState(false)
  const showFavicon = currentFaviconUrl && !faviconFailed

  // Extract hostname from original faviconUrl for fallback sources
  const getFaviconFallbacks = (url: string | undefined): string[] => {
    if (!url) return []
    try {
      const match = url.match(/domain=([^&]+)/)
      const host = match ? match[1] : new URL(url).hostname
      return [
        url, // Original (Google)
        `https://icons.duckduckgo.com/ip3/${host}.ico`,
        `https://${host}/favicon.ico`
      ]
    } catch {
      return [url]
    }
  }

  const faviconFallbacks = getFaviconFallbacks(faviconUrl)
  const [fallbackIndex, setFallbackIndex] = useState(0)

  const handleFaviconError = () => {
    const nextIndex = fallbackIndex + 1
    if (nextIndex < faviconFallbacks.length) {
      setFallbackIndex(nextIndex)
      setCurrentFaviconUrl(faviconFallbacks[nextIndex])
    } else {
      setFaviconFailed(true)
    }
  }
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/delete-style-guide?guideId=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete guide")
      }

      toast({
        title: "Guide deleted",
        description: "Your tone of voice guide has been permanently deleted.",
      })

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Failed to delete guide",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="group relative flex flex-col rounded-lg border bg-white p-4 transition hover:border-gray-300 dark:bg-gray-950 dark:hover:border-gray-700">
        <Link
          href={`/guide?guideId=${id}`}
          className="flex flex-col flex-1"
        >
          {/* Favicon when guide was generated from website; else sleek fallback icon */}
          {showFavicon ? (
            <span className="mb-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFaviconUrl}
                alt=""
                width={32}
                height={32}
                onError={handleFaviconError}
                className="h-8 w-8 object-contain"
              />
            </span>
          ) : (
            <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
          )}
          <h3 className="font-medium">{title || "Untitled guide"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Updated{" "}
            {formatDistanceToNow(new Date(updatedAt), {
              addSuffix: true,
            })}
          </p>
        </Link>
        
        {/* Delete button - appears on hover */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          aria-label="Delete guide"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tone of voice guide?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{title}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
