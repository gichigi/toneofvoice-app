"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateGuideModal } from "@/components/CreateGuideModal";
import { UpgradeNudgeModal } from "@/components/dashboard/UpgradeNudgeModal";

interface NewGuideButtonProps {
  variant?: "button" | "card";
  limit?: number;
  used?: number;
  className?: string;
}

export function NewGuideButton({ variant = "button", limit = 1, used = 0, className }: NewGuideButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const isAtLimit = limit > 0 && used >= limit;

  // At limit: show clickable button/card that opens upgrade nudge (Relume-style)
  if (isAtLimit) {
    if (variant === "card") {
      return (
        <>
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground transition hover:border-gray-300 hover:text-foreground dark:hover:border-gray-700"
          >
            <Plus className="h-8 w-8" />
            <span className="mt-2 text-sm">New guide</span>
          </button>
          <UpgradeNudgeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} used={used} limit={limit} />
        </>
      );
    }
    return (
      <>
        <Button onClick={() => setUpgradeModalOpen(true)} size="sm" className={className}>
          <Plus className="h-4 w-4" />
          New guide
        </Button>
        <UpgradeNudgeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} used={used} limit={limit} />
      </>
    );
  }

  if (variant === "card") {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground transition hover:border-gray-300 hover:text-foreground dark:hover:border-gray-700"
        >
          <Plus className="h-8 w-8" />
          <span className="mt-2 text-sm">New guide</span>
        </button>
        <CreateGuideModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setModalOpen(true)} size="sm" className={className}>
        <Plus className="h-4 w-4" />
        New guide
      </Button>
      <CreateGuideModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
