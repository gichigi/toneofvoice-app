"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  hasCustomer: boolean;
  tier: string;
  plan?: "pro" | "agency";
  compact?: boolean;
};

export function BillingActions({ hasCustomer, tier, plan, compact }: Props) {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Failed to open portal");
    } catch {
      setLoading(false);
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
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Failed to start checkout");
    } catch {
      setLoading(false);
    }
  };

  // Main billing section: Manage in Stripe
  if (!plan && hasCustomer && (tier === "starter" || tier === "pro" || tier === "agency")) {
    return (
      <Button onClick={handleManage} disabled={loading} size={compact ? "sm" : "default"}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage in Stripe"}
      </Button>
    );
  }

  // Plan cards
  if (plan) {
    if (tier === plan) {
      return hasCustomer ? (
        <Button onClick={handleManage} disabled={loading} size="sm" variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage"}
        </Button>
      ) : null;
    }
    // Can subscribe/upgrade: starter -> pro/agency; pro -> agency
    const canUpgrade = (tier === "starter" && (plan === "pro" || plan === "agency")) || (tier === "pro" && plan === "agency");
    if (canUpgrade) {
      return (
        <Button onClick={() => handleSubscribe(plan)} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tier === "pro" ? "Upgrade" : "Subscribe"}
        </Button>
      );
    }
  }

  return null;
}
