import { NextResponse } from "next/server"
import Stripe from "stripe"
import { emailService } from "@/lib/email-service"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// Pick the right Stripe secret key and webhook secret based on STRIPE_MODE
type StripeMode = 'test' | 'live';
const mode = (process.env.STRIPE_MODE as StripeMode) || 'live';
const STRIPE_SECRET_KEY =
  mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET =
  mode === 'test'
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;

function getStripe() {
  if (!STRIPE_SECRET_KEY) throw new Error("Stripe not configured");
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
}

// Store sent emails to prevent spam (in production, use a database)
const sentEmails = new Set<string>();

// Log webhook event details for debugging
function logWebhookDetails(event: any, error?: any) {
  const timestamp = new Date().toISOString()
  const eventId = event?.id || 'unknown'
  const eventType = event?.type || 'unknown'
  
  console.log(`[${timestamp}] Webhook ${eventId} (${eventType}): ${error ? 'FAILED' : 'SUCCESS'}`)
  
  if (error) {
    console.error(`[${timestamp}] Error details:`, error.message)
  }
}

// Handle redirects from www to non-www domain
function normalizeWebhookUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Check if this is the www version
    if (urlObj.hostname === 'www.toneofvoice.app') {
      urlObj.hostname = 'toneofvoice.app'
      console.log(`Normalized webhook URL from ${url} to ${urlObj.toString()}`)
      return urlObj.toString()
    }
    // Legacy domain support during transition
    if (urlObj.hostname === 'www.aistyleguide.com') {
      urlObj.hostname = 'toneofvoice.app'
      console.log(`Normalized legacy webhook URL from ${url} to ${urlObj.toString()}`)
      return urlObj.toString()
    }
    if (urlObj.hostname === 'aistyleguide.com') {
      urlObj.hostname = 'toneofvoice.app'
      console.log(`Normalized legacy webhook URL from ${url} to ${urlObj.toString()}`)
      return urlObj.toString()
    }
    return url
  } catch (e) {
    console.error('Failed to normalize URL:', e)
    return url
  }
}

// Handle subscription checkout completed — update profile
async function handleSubscriptionCheckout(stripeClient: Stripe, session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan as string;
    const subId = session.subscription as string | null;
    const customerId = session.customer as string | null;

    if (!userId || !["pro", "agency"].includes(plan)) {
      console.error("[webhook] Subscription checkout missing user_id or invalid plan");
      return;
    }

    const guidesLimit = plan === "pro" ? 5 : 99;
    let currentPeriodEnd: string | null = null;

    if (subId) {
      const sub = await stripeClient.subscriptions.retrieve(subId);
      currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
    }

    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        subscription_tier: plan,
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
        guides_limit: guidesLimit,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("subscription_tier, guides_limit");

    if (error) {
      console.error("[webhook] Failed to update profile for subscription:", error);
      return;
    }
    
    console.log("[webhook] Profile updated for subscription:", {
      userId,
      plan,
      subscription_tier: data?.[0]?.subscription_tier,
      guides_limit: data?.[0]?.guides_limit,
    });
  } catch (e) {
    console.error("[webhook] handleSubscriptionCheckout error:", e);
  }
}

// Handle successful one-time payment
async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing successful payment:', session.id);
    
    // Extract customer details for personal follow-up email
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const amount = session.amount_total || 0;
    const currency = session.currency || 'usd';
    
    if (!customerEmail) {
      console.log('No customer email found, skipping personal follow-up email');
      return;
    }
    
    // Check if we already sent a personal follow-up email for this session
    const emailKey = `thankyou_${session.id}`;
    if (sentEmails.has(emailKey)) {
      console.log('Personal follow-up email already sent for session:', session.id);
      return;
    }
    
    // Send personal follow-up email from Tahi
    console.log('🔄 Sending thank you email...')
    const emailResult = await emailService.sendThankYouEmail({
      customerEmail,
      customerName: customerName || undefined,
      sessionId: session.id,
      amount,
      currency,
    });
    
    if (emailResult.success) {
      sentEmails.add(emailKey);
      console.log('✅ Personal follow-up email sent successfully to:', customerEmail);
    } else {
      console.error('❌ Failed to send personal follow-up email:', emailResult.error);
    }
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Map Stripe price to plan tier — must respect STRIPE_MODE to match correct IDs
function priceIdToPlan(priceId: string | undefined): "pro" | "agency" | null {
  const proId = mode === "test" ? process.env.STRIPE_TEST_PRO_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  const agencyId = mode === "test" ? process.env.STRIPE_TEST_AGENCY_PRICE_ID : process.env.STRIPE_AGENCY_PRICE_ID;
  if (priceId === proId) return "pro";
  if (priceId === agencyId) return "agency";
  return null;
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subId = subscription.id;
    const status = subscription.status;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const plan = priceIdToPlan(priceId);
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    const guidesLimit = plan === "pro" ? 5 : 99;

    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        subscription_status: status === "active" || status === "trialing" ? "active" : "inactive",
        subscription_tier: plan || "starter",
        guides_limit: guidesLimit,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subId);

    if (error) console.error("[webhook] handleSubscriptionUpdated error:", error);
    else console.log("[webhook] Subscription updated:", subId);
  } catch (e) {
    console.error("[webhook] handleSubscriptionUpdated error:", e);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subId = subscription.id;
    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        subscription_tier: "starter",
        subscription_status: "cancelled",
        stripe_subscription_id: null,
        current_period_end: null,
        guides_limit: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subId);

    if (error) console.error("[webhook] handleSubscriptionDeleted error:", error);
    else console.log("[webhook] Subscription cancelled:", subId);
  } catch (e) {
    console.error("[webhook] handleSubscriptionDeleted error:", e);
  }
}

async function handleInvoicePaymentFailed(_invoice: Stripe.Invoice) {
  // Log for monitoring; plan: add grace period, downgrade after 3 days
  console.log("[webhook] Invoice payment failed:", _invoice.id);
}

export async function POST(request: Request) {
  // Get the original URL
  const originalUrl = request.url
  // Normalize the URL for logging purposes
  const normalizedUrl = normalizeWebhookUrl(originalUrl)
  
  // Get raw buffer for signature verification (critical for Stripe webhooks)
  const payload = await request.arrayBuffer()
  const payloadBuffer = Buffer.from(payload)
  const sig = request.headers.get("stripe-signature")
  
  console.log(`[${new Date().toISOString()}] Webhook received:`)
  console.log(`  Original URL: ${originalUrl}`)
  console.log(`  Normalized URL: ${normalizedUrl}`)

  if (!sig) {
    console.error("Missing stripe-signature header")
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    // Verify webhook signature using raw buffer
    const event = stripe.webhooks.constructEvent(
      payloadBuffer,
      sig,
      STRIPE_WEBHOOK_SECRET
    )

    // Log successful verification
    console.log(`Webhook verified: ${event.id} (${event.type})`)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "subscription") {
          await handleSubscriptionCheckout(stripe, session)
        } else {
          await handlePaymentSuccess(session)
        }
        break
      }

      case "checkout.session.async_payment_succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log successful processing
    logWebhookDetails(event)
    
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook error:", err.message)
    
    // Log webhook processing failure
    try {
      // Try to parse the event even if signature verification failed
      const event = JSON.parse(payloadBuffer.toString())
      logWebhookDetails(event, err)
    } catch (parseErr) {
      console.error("Could not parse webhook payload:", parseErr)
    }
    
    return NextResponse.json({ 
      error: "Webhook handler failed", 
      message: err.message,
      url: normalizedUrl
    }, { status: 400 })
  }
} 