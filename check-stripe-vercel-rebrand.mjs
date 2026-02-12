#!/usr/bin/env node
/**
 * Check Stripe (test + live) and report product names for rebrand verification.
 * Read-only: lists products only, no updates.
 */
import Stripe from 'stripe';
import { config } from 'dotenv';

config();

async function listStripeProducts(mode) {
  const apiKey = mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY_UNRESTRICTED || process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.log(`${mode.toUpperCase()}: No API key found – skip or add to .env`);
    return { products: [], error: 'no key' };
  }

  const stripe = new Stripe(apiKey);
  try {
    const { data } = await stripe.products.list({ limit: 100, active: true });
    return { products: data };
  } catch (e) {
    return { products: [], error: e.message };
  }
}

async function main() {
  console.log('Stripe products (rebrand check)\n');

  const test = await listStripeProducts('test');
  console.log('Test mode:');
  if (test.error && test.error !== 'no key') {
    console.log('  Error:', test.error);
  } else if (test.products.length === 0) {
    console.log('  (none or no key)');
  } else {
    test.products.forEach((p) => {
      const bad = /style guide/i.test(p.name) ? '  ← still old name?' : '';
      console.log('  -', p.name, bad);
    });
  }

  console.log('\nLive mode:');
  const live = await listStripeProducts('live');
  if (live.error && live.error !== 'no key') {
    console.log('  Error:', live.error);
  } else if (live.products.length === 0) {
    console.log('  (none or no key)');
  } else {
    live.products.forEach((p) => {
      const bad = /style guide/i.test(p.name) ? '  ← still old name?' : '';
      console.log('  -', p.name, bad);
    });
  }

  console.log('\nVercel: run these yourself and confirm:');
  console.log('  vercel env ls production   # NEXT_PUBLIC_APP_URL should be https://toneofvoice.app');
  console.log('  vercel domains ls          # toneofvoice.app should appear after you add it');
  console.log('  vercel inspect --prod      # latest prod deployment should be successful');
}

main().catch(console.error);
