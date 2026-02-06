"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateGuideModal } from "@/components/CreateGuideModal";
import Link from "next/link";

interface NewGuideButtonProps {
  variant?: "button" | "card";
  limit?: number;
  used?: number;
  className?: string;
}

export function NewGuideButton({ variant = "button", limit = 1, used = 0, className }: NewGuideButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isAtLimit = used >= limit;

  if (isAtLimit) {
    // Show disabled state or upgrade prompt
    if (variant === "card") {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground opacity-50 cursor-not-allowed">
          <Plus className="h-8 w-8" />
          <span className="mt-2 text-sm">Limit reached</span>
        </div>
      );
    }
    return (
      <Button disabled size="sm" className={className}>
        <Plus className="h-4 w-4" />
        New guide
      </Button>
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
