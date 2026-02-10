import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

type StripeMode = "test" | "live";
const mode = (process.env.STRIPE_MODE as StripeMode) || "live";
const STRIPE_SECRET_KEY =
  mode === "test"
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

/**
 * Fallback subscription verification.
 * Called after checkout redirect to ensure the profile is updated
 * even if the webhook hasn't been received yet (common in local dev).
 */
export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile already has an active subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_tier !== "starter" && profile?.subscription_tier !== "free" && profile?.subscription_status === "active") {
      // Already updated (webhook was fast enough)
      return NextResponse.json({
        subscription_tier: profile.subscription_tier,
        already_active: true,
      });
    }

    // Profile still shows free - check Stripe for recent checkout sessions
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    // Find recent completed checkout sessions for this user
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
    });

    // Find a completed subscription session for this user
    const matchingSession = sessions.data.find(
      (s) =>
        s.metadata?.user_id === user.id &&
        s.mode === "subscription" &&
        s.status === "complete" &&
        s.subscription
    );

    if (!matchingSession) {
      return NextResponse.json({
        subscription_tier: "starter",
        already_active: false,
      });
    }

    const plan = matchingSession.metadata?.plan as string;
    if (!["pro", "agency"].includes(plan)) {
      return NextResponse.json({
        subscription_tier: "starter",
        already_active: false,
      });
    }

    // Update the profile directly (webhook fallback)
    const subId = matchingSession.subscription as string;
    const customerId = matchingSession.customer as string;
    const guidesLimit = plan === "pro" ? 5 : 99;

    let currentPeriodEnd: string | null = null;
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
    }

    console.log("[verify-subscription] Updating profile (webhook fallback):", {
      userId: user.id,
      plan,
      subId,
    });

    const updatePayload = {
      subscription_tier: plan,
      subscription_status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subId,
      guides_limit: guidesLimit,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    // Try admin client first, fallback to user client if admin key is misconfigured
    let updateError: any = null;
    try {
      const adminResult = await getSupabaseAdmin()
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);
      updateError = adminResult.error;
    } catch (adminErr) {
      console.warn("[verify-subscription] Admin client failed, trying user client:", adminErr);
      const userResult = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);
      updateError = userResult.error;
    }

    if (updateError) {
      console.error("[verify-subscription] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription_tier: plan,
      already_active: false,
      updated: true,
    });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[verify-subscription] Error:", e);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
