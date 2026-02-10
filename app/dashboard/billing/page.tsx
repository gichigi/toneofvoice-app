import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { ArrowLeft } from "lucide-react";
import { BillingPlansGrid } from "./BillingPlansGrid";

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
    <div className="flex min-h-screen flex-col bg-muted">
      <Header containerClass="max-w-5xl mx-auto px-8 flex h-16 items-center justify-between" />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-8 pt-8 pb-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        <BillingPlansGrid
          tier={tier}
          used={used}
          limit={limit}
          hasCustomer={!!profile?.stripe_customer_id}
          nextBilling={nextBilling}
        />
      </main>
    </div>
  );
}
