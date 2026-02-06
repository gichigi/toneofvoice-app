#!/usr/bin/env node

/**
 * Create Stripe products and prices for Pro and Team plans in test mode
 * Run: node scripts/create-stripe-products.mjs
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
config({ path: join(__dirname, '..', '.env') });

const mode = process.env.STRIPE_MODE || 'test';
const isTest = mode === 'test';

const secretKey = isTest 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error(`❌ Missing ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'}`);
  process.exit(1);
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
});

const plans = [
  {
    name: 'Pro',
    description: '5 guides, core rules, AI editing',
    amount: 2900, // $29/month
  },
  {
    name: 'Team',
    description: 'Unlimited guides, complete rules',
    amount: 7900, // $79/month
  },
];

async function createProducts() {
  console.log(`🔧 Creating Stripe products in ${mode} mode...\n`);

  for (const plan of plans) {
    try {
      console.log(`Creating ${plan.name} product...`);
      
      // Create product
      const product = await stripe.products.create({
        name: `AI Style Guide ${plan.name}`,
        description: plan.description,
        metadata: {
          plan: plan.name.toLowerCase(),
        },
      });

      console.log(`  ✅ Product created: ${product.id}`);

      // Create recurring price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan: plan.name.toLowerCase(),
        },
      });

      console.log(`  ✅ Price created: ${price.id} ($${plan.amount / 100}/month)`);
      console.log(`\n  Add to .env:`);
      console.log(`  ${isTest ? 'STRIPE_TEST' : 'STRIPE'}_${plan.name.toUpperCase()}_PRICE_ID=${price.id}\n`);

    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.error(`  ❌ Error:`, error);
      }
    }
  }

  console.log('✅ Done! Update your .env file with the price IDs above.');
}

createProducts();
