# Tone of Voice App - Product Spec

**Last Updated:** 2026-02-18
**Domain:** toneofvoice.app (previously aistyleguide.com)
**Stack:** Next.js 15, React 19, TypeScript, Tailwind, Supabase, Stripe, OpenAI, Firecrawl

---

## What This Product Does

AI-powered SaaS that generates professional tone of voice guides in under 5 minutes.

**Input:** Website URL or brand description
**Output:** A comprehensive guide covering:
- 3 brand voice traits (definition, do's, don'ts)
- 25 writing rules (tone, grammar, formatting)
- 10 brand terms and phrases for consistent vocabulary
- 5 before/after examples showing voice applied to real content
- Export formats: PDF (Puppeteer + html2pdf fallback), Word-compatible HTML, Markdown

---

## Subscription Tiers

| Tier | Guides | Access |
|------|--------|--------|
| Free Preview | 1 | Preview sections only (locked sections behind paywall) |
| Starter | 10/month | Full access, all export formats |
| Pro | 2 | Full access, all export formats |
| Agency (formerly Team) | Unlimited | Full access, all features + roadmap |

Guide limits enforced via `/api/user-guide-limit` and Supabase row-level security.

---

## Key User Flows

### 1. Preview Flow (Free)
1. User enters URL or description at `/brand-details`
2. `/api/extract-website` scrapes site (Firecrawl primary, Cheerio fallback) → OpenAI extracts brand info
3. AI generates preview sections: About, Audience, Voice, Guidelines
4. Stored in localStorage, redirected to `/guide`
5. Gradient fade → locked sections → upgrade CTA

### 2. Full Guide Flow (Paid)
1. After Stripe payment → generate full guide
2. **Merge mode**: If preview exists, preserve it, only generate locked sections
3. Save to Supabase DB with `guideId`
4. Redirect to `/guide?guideId=X`

### 3. Edit Flow (Paid)
1. Load guide from DB by `guideId`
2. Plate.js editor with full formatting toolkit + AI (Cmd+J)
3. Auto-save on edit (2s debounce)
4. Switch between edit/preview modes

---

## Architecture

### Storage Strategy
- **localStorage**: Creation flow only (brand details, preview content)
- **Supabase DB**: Source of truth once guide has `guideId`
- **Auto-save**: 2s debounce on edits (authenticated + has guideId)

### Website Extraction
- Firecrawl scrapes page to markdown → OpenAI extracts brand info
- If homepage thin (<2500 chars), maps and scrapes 2-3 key subpages
- Fallback: Cheerio when `FIRECRAWL_API_KEY` not set
- Both URL and description routes use same OpenAI model/prompt for consistency

### PDF Export
1. **Primary**: POST to `/api/export-pdf` (Puppeteer + Chromium, server-side)
2. **Fallback**: Client-side html2pdf.js if API fails
3. Locked sections excluded from PDF for free users

### AI/LLM
- Extraction/generation: `gpt-5.2` with `reasoning_effort: "none"` (speed/cost)
- AI Cmd+J (Plate.js): `gpt-5-mini` with minimality constraint (don't over-edit)
- Generation prompts: `lib/openai.ts`
- Extraction prompt: `lib/prompts/extraction-prompt.ts`
- Template: `templates/style_guide_template.md`
- LangSmith for trace monitoring (optional, see `/docs/LANGSMITH-SETUP.md`)

---

## Guide Content Structure

### Audience Section
- **Overview**: 1 sentence, who we write for (demographic/context, not "people who rely on us")
- **Primary**: 2 paragraphs, 2 sentences each (who + context, then goals/motivations/anxieties)
- **Secondary**: 1 paragraph, 2 sentences, brief only
- No writing advice in this section. Works for B2B, B2C, any brand.
- Headings: `### Audience (Overview)`, `### Primary Audience`, `### Secondary Audience`

### Word Lists
Order: Preferred Terms → Spelling and Usage → Avoid Terms
Format: Two-column tables (Use | Instead of) for Preferred Terms and Spelling/Usage

### Content Rules
- No em dashes anywhere in generated content or UI copy - use hyphens or rewrite
- Brand description: 80-120 words, 2-3 paragraphs, outcome-focused, no buzzwords

---

## Key Directories & Files

### `/app`
**Key pages:**
- `/brand-details` - input form (URL or description)
- `/guide` - unified view/edit (preview + full-access)
- `/dashboard` - guide list, billing
- `/payment` - Stripe checkout
- `/auth`, `/sign-in`, `/sign-up` - Supabase auth

**API routes:**
- `extract-website` - Firecrawl/Cheerio scraping + OpenAI extraction
- `preview` - generate preview sections (About, Audience, Voice, Guidelines)
- `generate-styleguide` - full guide generation
- `expand-style-guide` - generate locked sections only (merge mode)
- `save-style-guide` - persist guide to DB
- `load-style-guide` - load guide by ID
- `delete-style-guide` - delete guide
- `export-pdf` - Puppeteer PDF (primary)
- `export-pdf-fallback` - html2pdf fallback
- `user-guide-limit` - guide limit check
- `user-subscription-tier` - get tier
- `verify-subscription` - post-payment verification
- `create-subscription-session` - Stripe checkout
- `create-checkout-session` - Stripe one-off checkout
- `create-portal-session` - Stripe billing portal
- `webhook` - Stripe webhooks
- `ai/command` - Plate.js AI (Cmd+J, streaming, `gpt-5-mini`, auth-gated)
- `ai-assist` - inline AI assist bar
- `rewrite-section` - rewrite a guide section
- `load-template` - load base template
- `blog/*` - blog generation and retrieval
- `capture-email` - email capture
- `admin/*` - admin login/logout

### `/components`
- `StyleGuideView.tsx` - main guide component (edit/preview modes)
- `StyleGuideEditor.tsx` - Plate.js editor
- `MarkdownRenderer.tsx` - polished preview renderer
- `StyleGuideCover.tsx` - cover page (brand name, date, metadata)
- `ContentGate.tsx` - paywall (fade + locked headers + CTA)
- `UpgradeNudgeModal.tsx` - guide limit nudge modal
- `UserMenu.tsx` - auth menu (sign out, billing)
- `Footer.tsx` - reusable footer

### `/lib`
- `openai.ts` - OpenAI API calls and generation prompts
- `template-processor.ts` - template rendering, merge logic
- `firecrawl-site-scraper.ts` - Firecrawl integration, smart scraping
- `content-parser.ts` - parses guide sections
- `style-guide-styles.ts` - typography tokens (`PREVIEW_*`, `EDITOR_*`)
- `api-utils.ts` - error mapping (`getUserFriendlyError`, `isAbortError`); error codes: `REQUEST_ABORTED`, `SESSION_EXPIRED`, `INVALID_RESPONSE`, `STORAGE_CORRUPT`
- `supabase-*.ts` - Supabase client utilities

### `/docs`
- `RELEASE-NOTES-2026-02.md` - February 2026 release notes
- `REBRAND-TONEOFVOICE.md` - rebrand plan (aistyleguide.com → toneofvoice.app)
- `STRIPE-RESTRICTED-KEY-SETUP.md` - Stripe restricted key setup
- `LANGSMITH-SETUP.md` - AI observability setup

### `/public`
- `wordmark.svg` / `wordmark.png` - brand wordmark for navigation
- `robots.txt`, `sitemap.xml` - SEO

### Other
- `DESIGN_SYSTEM.md` - fonts, colors, spacing, components
- `templates/style_guide_template.md` - base template for guide generation
- `PROJECT_CONTEXT.md` - recent changes log (update after major changes)
- `docs/STYLE_GUIDE_GENERATION.md` - generation flow detail (preview, full, merge, DB save)

---

## Design System

- **Typography source of truth**: `lib/style-guide-styles.ts`
- **Fonts**: Playfair Display (serif headings), Geist Sans (body)
- **Tokens**: `PREVIEW_*` for read-only mode, `EDITOR_*` for edit mode
- **Spacing**: Tailwind classes
- **Docs**: `DESIGN_SYSTEM.md`

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin ops |
| `STRIPE_SECRET_KEY` | Yes | Stripe payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe client |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhooks |
| `FIRECRAWL_API_KEY` | Optional | Falls back to Cheerio |
| `LANGSMITH_API_KEY` | Optional | AI observability |
| `LANGSMITH_TRACING` | Optional | AI observability |
| `LANGSMITH_PROJECT` | Optional | AI observability |

---

## Deployment

- **Platform**: Vercel
- **Database**: Supabase (hosted)
- **Payments**: Stripe
- **Dev server**: `pnpm dev` (port 3002)

---

## Debugging

| Issue | Fix |
|-------|-----|
| Auth errors | Check Supabase URL/keys, verify RLS policies |
| PDF export fails | Check Puppeteer Chromium binary, fallback to html2pdf |
| Firecrawl timeout | Increase timeout or fallback to Cheerio |
| Rate limits | OpenAI rate limits - queue requests or show error |

- **Server logs**: `console.log` in API routes (Vercel logs)
- **DB**: Check Supabase logs for RLS policy violations

---

## Testing & Scripts

```bash
pnpm test                                              # Run Vitest tests
pnpm test:watch                                        # Watch mode

# Test scripts (require OPENAI_API_KEY + running dev server)
node scripts/test-audience-prompt.mjs                 # Test audience prompt (defaults: Tesco, Stripe, description)
node scripts/test-audience-prompt.mjs --url <url>     # Custom URL
node scripts/test-audience-prompt.mjs --desc "<text>" # Custom description
node scripts/test-style-rules.mjs                     # Validate style rule quality
node scripts/test-style-rules-detailed.mjs            # Detailed style rule output and analysis

# Direct API testing
curl -X POST http://localhost:3002/api/extract-website \
  -H "Content-Type: application/json" \
  -d '{"url":"https://stripe.com"}'                   # Test extraction API

npx ccusage@latest                                    # Check Claude Code token usage
```

---

## Known Issues

- `README.md` is outdated (references deprecated "core/complete" guide types)
- Old routes `/preview` and `/full-access` redirect to `/guide` for backward compat
