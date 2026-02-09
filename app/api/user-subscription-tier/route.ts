import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Get the current user's subscription tier */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[user-subscription-tier] Error fetching profile:", error);
      return NextResponse.json(
        { subscription_tier: "starter" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      subscription_tier: (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) || "starter",
    });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[user-subscription-tier] Error:", e);
    return NextResponse.json(
      { subscription_tier: "starter" },
      { status: 200 }
    );
  }
}
