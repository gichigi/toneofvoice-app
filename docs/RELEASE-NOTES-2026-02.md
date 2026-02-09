# Release Notes — February 2026

## Firecrawl Integration

- **Smart site scraping** via Firecrawl API for brand extraction
- Scrapes homepage first; if content is thin (<2500 chars), maps URLs and scrapes 2–3 key subpages (about, company, product)
- Avoids bot protection and provides richer markdown for extraction
- Falls back to Cheerio when `FIRECRAWL_API_KEY` is not set
- Config: `lib/firecrawl-site-scraper.ts`, `app/api/extract-website/route.ts`

## Style Guide Generation

- **Rule phrasing:** Descriptions front-load the trait reason (e.g. "Stay direct by…", "Keep refined by…")
- **Trait capitalization:** Trait names use lowercase when used as descriptors; only the verb is capitalized
- **Quote spacing:** Sanitizer adds missing space before opening quotes; `formatMarkdownContent` no longer strips it
- **Emoji rule:** Prompt instructs model not to use emoji characters in examples (avoids encoding artifacts)
- **Contact footer:** User email included when available; fallback for preview/unauthed
- **Keywords:** API returns array; limit increased to 10–20 depending on context

## Preview Preservation

- **Merge mode:** When generating the full guide after payment, preview content is preserved
- Only Style Rules, Before/After, and Word List are generated; About, Audience, Content Guidelines, and Brand Voice come from the preview
- `previewContent` passed from payment success and guide page when available

## Interstitial & Progress

- **Granular progress:** 5 steps with timer-based updates (~25s each)
- **Progress bar:** Visual bar + step message during generation
- **Fade-in:** Success state and guide page content use fade-in
- **Default view:** Guide page defaults to preview mode

## DB Save

- **Post-payment save:** Guide is saved to DB immediately after generation when user is logged in
- **Redirect:** After payment, redirect to `/guide?guideId=X` when save succeeds (load from DB)
- **Edit persistence:** Debounced 2s auto-save when user edits; DB is source of truth for guides with `guideId`

## Test Script

- Real-website test timeout increased to 4 min for full generation
- Run: `node scripts/test-real-website.mjs <url>`
