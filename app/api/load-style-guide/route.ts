import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Load a style guide by ID. User must own it. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get("guideId");

    if (!guideId) {
      return NextResponse.json(
        { error: "Missing guideId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: guide, error } = await supabase
      .from("style_guides")
      .select("id, title, brand_name, content_md, plan_type, brand_details")
      .eq("id", guideId)
      .eq("user_id", user.id)
      .single();

    if (error || !guide) {
      return NextResponse.json(
        { error: "Guide not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(guide);
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[load-style-guide] Error:", e);
    return NextResponse.json(
      { error: "Failed to load guide" },
      { status: 500 }
    );
  }
}
