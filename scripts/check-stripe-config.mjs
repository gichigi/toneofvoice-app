#!/usr/bin/env node

/**
 * Check Stripe configuration for subscription setup
 * Run: node scripts/check-stripe-config.mjs
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
config({ path: join(__dirname, '..', '.env') });

const mode = process.env.STRIPE_MODE || 'live';
const isTest = mode === 'test';

console.log('🔍 Checking Stripe Configuration\n');
console.log(`Mode: ${mode} (${isTest ? 'TEST' : 'LIVE'})\n`);

const checks = [];

// Check secret key
const secretKey = isTest 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_SECRET_KEY;

if (secretKey) {
  const prefix = isTest ? 'sk_test_' : 'sk_live_';
  if (secretKey.startsWith(prefix)) {
    checks.push({ name: 'Secret Key', status: '✅', value: `${secretKey.substring(0, 12)}...` });
  } else {
    checks.push({ name: 'Secret Key', status: '❌', value: 'Invalid format (should start with sk_test_ or sk_live_)' });
  }
} else {
  checks.push({ name: 'Secret Key', status: '❌', value: `Missing ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'}` });
}

// Check Pro price ID
const proPriceId = isTest
  ? process.env.STRIPE_TEST_PRO_PRICE_ID
  : process.env.STRIPE_PRO_PRICE_ID;

if (proPriceId) {
  checks.push({ name: 'Pro Price ID', status: '✅', value: proPriceId });
} else {
  checks.push({ name: 'Pro Price ID', status: '❌', value: `Missing ${isTest ? 'STRIPE_TEST_PRO_PRICE_ID' : 'STRIPE_PRO_PRICE_ID'}` });
}

// Check Team price ID
const teamPriceId = isTest
  ? process.env.STRIPE_TEST_TEAM_PRICE_ID
  : process.env.STRIPE_TEAM_PRICE_ID;

if (teamPriceId) {
  checks.push({ name: 'Team Price ID', status: '✅', value: teamPriceId });
} else {
  checks.push({ name: 'Team Price ID', status: '❌', value: `Missing ${isTest ? 'STRIPE_TEST_TEAM_PRICE_ID' : 'STRIPE_TEAM_PRICE_ID'}` });
}

// Check base URL
const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (baseUrl) {
  checks.push({ name: 'App URL', status: '✅', value: baseUrl });
} else {
  checks.push({ name: 'App URL', status: '⚠️', value: 'Missing (will default to https://aistyleguide.com)' });
}

// Display results
console.log('Configuration Status:');
console.log('─'.repeat(60));
checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(20)} ${check.value}`);
});
console.log('─'.repeat(60));

const hasErrors = checks.some(c => c.status === '❌');
const hasWarnings = checks.some(c => c.status === '⚠️');

if (hasErrors) {
  console.log('\n❌ Configuration errors found. Please fix before proceeding.\n');
  console.log('To create price IDs in Stripe:');
  console.log('1. Go to https://dashboard.stripe.com/products');
  console.log('2. Create a product for "Pro" plan');
  console.log('3. Add a recurring price (e.g., $29/month)');
  console.log('4. Copy the Price ID (starts with price_)');
  console.log('5. Repeat for "Team" plan');
  console.log(`6. Set ${isTest ? 'STRIPE_TEST_' : 'STRIPE_'}PRO_PRICE_ID and ${isTest ? 'STRIPE_TEST_' : 'STRIPE_'}TEAM_PRICE_ID in .env\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Configuration warnings found. Review recommended.\n');
  process.exit(0);
} else {
  console.log('\n✅ All configuration checks passed!\n');
  process.exit(0);
}
