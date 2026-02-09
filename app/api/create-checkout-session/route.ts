import { NextResponse } from "next/server"
import Stripe from "stripe"

// Pick the right Stripe secret key based on STRIPE_MODE
type StripeMode = 'test' | 'live';
const mode = (process.env.STRIPE_MODE as StripeMode) || 'live';
const STRIPE_SECRET_KEY =
  mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
})

// Use the app URL from environment
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aistyleguide.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guideType, emailCaptureToken } = body

    // Log request info for debugging
    console.log(`Creating checkout session for guide type: ${guideType}`)
    console.log(`Using base URL: ${BASE_URL}`)

    // Validate guide type (unified product)
    if (guideType !== 'style_guide') {
      return NextResponse.json(
        { error: 'Invalid guide type' },
        { status: 400 }
      )
    }

    // Calculate expiration time (2 hours from now for abandoned cart recovery)
    const expiresAt = Math.floor(Date.now() / 1000) + (2 * 60 * 60); // 2 hours

    // Create checkout session with email capture and abandoned cart recovery
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Style Guide',
              description: 'Get your brand voice guidelines with 25 writing rules, before/after examples, and a word list. Editable in-app with PDF and Word export.',
            },
            unit_amount: 14900, // $149 (unified product)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&guide_type=${guideType}`,
      cancel_url: `${BASE_URL}/payment/cancel`,
      
      // Enable promotion codes for customer discounts
      allow_promotion_codes: true,
      
      // Abandoned cart recovery configuration
      expires_at: expiresAt,
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true, // Allow discount codes in recovery emails
        },
      },
      
      // Collect customer email even if they don't complete payment
      customer_email: undefined, // Let Stripe collect it during checkout
      
      // Add metadata to track guide type and email capture for webhooks
      metadata: {
        guide_type: guideType,
        created_at: new Date().toISOString(),
        email_capture_token: emailCaptureToken || '', // For abandoned cart email tracking
      },
    })

    console.log(`Checkout session created: ${session.id}`)
    console.log(`Session expires at: ${new Date(expiresAt * 1000).toISOString()}`)
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 