import { createClient, MissingSupabaseConfigError } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

type StripeMode = "test" | "live";
const mode = (process.env.STRIPE_MODE as StripeMode) || "live";
const STRIPE_SECRET_KEY =
  mode === "test"
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!STRIPE_SECRET_KEY) throw new Error("Stripe not configured");
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aistyleguide.com";
const PRO_PRICE_ID =
  mode === "test"
    ? process.env.STRIPE_TEST_PRO_PRICE_ID
    : process.env.STRIPE_PRO_PRICE_ID;
const TEAM_PRICE_ID =
  mode === "test"
    ? process.env.STRIPE_TEST_TEAM_PRICE_ID
    : process.env.STRIPE_TEAM_PRICE_ID;

/** Create Stripe Checkout session for subscription (Pro or Team). User must be logged in. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as string;

    if (!["pro", "team"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'pro' or 'team'." },
        { status: 400 }
      );
    }

    const priceId = plan === "pro" ? PRO_PRICE_ID : TEAM_PRICE_ID;
    if (!priceId) {
      console.error(`Missing STRIPE_${plan.toUpperCase()}_PRICE_ID env var`);
      return NextResponse.json(
        { error: "Subscription not configured" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/dashboard?subscription=success`,
      cancel_url: `${BASE_URL}/dashboard/billing?subscription=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        plan,
      },
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    if (e instanceof Error && (e.message?.includes("Stripe") || e.message?.includes("apiKey"))) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[create-subscription-session] Error:", e);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
