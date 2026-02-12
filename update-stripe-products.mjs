#!/usr/bin/env node
import Stripe from 'stripe';

// Update Stripe products for rebrand
async function updateStripeProducts(mode) {
  const apiKey = mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.error(`❌ Missing Stripe ${mode} API key`);
    process.exit(1);
  }

  const stripe = new Stripe(apiKey);
  console.log(`\n🔄 Updating Stripe products in ${mode.toUpperCase()} mode...\n`);

  try {
    // Get all products
    const products = await stripe.products.list({ limit: 100 });

    // Define the updates
    const updates = [
      {
        oldName: 'AI Style Guide - Starter',
        newName: 'Tone of Voice - Starter',
        newDescription: 'Free preview of your tone of voice guide with basic features'
      },
      {
        oldName: 'AI Style Guide - Pro',
        newName: 'Tone of Voice - Pro',
        newDescription: 'Full tone of voice guide with all features, AI assist, and unlimited exports'
      },
      {
        oldName: 'AI Style Guide - Agency',
        newName: 'Tone of Voice - Agency',
        newDescription: 'Unlimited tone of voice guides for agencies and teams'
      }
    ];

    for (const product of products.data) {
      const update = updates.find(u => product.name === u.oldName);

      if (update) {
        console.log(`📝 Updating: ${product.name} → ${update.newName}`);

        await stripe.products.update(product.id, {
          name: update.newName,
          description: update.newDescription
        });

        console.log(`✅ Updated: ${update.newName}`);
      }
    }

    console.log(`\n✨ ${mode.toUpperCase()} mode products updated successfully!\n`);
  } catch (error) {
    console.error(`❌ Error updating ${mode} products:`, error.message);
    process.exit(1);
  }
}

// Run for both test and live modes
async function main() {
  console.log('🎨 Stripe Product Rebrand Updater\n');

  // Update test mode
  if (process.env.STRIPE_TEST_SECRET_KEY) {
    await updateStripeProducts('test');
  } else {
    console.log('⚠️  Skipping test mode (no STRIPE_TEST_SECRET_KEY)');
  }

  // Update live mode
  if (process.env.STRIPE_SECRET_KEY) {
    await updateStripeProducts('live');
  } else {
    console.log('⚠️  Skipping live mode (no STRIPE_SECRET_KEY)');
  }

  console.log('🎉 All done! Check your Stripe dashboard to verify.\n');
}

main().catch(console.error);
