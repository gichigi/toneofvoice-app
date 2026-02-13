import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Get current user's guide limit and usage (for upgrade nudge when at limit). */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) ?? "starter";
    const limit = tier === "starter" ? 0 : tier === "pro" ? 2 : 99;

    const { count } = await supabase
      .from("style_guides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const used = count ?? 0;

    return NextResponse.json({
      subscription_tier: tier,
      limit,
      used,
      atLimit: limit > 0 && used >= limit,
    });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[user-guide-limit] Error:", e);
    return NextResponse.json({ error: "Failed to get limit" }, { status: 500 });
  }
}
