# Release Notes — March 2026

## Analytics: PostHog → Mixpanel Migration (13 Mar)

Replaced PostHog with Mixpanel free plan (20M events/mo, 10k session replays/mo).

**What changed:**
- Removed `posthog-js`, `posthog-node`; added `mixpanel-browser`
- Created `MixpanelProvider` (client-only, skips dev) and `lib/mixpanel.ts` helper
- EU data residency: `api_host: "https://api-eu.mixpanel.com"`
- Autocapture, session replay (100%), and heatmaps enabled
- Removed PostHog `/ingest` reverse proxy rewrites from `next.config.js`
- Removed PostHog MCP server from Claude Code config
- Dropped server-side error tracking (Vercel logs suffice)

**Custom events tracked:**
- `Signed Up` - email + Google OAuth flows
- `Payment Completed` - after Stripe checkout
- `Guide Generated` - preview and full access flows
- `Guide Downloaded` - all formats (PDF, DOCX, MD, ZIP), both flows

**User identification:**
- `AuthProvider` calls `mixpanel.identify(userId)` + `people.set({ $email })` on every session restore
- 500ms delay to avoid race with MixpanelProvider init
- Sign-up page also identifies immediately on account creation

**Env vars:**
- Removed: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- Added: `NEXT_PUBLIC_MIXPANEL_TOKEN`

**Files deleted:** `lib/posthog.ts`, `lib/posthog-properties.ts`, `components/PostHogProvider.tsx`

---

## Guide Editor UX Fixes

- **Brand name save bug fixed** - H1 edits on the cover now persist via `onBrandNameChange` prop; auto-save picks up the updated name
- **AI toolbar discoverability** - fixed toolbar now shows "Ask AI" text label next to wand icon
- **Add section button** - removed `animate-pulse` animation; dashed border is sufficient visual cue
- **Next Steps banner** - dismissal now persists across downloads in the same session (ref-based, not state)
- **Download all formats** - new button in download dialog bundles PDF + Word + Markdown into a single `.zip` via JSZip

## Brand Favicon on Guide Cover

- `GuideCover` now shows the brand's favicon beside the domain URL (derived from Google favicon service)
- Only appears for URL-based guides; gracefully hidden on error
- Dashboard guide cards: fixed camelCase key bug (`websiteUrl` not `website_url`) so favicons now appear correctly
- Example page (`/example`): uses `https://apple.com` so Apple's favicon renders on the cover

## Example Page

- Back navigation changed from "← toneofvoice.app" to "← Home"
- Refactored into server component shell (`page.tsx`) + `ExampleGuideClient.tsx` for correct SSR metadata handling
