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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://toneofvoice.app";
const PRO_PRICE_ID =
  mode === "test"
    ? process.env.STRIPE_TEST_PRO_PRICE_ID
    : process.env.STRIPE_PRO_PRICE_ID;
const AGENCY_PRICE_ID =
  mode === "test"
    ? process.env.STRIPE_TEST_AGENCY_PRICE_ID
    : process.env.STRIPE_AGENCY_PRICE_ID;

/** Create Stripe Checkout session for subscription (Pro or Agency). User must be logged in. */
export async function POST(req: Request) {
  try {
    // Check Stripe configuration first
    if (!STRIPE_SECRET_KEY) {
      console.error("[create-subscription-session] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Payment service not configured. Please check Stripe API key." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as string;

    if (!["pro", "agency"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'pro' or 'agency'." },
        { status: 400 }
      );
    }

    const priceId = plan === "pro" ? PRO_PRICE_ID : AGENCY_PRICE_ID;
    if (!priceId) {
      const envVarName = mode === "test" 
        ? `STRIPE_TEST_${plan.toUpperCase()}_PRICE_ID` 
        : `STRIPE_${plan.toUpperCase()}_PRICE_ID`;
      console.error(`[create-subscription-session] Missing ${envVarName} env var`);
      return NextResponse.json(
        { error: `Subscription not configured. Missing ${envVarName}.` },
        { status: 500 }
      );
    }

    console.log(`[create-subscription-session] Creating session for plan: ${plan}, priceId: ${priceId}, mode: ${mode}`);

    const stripe = getStripe();
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

    console.log(`[create-subscription-session] Session created: ${session.id}`);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    
    // Handle Stripe errors specifically
    if (e instanceof Stripe.errors.StripeError) {
      console.error(`[create-subscription-session] Stripe error:`, {
        type: e.type,
        code: e.code,
        message: e.message,
        statusCode: e.statusCode,
      });
      return NextResponse.json(
        { 
          error: `Stripe error: ${e.message}`,
          code: e.code,
          type: e.type,
        },
        { status: e.statusCode || 500 }
      );
    }
    
    if (e instanceof Error) {
      console.error("[create-subscription-session] Error:", {
        message: e.message,
        stack: e.stack,
        name: e.name,
      });
      
      // Check for common configuration errors
      if (e.message?.includes("apiKey") || e.message?.includes("Stripe")) {
        return NextResponse.json(
          { error: "Payment service configuration error. Please check Stripe API key." },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: e.message || "Failed to create checkout session" },
        { status: 500 }
      );
    }
    
    console.error("[create-subscription-session] Unknown error:", e);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
