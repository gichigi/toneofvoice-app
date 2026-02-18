# Tone of Voice App - Project Context

**Last Updated:** 2026-02-18
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

### Rebrand Polish + AI Fixes (Feb 16-18, 2026)
- **Terminology**: All user-facing copy switched to "Tone of Voice" (removed "style guide" references throughout)
- **Wordmark**: `public/wordmark.svg` + `public/wordmark.png` added; `Logo.tsx` now renders wordmark in nav; nav links centered with absolute positioning on desktop
- **SEO**: `public/robots.txt` and `public/sitemap.xml` added; enhanced metadata (keywords, secure URLs) in `app/layout.tsx`
- **Style Rules prompt** (`lib/openai.ts`): Encourages varied sentence structures - "Use contractions to sound warm" vs "Multiple exclamation marks feel jarring" rather than formulaic patterns
- **AI Cmd+J** (`app/api/ai/command/route.ts`, `components/ui/ai-menu.tsx`): Fixed custom prompt submission (now includes mode, toolName, template); minimality constraint added to prevent over-editing; model upgraded to `gpt-5-mini`
- **Auth/checkout**: Generic error messages for sign-up and checkout; "Get Pro/Agency" copy; lock icons added to `GuideSidebar`; Vercel env var logging added
- **Cover**: Heading container widened (`max-w-3xl` → `max-w-5xl`) to prevent unnecessary wrapping
- **Audience Overview**: Label simplified from "Audience (Overview)" to "Overview"
- **`normalizeMarkdownContent()`** added in `lib/template-processor.ts` for audience section whitespace handling
- **New test scripts**: `scripts/test-style-rules.mjs`, `scripts/test-style-rules-detailed.mjs` - run against guide content to validate rule quality and variety
- **`scripts/test-audience-prompt.mjs`**: Expanded with `--url` and `--desc` flags, better output formatting
- **Interstitial**: Removed redundant paragraph + blue banner; consolidated loading state messaging; banner copy generalized to "Generate full guidelines"
- **"How to Use" section**: Bold headings converted to `###` markdown headings with proper spacing

### Audience Section & Error Handling (Feb 16, 2026)
- **Audience prompt overhaul** (`lib/openai.ts`): New prompt drives content-team-friendly output
  - Structure: **Overview** (1 sentence, who we write for – demographic/context, not "people who rely on us") → **Primary** (2 paragraphs, 2 sentences each: who + context, then goals/motivations/anxieties) → **Secondary** (1 paragraph, 2 sentences, brief only)
  - Rules: length and format only (no bullets, short paragraphs); no writing advice in audience section; works for B2B, B2C, any brand
  - Headings: `### Audience (Overview)`, `### Primary Audience`, `### Secondary Audience`
  - Test script: `scripts/test-audience-prompt.mjs` – run against URLs or descriptions (e.g. Tesco, Stripe, U of T) to validate prompt
- **Edge-case handling**
  - **api-utils**: `REQUEST_ABORTED`, `SESSION_EXPIRED`, `INVALID_RESPONSE`, `STORAGE_CORRUPT`; `isAbortError()` so callers skip toasts on navigation; extended retryable list
  - **Guide page**: Safe `JSON.parse` for localStorage; safe `res.json()` and 401 → sign-in/session messaging for load, expand, subscribe, save; skip toasts on AbortError
  - **BillingActions**: Safe `res.json()`, 401 → "Session expired"; skip toast on AbortError
  - **ErrorMessage**: Show "Try again" when `onRetry` is provided, not only when `error.canRetry`

### UI & Billing Polish (Feb 16, 2026)
- **Responsive**: Header mobile nav (Sheet + hamburger) when `showNavigation`; dashboard/billing `px-4 sm:px-6 lg:px-8`
- **Billing**: Removed current-plan banner; improved card and trust-strip spacing
- **UpgradeNudgeModal**: Generic "Guide limit reached" copy for starter and pro; "View plans" CTA
- **FAQs**: Shared `REFUND_ANSWER` / `SUPPORT_ANSWER` in `lib/landing-data.tsx`; aligned homepage + billing; no em dash
- **Word list order**: Preferred Terms → Spelling and Usage → Avoid Terms (last subsection)
- **Agency plan**: "Soon" label pill for roadmap features (`PricingFeature` type in landing-data)

### Guide Expand & Editor Fixes (Feb 2026)
- **Expand full guide**: Sections derived from `content` with `useMemo` so edit/preview update in same render as `setContent`; no stale editor after "Generate full guide"
- **Pro tier**: Guide limit 2 (not 5) across endpoints and UI
- **Plate.js AI**: Migrated to `@platejs/ai` with streaming, Cmd+J menu, `/api/ai/command`; subscription tier gating for free users; Accept/Discard/Try Again

### Performance Optimizations (Feb 13, 2026)
- **Reasoning effort reductions**: Eliminated reasoning tokens from Brand Expansion, Keywords, Trait Suggestions, Word List
- **Style Rules optimization**: Medium → Low reasoning (67s → 30s, -55% time, -57% cost)
- **Retry logic**: 3 → 2 attempts after fixing token limits
- **Results**: ~50% faster extraction, ~47% cheaper full guide generation
- **LangSmith integration**: Added MCP server for trace monitoring and optimization

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

### Enhanced Website Extraction (Updated Feb 13, 2026)
- **Unified Extraction Approach**: Firecrawl markdown → OpenAI for both website and description inputs
  - Website route: Firecrawl scrapes markdown, feeds to OpenAI with same prompt/model as description route
  - Description route: Direct OpenAI extraction with detailed brand prompt
  - Both use gpt-5.2 with reasoning_effort: "none" for consistency and speed
  - Removed Firecrawl JSON extraction (inconsistent quality, didn't follow detailed prompts)
- **Brand Description Quality**: 80-120 words, 2-3 paragraphs
  - Outcome-focused: what they enable, who they serve, what makes them unique
  - No corporate fluff, filler adjectives, or buzzwords
  - Every sentence carries real information
  - Tone: confident but not corporate, sounds like "yeah, that's us" not a press release
- **Keywords**: 25 keywords per guide
- **Smart Scraping**: If homepage thin (<2500 chars), maps and scrapes 2-3 key subpages
- **Fallback**: Cheerio when `FIRECRAWL_API_KEY` not set

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
- **Supabase Auth**: Enhanced error handling
- **Content Gate**: Gradient fade on preview → locked sections → upgrade CTA

### Design System
- **Typography Tokens**: Centralized in `lib/style-guide-styles.ts`
  - `PREVIEW_*` tokens for premium preview mode
  - `EDITOR_*` tokens for functional editor mode
- **Fonts**: Playfair Display (serif headings) + Geist Sans (body)
- **Surface Parity**: Edit ↔ Preview mapping documented in `DESIGN_SYSTEM.md`

### UX & Content Quality (Feb 2026)
- **Word list**: Two-column tables (Use | Instead of) for Preferred Terms and Spelling/Usage; order Preferred → Spelling → Avoid (see UI & Billing Polish)
- **Em dashes**: Banned in all generated content and UI; prompts and templates use hyphens/commas
- **Cover**: 60vh whitespace, larger title (text-7xl/9xl)
- **Audience**: Eyebrow "WHO YOU'RE WRITING FOR"; structure and prompt see "Audience Section & Error Handling" above
- **Brand description**: Extraction outputs 2-3 paragraphs, natural flow
- **Favicon**: Cascading fallback (Google → DuckDuckGo → favicon.ico) for guide cards
- **Input**: Brand name and keywords capitalize first letter on blur
- **Footer**: Reusable component on billing page

---

## 🗂️ Key Directories & Files

### `/app` : Next.js App Router
- **`/api`**: API routes
  - `extract-website/route.ts` : Website scraping + AI extraction (Firecrawl primary, Cheerio fallback)
  - `export-pdf/route.ts` : Server-side Puppeteer PDF generation
  - `export-pdf-fallback/route.ts` : Client-side html2pdf fallback
  - `user-guide-limit/route.ts` : Guide limit checking
  - `webhook/route.ts` : Stripe webhooks
  - `ai/command/route.ts` : Plate.js AI command (Cmd+J, streaming, auth-gated)
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
- **`dashboard/*`**: Dashboard components (Plate.js AI lives in editor kit, Cmd+J)

### `/lib`
- **`openai.ts`**: OpenAI API calls (guide generation, extraction prompts)
- **`template-processor.ts`**: Template rendering, merge logic
- **`firecrawl-site-scraper.ts`**: Firecrawl integration for smart scraping
- **`content-parser.ts`**: Parses guide sections (traits, rules, examples)
- **`rules-renderer.ts`**: Sanitizes and renders writing rules
- **`style-guide-styles.ts`**: Typography tokens (PREVIEW_*, EDITOR_*)
- **`supabase-*.ts`**: Supabase client utilities (browser, server, admin, middleware)
- **`api-utils.ts`**: Error mapping and user-facing messages (`getUserFriendlyError`, `createErrorDetails`, `isAbortError`); ERROR_MESSAGES for SESSION_EXPIRED, INVALID_RESPONSE, REQUEST_ABORTED, STORAGE_CORRUPT; retryable list
- **`pdf-chrome.ts`**: PDF generation utilities

### `/docs`
- **`RELEASE-NOTES-2026-02.md`**: February 2026 release notes (Firecrawl, preview preservation, PDF export)
- **`CHANGELOG-2025-02-09.md`**: Detailed changelog for 2025-02-09 (rules, keywords, DB save)
- **`STRIPE-RESTRICTED-KEY-SETUP.md`**: Stripe restricted key setup guide
- **`REBRAND-TONEOFVOICE.md`**: Complete rebrand plan for transitioning to toneofvoice.app domain

### Other Important Files
- **`DESIGN_SYSTEM.md`**: Complete design system documentation (fonts, colors, spacing, components)
- **`templates/style_guide_template.md`**: Base template for guide generation
- **`scripts/test-audience-prompt.mjs`**: Test audience prompt against extract-website output (URLs or brand descriptions); prints prompt + OpenAI output for validation
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

- `pnpm dev` : Start dev server (runs on port 3002)
- `pnpm test` : Run Vitest tests
- `pnpm test:watch` : Watch mode
- `node scripts/test-audience-prompt.mjs --baseUrl http://localhost:3002` : Test audience prompt (default: Tesco, Stripe, one description). Use `--url <url>` and/or `--desc "<text>"` for custom inputs. Requires `OPENAI_API_KEY` and running dev server.
- `curl -X POST http://localhost:3002/api/extract-website -H "Content-Type: application/json" -d '{"url":"https://stripe.com"}'` : Test extraction API
- `npx ccusage@latest` : Monitor Claude Code token usage

---

## 🚀 Subscription Tiers

1. **Free Preview**: 1 guide, preview content only (locked sections)
2. **Starter**: 10 guides/month, full access, all export formats
3. **Pro**: 2 guides, full access, all export formats
4. **Agency** (formerly Team): Unlimited guides, full access, all features

Guide limits enforced via `/api/user-guide-limit` and Supabase row-level security.

---

## 🎨 Brand Voice & Content

The app teaches users about:
- **Audience**: Who we write for (overview + primary with goals/motivations + secondary). Context only; no writing advice in this section.
- **Voice Traits**: 3-trait framework (what it means, what it doesn't mean)
- **Writing Rules**: 25 actionable rules (tone, grammar, format)
- **Before/After Examples**: Real-world applications (headlines, emails, etc.)
- **Word Lists**: Preferred terms → Spelling and Usage → Avoid Terms

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

- **README.md**: Outdated (mentions "core/complete" guides)
- **Old routes**: `/preview` and `/full-access` redirect to `/guide` (backward compat)

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
