#!/usr/bin/env node

/**
 * Test creating a Stripe checkout session
 * Run: node scripts/test-stripe-session.mjs [plan]
 * Example: node scripts/test-stripe-session.mjs pro
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
config({ path: join(__dirname, '..', '.env') });

const mode = process.env.STRIPE_MODE || 'live';
const isTest = mode === 'test';
const plan = process.argv[2] || 'pro';

const secretKey = isTest 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_SECRET_KEY;

const priceId = plan === 'pro'
  ? (isTest ? process.env.STRIPE_TEST_PRO_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID)
  : (isTest ? process.env.STRIPE_TEST_AGENCY_PRICE_ID : process.env.STRIPE_AGENCY_PRICE_ID);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aistyleguide.com';

console.log('🧪 Testing Stripe Checkout Session Creation\n');
console.log(`Mode: ${mode}`);
console.log(`Plan: ${plan}`);
console.log(`Price ID: ${priceId}`);
console.log(`Base URL: ${baseUrl}\n`);

if (!secretKey) {
  console.error('❌ Missing Stripe secret key');
  process.exit(1);
}

if (!priceId) {
  console.error(`❌ Missing ${plan} price ID`);
  process.exit(1);
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
});

async function testSession() {
  try {
    console.log('Creating checkout session...\n');
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?subscription=success`,
      cancel_url: `${baseUrl}/dashboard/billing?subscription=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        test: 'true',
        plan,
      },
    });

    console.log('✅ Session created successfully!\n');
    console.log(`Session ID: ${session.id}`);
    console.log(`Session URL: ${session.url}\n`);
    console.log('You can visit the URL above to test the checkout flow.\n');
    
  } catch (error) {
    console.error('❌ Error creating session:\n');
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`Type: ${error.type}`);
      console.error(`Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
      console.error(`Status Code: ${error.statusCode}`);
      
      if (error.code === 'resource_missing') {
        console.error('\n💡 The price ID might not exist. Check:');
        console.error('1. Go to https://dashboard.stripe.com/products');
        console.error('2. Find your product and verify the price ID');
        console.error('3. Make sure you\'re using the correct mode (test vs live)');
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

testSession();
