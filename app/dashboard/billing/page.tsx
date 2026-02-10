import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { BillingActions } from "./BillingActions";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/sign-in?redirectTo=/dashboard/billing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, stripe_customer_id, current_period_end")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("style_guides")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const tier = (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) ?? "starter";
  const limit = tier === "starter" ? 0 : tier === "pro" ? 5 : 99;
  const used = count ?? 0;
  const nextBilling = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header containerClass="max-w-5xl mx-auto px-8 flex h-16 items-center justify-between" />

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscription and billing
          </p>

          <div className="mt-8 rounded-lg border bg-white p-6 dark:bg-gray-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium">
                  Current plan: {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Guides used: {used} of {limit === 99 ? "unlimited" : limit}
                </p>
                {nextBilling && tier !== "starter" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Next billing: {nextBilling}
                  </p>
                )}
              </div>
              <BillingActions
                hasCustomer={!!profile?.stripe_customer_id}
                tier={tier}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <PlanCard
              name="Starter"
              price="$0"
              features={["Preview only", "No download", "No editing"]}
              current={tier === "starter"}
              action={null}
            />
            <PlanCard
              name="Pro"
              price="$29/mo"
              features={["5 guides", "Full editing & AI assist", "PDF & Word export"]}
              current={tier === "pro"}
              action={
                <BillingActions
                  hasCustomer={!!profile?.stripe_customer_id}
                  tier={tier}
                  plan="pro"
                  compact
                />
              }
            />
            <PlanCard
              name="Agency"
              price="$79/mo"
              features={["Unlimited guides", "Multiple client brands", "Priority support", "Full export"]}
              current={tier === "agency"}
              action={
                <BillingActions
                  hasCustomer={!!profile?.stripe_customer_id}
                  tier={tier}
                  plan="agency"
                  compact
                />
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  current,
  action,
}: {
  name: string;
  price: string;
  features: string[];
  current: boolean;
  action: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        current
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
          : "bg-white dark:bg-gray-950"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        {current && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Current
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            {f}
          </li>
        ))}
      </ul>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
