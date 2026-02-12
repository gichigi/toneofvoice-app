#!/bin/bash

echo "🌐 Setting up Vercel domain for toneofvoice.app..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

# Add the new domain
echo "📝 Adding toneofvoice.app to Vercel project..."
vercel domains add toneofvoice.app

echo ""
echo "✅ Domain setup initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Vercel will show you DNS records to add"
echo "2. Add these records to your domain registrar (Namecheap/Cloudflare/etc)"
echo "3. Wait for DNS propagation (usually 5-15 minutes)"
echo "4. Run: vercel --prod"
echo ""
echo "🔗 Vercel will automatically use the redirects from vercel.json"
echo "   aistyleguide.com → toneofvoice.app (301)"
echo ""
