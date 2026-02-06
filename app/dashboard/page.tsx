import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewGuideButton } from "@/components/dashboard/NewGuideButton";

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
    .select("id, title, brand_name, plan_type, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("guides_limit, subscription_tier")
    .eq("id", user.id)
    .single();

  const limit = profile?.guides_limit ?? 1;
  const used = guides?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        containerClass="max-w-5xl mx-auto px-8 flex h-16 items-center justify-between"
        rightContent={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/billing">Billing</Link>
            </Button>
            <NewGuideButton limit={limit} used={used} />
          </div>
        }
      />

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-8">
          <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.subscription_tier === "free"
              ? "Free plan"
              : `${profile?.subscription_tier ?? "Free"} plan`}{" "}
            — {used} of {limit} guides
          </p>

          {guides && guides.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`/full-access?guideId=${g.id}`}
                  className="flex flex-col rounded-lg border bg-white p-4 transition hover:border-gray-300 dark:bg-gray-950 dark:hover:border-gray-700"
                >
                  <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                  <h3 className="font-medium">{g.title || "Untitled guide"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    {g.plan_type} • Updated{" "}
                    {formatDistanceToNow(new Date(g.updated_at!), {
                      addSuffix: true,
                    })}
                  </p>
                </Link>
              ))}
              {used < limit && (
                <NewGuideButton variant="card" limit={limit} used={used} />
              )}
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
