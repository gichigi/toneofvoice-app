import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Delete a style guide by ID. User must own it. */
export async function DELETE(req: Request) {
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

    // Verify user owns the guide before deleting
    const { data: guide, error: checkError } = await supabase
      .from("style_guides")
      .select("id")
      .eq("id", guideId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !guide) {
      return NextResponse.json(
        { error: "Guide not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the guide
    const { error: deleteError } = await supabase
      .from("style_guides")
      .delete()
      .eq("id", guideId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[delete-style-guide] Delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete guide" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[delete-style-guide] Error:", e);
    return NextResponse.json(
      { error: "Failed to delete guide" },
      { status: 500 }
    );
  }
}
