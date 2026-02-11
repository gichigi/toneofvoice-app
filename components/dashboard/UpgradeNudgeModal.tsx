"use client"

// Upgrade CTA: primary button per DESIGN_SYSTEM.md (bg-gray-900 hover:bg-gray-800)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

interface UpgradeNudgeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional: used/limit for copy, e.g. "Lift the 1-guide limit" */
  used?: number
  limit?: number
}

export function UpgradeNudgeModal({
  open,
  onOpenChange,
  used = 0,
  limit = 0,
}: UpgradeNudgeModalProps) {
  const limitCopy =
    limit === 0
      ? "Starter plan limit"
      : limit === 5
        ? "5-guide Pro limit"
        : "plan limit"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] text-sm sm:text-base">
        <DialogHeader>
          <p className="text-sm font-medium text-red-600">Upgrade required</p>
          <DialogTitle className="text-lg sm:text-xl">
            Create more guides
          </DialogTitle>
          <DialogDescription>
            Lift the {limitCopy} and upgrade to Pro or Agency to create more
            guides for you and your clients.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            Unlimited guides on Agency
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            5 guides on Pro
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            Export and edit all guides
          </li>
        </ul>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button asChild className="flex-1 bg-gray-900 text-white hover:bg-gray-800 hover:text-white">
            <Link href="/dashboard/billing" onClick={() => onOpenChange(false)}>
              Upgrade to Pro
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
