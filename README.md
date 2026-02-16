# Tone of Voice App

Generate professional brand voice and style guides in under 5 minutes using AI.

## Features

- **AI-Powered Tone of Voice Guides**: Complete tone of voice guides from a website URL or description
- **Smart Website Extraction**: Firecrawl integration for intelligent brand analysis
- **Subscription Tiers**: Free preview (1 guide), Starter (10/month), Agency (unlimited)
- **Multiple Export Formats**: PDF (Puppeteer + fallback), Word-compatible HTML, and Markdown
- **Comprehensive Content**:
  - 3 Brand Voice Traits with detailed do's and don'ts
  - 25 Writing Rules covering tone, grammar, and formatting
  - 10 Brand Terms & Phrases for consistency
  - 5 Before/After Examples showing voice in action
- **Professional Design System**: Premium typography with Playfair Display serif headings

## Technologies

- Next.js 15.2
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- OpenAI API
- Firecrawl for smart website scraping
- Supabase (Auth + Database)
- Stripe for payments
- Puppeteer + html2pdf.js for PDF generation
- Plate.js for rich text editing

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/toneofvoice-app.git
   cd toneofvoice-app
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

   See `CLAUDE.md` for full environment variable documentation.

4. Start the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## Usage

1. **Enter brand details**: Paste your website URL or write a short brand description
2. **Generate preview**: Get a free preview with brand voice, audience, and guidelines
3. **Upgrade for full guide**: Subscribe to unlock style rules, examples, and word lists
4. **Edit & Export**: Customize your guide in the editor, then export as PDF, Word, or Markdown

## Documentation

- **`PROJECT_CONTEXT.md`**: Current project state, architecture, and recent changes (read this first!)
- **`CLAUDE.md`**: Development workflow, token usage tracking, and best practices
- **`DESIGN_SYSTEM.md`**: Typography, colors, spacing, and component patterns
- **`/docs`**: Release notes, changelogs, and setup guides

## Testing

```bash
# Run tests
pnpm test

# Test guide generation with a real website
node scripts/test-real-website.mjs https://example.com

# Generate preview PDF
node scripts/generate-preview-pdf.mjs

# Monitor Claude Code token usage
npx ccusage@latest
```

## License

MIT

## Acknowledgements

- OpenAI for AI capabilities
- Vercel for hosting and deployment
- Various open-source libraries that made this project possible 