# Changelog – 2025-02-09

## Firecrawl Integration
- Added `lib/firecrawl-site-scraper.ts` for smart site scraping
- Scrapes homepage first; if content is thin (<2500 chars), maps URLs and scrapes 2–3 key subpages (about, company, product)
- `extract-website` API uses Firecrawl when `FIRECRAWL_API_KEY` is set, falls back to Cheerio otherwise
- Env: `FIRECRAWL_API_KEY` in `.env` and Vercel (production, preview, development)

## Style Guide Generation Improvements

### Rule phrasing
- **Front-load trait reason**: Each rule starts with the reason (trait it supports), then the rule. E.g. "Stay direct by using contractions…"
- **Lowercase trait in descriptor**: "Stay direct", "Keep refined" (not "Stay Direct")
- **Instructive verbs**: "Maintain a refined voice by…", "Project a supportive tone by…"

### Contact footer
- With user email: "Questions about [brand] content? Contact [email]."
- Fallback: "Questions? Contact the [brand] content team."
- Email from auth or `localStorage` (emailCapture)

### Sanitization & formatting
- `lib/rules-renderer.ts`: `sanitizeRuleText()` strips replacement chars, fixes quote spacing (`word"word` → `word "word`), normalizes time (`10: 00` → `10:00`)
- `lib/template-processor.ts`: Excluded `"` from space-stripping regex so sanitizer fixes persist
- Prompt: Emojis rule uses plain text only in examples (no emoji chars)

### Keywords
- API returns `keywords` as array; frontend stores as newline-separated in localStorage

## Preserve Preview When Generating Full Guide
- When `previewContent` exists in localStorage, full generation uses **merge mode**
- Keeps preview content (About, Audience, Content Guidelines, Brand Voice)
- Generates only Style Rules, Before/After, Word List and merges them in
- API: `renderFullGuideFromPreview()` in `lib/template-processor.ts`

## Granular Progress & Interstitial
- Payment success: 5-step progress (Preparing → Voice → Rules → Examples → Finalizing), progress bar, timer-based steps (~25s)
- Fade-in on completion
- Guide page: default view mode = preview; fade-in when content loads

## DB Save Best Practices
- After payment success generation: save to DB immediately when user is logged in; store `savedGuideId`, redirect to `/guide?guideId=X`
- Guide page: debounced (2s) auto-save when user edits and has `guideId`
- localStorage = creation flow; DB = source of truth when guide has ID

## Other
- Test script `FETCH_TIMEOUT_MS` increased to 4 min for full generation
- Test: `node scripts/test-real-website.mjs <url>`
