import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewGuideButton } from "@/components/dashboard/NewGuideButton";
import { AutoSaveGuide } from "@/components/dashboard/AutoSaveGuide";
import { GuideCard } from "@/components/dashboard/GuideCard";
import { SubscriptionRefresh } from "@/components/dashboard/SubscriptionRefresh";
import { UserMenu } from "@/components/UserMenu";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/sign-in?redirectTo=/dashboard");
  }

  const name =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "User";

  const { data: guides } = await supabase
    .from("style_guides")
    .select("id, title, brand_name, plan_type, updated_at, brand_details")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("guides_limit, subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) ?? "starter";
  const limit = tier === "starter" ? 1 : tier === "pro" ? 2 : 99;
  const used = guides?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <AutoSaveGuide />
      <SubscriptionRefresh />
      <Header
        containerClass="max-w-5xl mx-auto px-8 flex h-16 items-center justify-between"
        rightContent={
          <div className="flex items-center gap-2">
            <NewGuideButton limit={limit} used={used} />
            <UserMenu />
          </div>
        }
      />

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-8">
          <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
          <p className="mt-1 text-muted-foreground">
            {(profile?.subscription_tier === "free" || profile?.subscription_tier === "starter")
              ? "Starter plan"
              : profile?.subscription_tier === "pro"
              ? "Pro plan"
              : profile?.subscription_tier === "agency"
              ? "Agency plan"
              : "Starter plan"}{" "}
            — {used} of {limit === 99 ? "unlimited" : limit} guides
          </p>

          {guides && guides.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => {
                const websiteUrl = (g.brand_details as { website_url?: string } | null)?.website_url;
                let faviconUrl: string | undefined;
                if (websiteUrl) {
                  try {
                    const host = new URL(websiteUrl).hostname;
                    faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
                  } catch {
                    // invalid URL, no favicon
                  }
                }
                return (
                  <GuideCard
                    key={g.id}
                    id={g.id}
                    title={g.title || "Untitled guide"}
                    planType={g.plan_type || "core"}
                    updatedAt={g.updated_at || new Date().toISOString()}
                    faviconUrl={faviconUrl}
                  />
                );
              })}
              <NewGuideButton variant="card" limit={limit} used={used} />
            </div>
          ) : (
            <div className="mt-8 rounded-lg border bg-white p-8 dark:bg-gray-950">
              <p className="text-center text-muted-foreground">
                No style guides yet. Create one to get started.
              </p>
              <div className="mt-4 flex justify-center">
                <NewGuideButton limit={limit} used={used} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
