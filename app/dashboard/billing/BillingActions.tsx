"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, isAbortError } from "@/lib/api-utils";

type Props = {
  hasCustomer: boolean;
  tier: string;
  plan?: "pro" | "agency";
  compact?: boolean;
  /** Optional class for the primary CTA (e.g. tier-themed button on billing cards). */
  buttonClass?: string;
};

export function BillingActions({ hasCustomer, tier, plan, compact, buttonClass }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      let data: { url?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : "Invalid response. Please try again.");
      }
      if (res.status === 401) throw new Error("Your session expired. Please sign in again.");
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || "Failed to open portal");
    } catch (e) {
      setLoading(false);
      if (isAbortError(e)) return;
      const message = getUserFriendlyError(e) || (e instanceof Error ? e.message : "Could not open billing.");
      toast({
        title: "Could not open billing",
        description: `${message} You can try again.`,
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async (p: "pro" | "agency") => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      });
      let data: { url?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : "Invalid response. Please try again.");
      }
      if (res.status === 401) throw new Error("Your session expired. Please sign in again.");
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || "Failed to start checkout");
    } catch (e) {
      setLoading(false);
      if (isAbortError(e)) return;
      toast({
        title: "Something went wrong",
        description: "Please try again in a few minutes.",
        variant: "destructive",
      });
    }
  };

  // Main billing section: Manage in Stripe
  if (!plan && hasCustomer && (tier === "starter" || tier === "pro" || tier === "agency")) {
    return (
      <Button onClick={handleManage} disabled={loading} size={compact ? "sm" : "default"} className={buttonClass}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage in Stripe"}
      </Button>
    );
  }

  // Plan cards
  if (plan) {
    if (tier === plan) {
      return hasCustomer ? (
        <Button onClick={handleManage} disabled={loading} size={compact ? "sm" : "default"} variant="outline" className={compact ? undefined : buttonClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
        </Button>
      ) : null;
    }
    // Can subscribe/upgrade: starter -> pro/agency; pro -> agency
    const canUpgrade = (tier === "starter" && (plan === "pro" || plan === "agency")) || (tier === "pro" && plan === "agency");
    if (canUpgrade) {
      const buttonLabel = plan === "pro" ? "Get Pro" : "Get Agency";
      return (
        <Button onClick={() => handleSubscribe(plan)} disabled={loading} size={compact ? "sm" : "default"} className={buttonClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonLabel}
        </Button>
      );
    }
  }

  return null;
}
