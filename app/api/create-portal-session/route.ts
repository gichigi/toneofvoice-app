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

/** Create Stripe Customer Portal session. User must be logged in and have stripe_customer_id. */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${BASE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    if (e instanceof Error && (e.message?.includes("Stripe") || e.message?.includes("apiKey") || e.message?.includes("authenticator"))) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    console.error("[create-portal-session] Error:", e);
    return NextResponse.json(
      { error: "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
