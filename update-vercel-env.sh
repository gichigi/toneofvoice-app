#!/bin/bash

# Update Vercel environment variables for rebrand
echo "🔄 Updating Vercel environment variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

# Update NEXT_PUBLIC_APP_URL
echo "📝 Updating NEXT_PUBLIC_APP_URL..."
vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_APP_URL preview --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_APP_URL development --yes 2>/dev/null || true

echo "https://toneofvoice.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo "https://toneofvoice.app" | vercel env add NEXT_PUBLIC_APP_URL preview
echo "http://localhost:3000" | vercel env add NEXT_PUBLIC_APP_URL development

echo "✅ Environment variables updated!"
echo ""
echo "📋 Next steps:"
echo "1. Add custom domain in Vercel dashboard: toneofvoice.app"
echo "2. Set up 301 redirect from aistyleguide.com → toneofvoice.app"
echo "3. Redeploy: vercel --prod"
echo ""
