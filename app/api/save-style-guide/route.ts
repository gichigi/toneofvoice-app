import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Save a style guide for the authenticated user. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { guide_id, title, brand_name, content_md, plan_type, brand_details } =
      body as {
        guide_id?: string;
        title?: string;
        brand_name?: string;
        content_md?: string;
        plan_type?: "core" | "complete" | "style_guide";
        brand_details?: object;
      };

    if (!title || !content_md) {
      return NextResponse.json(
        { error: "Missing required fields: title, content_md" },
        { status: 400 }
      );
    }

    if (guide_id) {
      // Update existing guide (user must own it)
      const { data: guide, error } = await supabase
        .from("style_guides")
        .update({
          title: title.slice(0, 255),
          brand_name: brand_name?.slice(0, 255) ?? null,
          content_md,
          plan_type: (plan_type === "style_guide" || !plan_type) ? "style_guide" : plan_type,
          brand_details: brand_details ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", guide_id)
        .eq("user_id", user.id)
        .select("id, title, updated_at")
        .single();

      if (error) {
        console.error("[save-style-guide] Update error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to update guide" },
          { status: 500 }
        );
      }
      if (!guide) {
        return NextResponse.json(
          { error: "Guide not found or access denied" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, guide });
    }

    // Create new guide
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, guides_limit")
      .eq("id", user.id)
      .single();

    const tier = (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) ?? "starter";
    const limit = tier === "starter" ? 1 : tier === "pro" ? 5 : 99;

    const { count } = await supabase
      .from("style_guides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: "Guide limit reached. Upgrade to add more guides." },
        { status: 403 }
      );
    }

    const { data: guide, error } = await supabase
      .from("style_guides")
      .insert({
        user_id: user.id,
        title: title.slice(0, 255),
        brand_name: brand_name?.slice(0, 255) ?? null,
        content_md,
        plan_type: (plan_type === "style_guide" || !plan_type) ? "style_guide" : plan_type,
        brand_details: brand_details ?? null,
      })
      .select("id, title, created_at")
      .single();

    if (error) {
      console.error("[save-style-guide] Insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save guide" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, guide });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[save-style-guide] Error:", e);
    return NextResponse.json(
      { error: "Failed to save guide" },
      { status: 500 }
    );
  }
}
