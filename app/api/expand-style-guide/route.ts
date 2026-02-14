import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { renderFullGuideFromPreview } from "@/lib/template-processor"

/** Expand a starter/preview guide: generate Style Rules, Before/After, Word List and merge into existing content. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const guideId = body?.guideId
    if (!guideId || typeof guideId !== "string") {
      return NextResponse.json({ error: "Missing guideId" }, { status: 400 })
    }

    const { data: guide, error: loadError } = await supabase
      .from("style_guides")
      .select("id, content_md, brand_details, brand_name, user_id")
      .eq("id", guideId)
      .eq("user_id", user.id)
      .single()

    if (loadError || !guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single()

    const tier = (profile?.subscription_tier === "free" ? "starter" : profile?.subscription_tier) ?? "starter"
    if (tier !== "pro" && tier !== "agency") {
      return NextResponse.json({ error: "Pro or Agency subscription required to expand guide" }, { status: 403 })
    }

    const content = guide.content_md || ""
    const hasPlaceholders =
      /_Unlock to see Style Rules\._/i.test(content) ||
      /_Unlock to see Before\/After examples\._/i.test(content) ||
      /_Unlock to see Word List\._/i.test(content)

    if (!hasPlaceholders) {
      return NextResponse.json({ error: "Guide already has full content" }, { status: 400 })
    }

    let brandDetails = (guide.brand_details as Record<string, unknown>) || { name: guide.brand_name || "Brand" }
    const desc =
      brandDetails.brandDetailsDescription ||
      brandDetails.brandDetailsText ||
      (brandDetails.description as string)
    if (desc) {
      brandDetails = { ...brandDetails, brandDetailsDescription: desc }
    }
    if (!brandDetails.brandDetailsDescription) {
      return NextResponse.json(
        { error: "Brand details missing description; cannot generate sections" },
        { status: 400 }
      )
    }

    const userEmail = user.email ?? null
    const expandedContent = await renderFullGuideFromPreview({
      previewContent: content,
      brandDetails,
      userEmail,
    })

    const { error: updateError } = await supabase
      .from("style_guides")
      .update({
        content_md: expandedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guideId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[expand-style-guide] Update error:", updateError)
      return NextResponse.json({ error: "Failed to save expanded guide" }, { status: 500 })
    }

    return NextResponse.json({ success: true, content: expandedContent })
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
    console.error("[expand-style-guide] Error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to expand guide" },
      { status: 500 }
    )
  }
}
