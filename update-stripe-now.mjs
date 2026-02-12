#!/usr/bin/env node
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load .env file
config();

// Update Stripe products for rebrand
async function updateStripeProducts(mode) {
  const apiKey = mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY_UNRESTRICTED || process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.error(`❌ Missing Stripe ${mode} API key`);
    return false;
  }

  const stripe = new Stripe(apiKey);
  console.log(`\n🔄 Updating Stripe products in ${mode.toUpperCase()} mode...\n`);

  try {
    // Get all products
    const products = await stripe.products.list({ limit: 100 });

    // Define the updates (exact name or "Style Guide" in name)
    const updates = [
      { oldName: 'AI Style Guide - Starter', newName: 'Tone of Voice - Starter', newDescription: 'Free preview of your tone of voice guide with basic features' },
      { oldName: 'AI Style Guide - Pro', newName: 'Tone of Voice - Pro', newDescription: 'Full tone of voice guide with all features, AI assist, and unlimited exports' },
      { oldName: 'AI Style Guide - Agency', newName: 'Tone of Voice - Agency', newDescription: 'Unlimited tone of voice guides for agencies and teams' },
      { oldName: 'Pro', newName: 'Tone of Voice - Pro', newDescription: 'Full tone of voice guide with all features, AI assist, and unlimited exports' },
      { oldName: 'Agency', newName: 'Tone of Voice - Agency', newDescription: 'Unlimited tone of voice guides for agencies and teams' }
    ];

    let updated = 0;
    for (const product of products.data) {
      const update = updates.find(u =>
        product.name === u.oldName || (u.oldName.includes('Style Guide') && product.name.includes('Style Guide'))
      );

      if (update) {
        console.log(`📝 Updating: ${product.name} → ${update.newName}`);

        await stripe.products.update(product.id, {
          name: update.newName,
          description: update.newDescription
        });

        console.log(`✅ Updated: ${update.newName}`);
        updated++;
      }
    }

    console.log(`\n✨ ${mode.toUpperCase()} mode: ${updated} product(s) updated\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${mode} products:`, error.message);
    return false;
  }
}

// Run for both test and live modes
async function main() {
  console.log('🎨 Stripe Product Rebrand Updater\n');

  let success = true;

  // Update test mode
  console.log('📍 Test Mode');
  const testSuccess = await updateStripeProducts('test');
  success = success && testSuccess;

  // Update live mode
  console.log('📍 Live Mode');
  const liveSuccess = await updateStripeProducts('live');
  success = success && liveSuccess;

  if (success) {
    console.log('🎉 All done! Check your Stripe dashboard to verify.\n');
    console.log('Test: https://dashboard.stripe.com/test/products');
    console.log('Live: https://dashboard.stripe.com/products\n');
  } else {
    console.log('⚠️  Some updates failed. Check errors above.\n');
    process.exit(1);
  }
}

main().catch(console.error);
