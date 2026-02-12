# Tone of Voice App - Project Context

**Last Updated:** 2026-02-13
**Project:** AI-powered tone of voice guide generator
**Stack:** Next.js 15, React 19, TypeScript, Tailwind, Supabase, Stripe, OpenAI, Firecrawl

---

## 🎯 What This Project Does

Tone of Voice App is a SaaS platform that generates professional tone of voice guides in under 5 minutes. Users input a website URL or brand description, and the app generates a comprehensive guide including:

- **3 Brand Voice Traits** with detailed definitions, do's, and don'ts
- **25 Writing Rules** covering tone, grammar, and formatting
- **10 Brand Terms & Phrases** for consistent vocabulary
- **5 Before/After Examples** showing voice applied to real content
- **Multiple Export Formats**: PDF (Puppeteer + html2pdf fallback), Word-compatible HTML, Markdown

---

## 📊 Recent Major Changes (Last 2 Weeks)

### Rebrand Planning (Feb 2026)
- **New Domain**: toneofvoice.app (from aistyleguide.com)
- **New Positioning**: "Define your tone of voice" vs "Generate style guides"
- **Rationale**: Higher search volume for "tone of voice", clearer value proposition
- **Status**: Planning phase (see `docs/REBRAND-TONEOFVOICE.md` for complete implementation plan)

### Subscription & Pricing Overhaul
- Renamed "Team" tier to "Agency" (unlimited guides)
- Added guide limits based on subscription tier
- Guide limit nudge modal (Relume-style) when approaching limit
- Enhanced billing UI with `BillingPlansGrid` component
- Hide dashboard link when unauthenticated

### Enhanced Website Extraction
- **Firecrawl Integration**: Smart site scraping via Firecrawl API
  - Scrapes homepage first; if thin content (<2500 chars), maps and scrapes 2-3 subpages
  - Falls back to Cheerio when `FIRECRAWL_API_KEY` not set
  - Returns richer JSON with `productsServices` field
- **Keywords**: Increased to 25 keywords per guide
- **Description**: Richer, more detailed brand descriptions

### PDF Export System
- **Primary Method**: Server-side Puppeteer with Chromium (`/api/export-pdf`)
  - Client sends serialized HTML + critical CSS
  - Returns PDF buffer with full Chrome rendering quality
- **Fallback**: Client-side html2pdf.js if API fails/timeouts
- **Locked Sections**: Excluded from PDF for free preview users
- **Styling**: `.pdf-rendering` class in globals.css for export-specific styles

### Guide Editor & UX
- **Single Unified Route**: `/guide` handles both preview (localStorage) and full-access (database) flows
- **Edit Mode**: Plate.js editor with full formatting toolkit
- **Preview Mode**: Read-only, polished output with premium typography
- **Auto-Save**: Debounced 2s save when user edits (if authenticated + has guideId)
- **Loading States**: Improved loading UX with granular progress (5 steps, ~25s each)
- **User Menu**: Added authentication menu component

### Auth & Content Gating
- **Rewritten Auth**: Enhanced Supabase auth with better error handling
- **Content Gate**: Gradient fade on preview → locked sections → upgrade CTA
- **Build Fixes**: Auth-related build errors resolved
- **Tests**: Content parser tests updated

### Design System
- **Typography Tokens**: Centralized in `lib/style-guide-styles.ts`
  - `PREVIEW_*` tokens for premium preview mode
  - `EDITOR_*` tokens for functional editor mode
- **Fonts**: Playfair Display (serif headings) + Geist Sans (body)
- **Surface Parity**: Edit ↔ Preview mapping documented in `DESIGN_SYSTEM.md`

### UX & Content Quality Improvements (Feb 2026)
- **Word List Redesign**: Preferred Terms and Spelling/Usage now display as two-column tables (Use | Instead of) instead of bullet lists for better scanability
- **Em Dash Removal**: Eliminated em dashes (—) from all generated content and UI copy
  - Added explicit restrictions to all AI generation prompts
  - Updated static templates to use hyphens, commas, or parentheses
  - Verified with real-world testing: 0 em dashes found ✓
- **Model Optimizations**: Strategic reasoning level adjustments for cost/speed
  - Downgraded to "low": Before/After, Audience, Content Guidelines, Word List, Keywords, Trait Suggestions
  - Kept "medium": Brand Voice Traits (complex), Style Rules (critical), Extraction (complex parsing)
  - Migrated gpt-4o-mini → gpt-5.2 low, gpt-4o → gpt-5.2 medium (4o deprecation)
  - Expected savings: 20-30% faster, ~40% cost reduction on downgraded tasks
- **AI Assist Toolbar** (Edit Mode):
  - Removed reasoning_effort parameter for fastest response
  - Temporary visual highlight for AI-changed text (subtle blue, fades after 3s)
  - Comprehensive error handling: timeouts, rate limits, service unavailability, input validation
  - Specific error messages for each failure type
  - Graceful degradation for non-critical features
- **Cover Page**: Reduced whitespace (60vh from 80vh), larger title (text-7xl/9xl), better visual balance
- **Audience Section**: Changed eyebrow from "AUDIENCE" to "WHO YOU'RE WRITING FOR", removed tone guidance from secondary audience
- **Brand Description**: Extraction prompts updated to generate 2-3 cohesive paragraphs with natural flow, not bullet-like sentences
- **Favicon Fallback**: Cascading fallback (Google → DuckDuckGo → direct favicon.ico) for dashboard guide cards
- **User Email in Questions**: Fixed bug where user email wasn't appearing in Questions section when upgrading from preview
- **Input Capitalization**: Brand name and keywords automatically capitalize first letter on blur
- **UI Refinements**: Removed regenerate button, lock icon pills, "one step away" text; renamed "Download Preview" to "Download"
- **Footer Component**: Created reusable Footer component, added to billing page

---

## 🗂️ Key Directories & Files

### `/app` : Next.js App Router
- **`/api`**: API routes
  - `extract-website/route.ts` : Website scraping + AI extraction (Firecrawl primary, Cheerio fallback)
  - `export-pdf/route.ts` : Server-side Puppeteer PDF generation
  - `export-pdf-fallback/route.ts` : Client-side html2pdf fallback
  - `user-guide-limit/route.ts` : Guide limit checking
  - `webhook/route.ts` : Stripe webhooks
  - `ai-assist/route.ts` : AI editing suggestions (rewrite, expand, shorten, etc.) with comprehensive error handling
- **`/brand-details`**: Initial input form (URL or description)
- **`/guide`**: Unified guide view/edit route (preview + full-access merged)
- **`/dashboard`**: User dashboard, guide list, billing
- **`/payment`**: Stripe checkout flow
- **`/auth`, `/sign-in`, `/sign-up`**: Supabase authentication

### `/components`
- **`StyleGuideView.tsx`**: Main guide component (edit/preview modes)
- **`StyleGuideEditor.tsx`**: Plate.js editor (edit mode)
- **`MarkdownRenderer.tsx`**: Polished preview renderer
- **`StyleGuideCover.tsx`**: Cover page with brand name, date, metadata
- **`ContentGate.tsx`**: Paywall component (fade + locked headers + CTA)
- **`UserMenu.tsx`**: Auth menu (sign out, billing)
- **`UpgradeNudgeModal.tsx`**: Guide limit nudge modal
- **`CreateGuideModal.tsx`**: New guide creation modal
- **`Footer.tsx`**: Reusable footer component
- **`editor/AIAssistToolbar.tsx`**: AI editing toolbar (rewrite, expand, shorten, etc.) with visual change highlighting
- **`dashboard/*`**: Dashboard components

### `/lib`
- **`openai.ts`**: OpenAI API calls (guide generation, extraction prompts)
- **`template-processor.ts`**: Template rendering, merge logic
- **`firecrawl-site-scraper.ts`**: Firecrawl integration for smart scraping
- **`content-parser.ts`**: Parses guide sections (traits, rules, examples)
- **`rules-renderer.ts`**: Sanitizes and renders writing rules
- **`style-guide-styles.ts`**: Typography tokens (PREVIEW_*, EDITOR_*)
- **`supabase-*.ts`**: Supabase client utilities (browser, server, admin, middleware)
- **`api-utils.ts`**: API helpers (extraction, guide limits)
- **`pdf-chrome.ts`**: PDF generation utilities

### `/docs`
- **`RELEASE-NOTES-2026-02.md`**: February 2026 release notes (Firecrawl, preview preservation, PDF export)
- **`CHANGELOG-2025-02-09.md`**: Detailed changelog for 2025-02-09 (rules, keywords, DB save)
- **`STRIPE-RESTRICTED-KEY-SETUP.md`**: Stripe restricted key setup guide
- **`REBRAND-TONEOFVOICE.md`**: Complete rebrand plan for transitioning to toneofvoice.app domain

### Other Important Files
- **`DESIGN_SYSTEM.md`**: Complete design system documentation (fonts, colors, spacing, components)
- **`templates/style_guide_template.md`**: Base template for guide generation
- **`README.md`**: Project README (outdated : mentions "core/complete" guides which are now deprecated)

---

## 🔑 Environment Variables

Required for full functionality:
- `OPENAI_API_KEY` : OpenAI API key
- `FIRECRAWL_API_KEY` : Firecrawl API key (optional, falls back to Cheerio)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Supabase auth
- `SUPABASE_SERVICE_ROLE_KEY` : Supabase admin operations
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : Stripe payments
- `STRIPE_WEBHOOK_SECRET` : Stripe webhook signing

---

## 🧪 Testing & Scripts

- `pnpm test` : Run Vitest tests
- `pnpm test:watch` : Watch mode
- `node scripts/test-real-website.mjs <url>` : Test full guide generation (timeout: 4 min)
- `node scripts/generate-preview-pdf.mjs` : Generate preview PDF
- `npx ccusage@latest` : Monitor Claude Code token usage

---

## 🚀 Subscription Tiers

1. **Free Preview**: 1 guide, preview content only (locked sections)
2. **Starter**: 10 guides/month, full access, all export formats
3. **Agency** (formerly Team): Unlimited guides, full access, all features

Guide limits enforced via `/api/user-guide-limit` and Supabase row-level security.

---

## 🎨 Brand Voice & Content

The app teaches users about:
- **Voice Traits**: 3-trait framework (what it means, what it doesn't mean)
- **Writing Rules**: 25 actionable rules (tone, grammar, format)
- **Before/After Examples**: Real-world applications (headlines, emails, etc.)
- **Word Lists**: Preferred terms and phrases for consistency

Style guide output is designed to be:
- **Usable by humans**: Share with team, print, reference
- **Usable by AI**: Markdown export for ChatGPT, Claude, custom prompts

---

## 🏗️ Architecture Notes

### Guide Generation Flow
1. **Brand Details** (`/brand-details`) → User enters URL or description
2. **Extraction** (`/api/extract-website`) → Firecrawl/Cheerio scrapes site → OpenAI extracts brand info
3. **Preview Generation** → AI generates preview sections (About, Audience, Voice, Guidelines)
4. **Payment** (`/payment`) → Stripe checkout
5. **Full Guide Generation** → AI generates locked sections (Style Rules, Examples, Word List)
6. **Merge Mode**: If preview exists, preserve it and only generate new sections
7. **Save to DB** → Guide saved with `guideId`, user redirected to `/guide?guideId=X`

### Storage Strategy
- **localStorage**: Creation flow (brand details, preview content)
- **Supabase DB**: Source of truth once guide has `guideId`
- **Auto-save**: 2s debounce on edits (if authenticated + has guideId)

### Typography System
- **Single Source of Truth**: `lib/style-guide-styles.ts`
- **Preview Tokens**: `PREVIEW_H1_*`, `PREVIEW_H2_*`, `PREVIEW_BODY_*`, etc.
- **Editor Tokens**: `EDITOR_H1_*`, `EDITOR_H2_*`, etc.
- **Font**: `SERIF_FONT_STYLE` applied via inline styles (Playfair Display)

### PDF Export Strategy
1. **Try Primary**: POST to `/api/export-pdf` (Puppeteer + Chromium)
2. **Fallback**: Client-side html2pdf.js if API fails
3. **Quality**: Chrome engine preferred; canvas-based fallback acceptable

---

## ⚠️ Known Issues & Deprecations

- **README.md**: Outdated (mentions "core/complete" guides, removed in recent overhaul)
- **Planning MD files**: None found (user mentioned them, but glob returned no results : may be in different location)
- **Old Routes**: `/preview` and `/full-access` redirect to `/guide` (backward compat)

---

## 📚 Documentation Cross-References

- **Typography/Spacing**: See `DESIGN_SYSTEM.md` + `lib/style-guide-styles.ts`
- **Subscription Flow**: See `STRIPE-RESTRICTED-KEY-SETUP.md`
- **Recent Changes**: See `RELEASE-NOTES-2026-02.md` + `CHANGELOG-2025-02-09.md`
- **API Logic**: See `lib/openai.ts`, `lib/template-processor.ts`, `lib/firecrawl-site-scraper.ts`

---

## 🎯 Quick Start for Claude

When asked to work on this codebase:

1. **Read this file first** instead of scanning entire filesystem
2. **Check recent commits** for what changed recently
3. **Refer to DESIGN_SYSTEM.md** for any styling questions
4. **Check lib/style-guide-styles.ts** for typography tokens
5. **Look at /docs** for detailed release notes and changelogs
6. **Run tests** before committing changes: `pnpm test`

This file should be updated whenever major architectural changes occur or new features are added.
