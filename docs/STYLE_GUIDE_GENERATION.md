# Style Guide Generation

## Overview

Style guides are generated in two modes: **preview** (free tier) and **full** (paid). Preview shows traits, audience, and content guidelines; full adds style rules, before/after examples, and word list.

## Key Flows

### Preview flow
- **Source:** `/api/preview` → `renderPreviewStyleGuide`
- **Content:** Audience, Content Guidelines, Brand Voice traits; Style Rules / Before After / Word List show placeholders
- **Storage:** `localStorage.previewContent`
- **Duration:** ~17–23 seconds

### Full guide flow (after payment)
- **Source:** `/api/generate-styleguide` → `renderStyleGuideTemplate` or `renderFullGuideFromPreview`
- **Merge mode:** When `previewContent` is passed, we preserve the user’s preview and only generate Style Rules, Before/After, Word List
- **Storage:** `localStorage.generatedStyleGuide`, then DB via `/api/save-style-guide`
- **Duration:** ~2–3 minutes

### Preserving preview content
When a user upgrades, we keep their preview. The API accepts `previewContent` and:
1. Uses it as the base document
2. Generates only the three locked sections
3. Replaces those sections via `replaceSectionInMarkdown`

**Files:** `lib/template-processor.ts` (`renderFullGuideFromPreview`), `app/api/generate-styleguide/route.ts`

## Progress & Interstitial

- **Payment success page:** 5-step progress bar, timer-based updates (~25s per step), fade-in on completion
- **Guide page:** Default view mode is preview; fade-in when content loads

## DB Save

- **After payment:** Guide is saved to DB immediately when the user is logged in
- **Edits:** Debounced 2s auto-save when `guideId` exists
- **Source of truth:** localStorage during creation; DB when `guideId` is present

## Rule Generation

- **Prompts:** `lib/openai.ts` – `generateStyleRules` uses front-loaded trait reasoning (e.g. “Stay direct by…”, “Keep refined by…”)
- **Trait casing:** Trait names are lowercase in descriptions (“Stay direct”, “Keep refined”)
- **Sanitization:** `lib/rules-renderer.ts` – strips orphan chars, fixes quote spacing, fixes `10: 00` → `10:00`
- **Template processor:** `formatMarkdownContent` does not strip spaces before `"` so sanitizer fixes are preserved

## Firecrawl Integration

- **Scraping:** `lib/firecrawl-site-scraper.ts` – scrapes homepage; if content is thin (&lt;2500 chars), maps and scrapes 2–3 key subpages
- **Env:** `FIRECRAWL_API_KEY` in `.env` and Vercel
- **Fallback:** Cheerio + fetch when Firecrawl key is missing
