# Rebrand Plan: AI Style Guide → Tone of Voice App

**Target Domain:** toneofvoice.app
**Rationale:** Higher search volume, clearer positioning, less confusion than "style guide"
**Date:** 2026-02-12

---

## 📋 Executive Summary

This document outlines all changes needed to rebrand the app from "AI Style Guide" to "Tone of Voice App" under the new domain `toneofvoice.app`.

### Key Changes
- **Product Name**: AI Style Guide → **Tone of Voice App** (official name)
- **Domain**: aistyleguide.com → toneofvoice.app
- **Primary Value Prop**: "Generate style guides" → "Define your brand's tone of voice"
- **Terminology**: Remove emphasis on "style guide", more on "tone of voice guide"

---

## 🗣️ Terminology Mapping

### Core Product Terms
| Old Term | New Term | Notes |
|----------|----------|-------|
| AI Style Guide | Tone of Voice App | Product name |
| Style Guide | Tone of Voice Guide | What users create |
| Brand Voice | Tone of Voice | Unified terminology |
| Generate a style guide | Define your tone of voice | CTA language |
| AIStyleGuide | ToneOfVoiceApp | Brand name / code variations |
| aistyleguide.com | toneofvoice.app | Domain |
| @aistyleguide | @toneofvoiceapp | Social handles |
| support@aistyleguide.com | support@toneofvoice.app | Support email |

### Keep Unchanged
- **Voice Traits** (stays "Voice Traits", not "Tone Traits")
- **Writing Rules** (clear, actionable term)
- **Before/After Examples** (self-explanatory)
- **Brand Terms & Phrases** (standard term)

### Contextual Usage
- **Product name**: "Tone of Voice App" (use this consistently in UI, metadata, and marketing)
- **Short form**: "Tone of Voice" or "ToV" (only when space is tight)
- **What users get**: "tone of voice guide" (lowercase in body copy)
- **Page titles**: "Tone of Voice App | [Page Name]" or "[Action] | Tone of Voice App"

---

## 📁 File Changes by Category

### 1. Root Directory Files

#### package.json
```json
{
  "name": "toneofvoice-app",  // from "my-v0-project"
  "description": "Generate professional tone of voice guides"
}
```

#### README.md
- [ ] Update project title to "Tone of Voice App"
- [ ] Replace all "AI Style Guide" → "Tone of Voice"
- [ ] Update domain references
- [ ] Update description

#### PROJECT_CONTEXT.md
- [ ] Line 4: Update project name and description
- [ ] Line 11-17: Reframe "style guide" as "tone of voice guide"
- [ ] Throughout: Replace terminology per mapping above
- [ ] Keep technical accuracy (file names, code references)

#### CLAUDE.md
- [ ] Update references to product name
- [ ] Update email addresses (support@)
- [ ] Keep technical instructions intact

#### DESIGN_SYSTEM.md
- [ ] Update references to product name
- [ ] Update any examples or descriptions

---

### 2. App Directory (`/app`)

#### app/layout.tsx (CRITICAL - SEO & Metadata)
**Lines to update:**
- [ ] Line 14: `metadataBase` URL → `https://toneofvoice.app`
- [ ] Line 15: Title → `"Define your brand tone of voice | Tone of Voice"`
- [ ] Line 16: Description → `"Generate a professional tone of voice guide — traits, rules, and examples — tailored to your brand."`
- [ ] Lines 28-30: Authors/creator/publisher → `"Tone of Voice"`
- [ ] Line 32: OpenGraph title → match Line 15
- [ ] Line 33: OpenGraph description → match Line 16
- [ ] Line 34: OpenGraph URL → `https://toneofvoice.app`
- [ ] Line 35: siteName → `"Tone of Voice"`
- [ ] Lines 39-40: Update image URL → `https://toneofvoice.app/...`
- [ ] Lines 50-54: Twitter metadata (title, description, URLs)
- [ ] Line 53: Twitter handle → `@toneofvoiceapp`
- [ ] Line 87: Explicit title tag → match Line 15
- [ ] Line 88: Explicit description → match Line 16
- [ ] Lines 94-158: Schema.org JSON-LD updates:
  - WebPage schema: name, description, URL
  - WebSite schema: name, URL, description
  - SoftwareApplication schema: name, description, brand name, URL
  - FAQ schema: Update question #8 email → `support@toneofvoice.app`
  - HowTo schema: name, description, step text
  - Organization schema: name, URL, logo URL, email, sameAs URLs

**Key Schema Updates:**
```json
{
  "name": "Tone of Voice — Define your brand tone of voice",
  "description": "Generate a professional tone of voice guide...",
  "url": "https://toneofvoice.app",
  "brand": { "name": "Tone of Voice" }
}
```

#### Other App Routes
- [ ] `app/brand-details/page.tsx` - Page title, descriptions, copy
- [ ] `app/guide/page.tsx` - Metadata, page title
- [ ] `app/dashboard/page.tsx` - Page title, header text
- [ ] `app/dashboard/billing/page.tsx` - Copy, product descriptions
- [ ] `app/payment/success/page.tsx` - Success message copy
- [ ] `app/sign-in/page.tsx` - Page title
- [ ] `app/sign-up/page.tsx` - Page title

---

### 3. API Routes (`/app/api`)

#### api/save-style-guide/route.ts
- [ ] Consider renaming file → `save-guide/route.ts` (breaking change)
- [ ] Keep internal references for now, plan DB migration separately
- [ ] Update error messages if they reference "style guide"

#### api/load-style-guide/route.ts
- [ ] Consider renaming → `load-guide/route.ts`
- [ ] Update error messages

#### api/delete-style-guide/route.ts
- [ ] Consider renaming → `delete-guide/route.ts`

#### Other API Routes
- [ ] `api/export-pdf/route.ts` - Check error messages
- [ ] `api/extract-website/route.ts` - Check error messages
- [ ] `api/user-guide-limit/route.ts` - Error messages
- [ ] `api/create-checkout-session/route.ts` - Product descriptions
- [ ] `api/webhook/route.ts` - Logging messages

**Decision needed:** Rename API routes now or keep for backward compatibility?

---

### 4. Components (`/components`)

#### Component Files to Rename (Breaking Changes)
- [ ] `StyleGuideView.tsx` → `GuideView.tsx` or `ToneOfVoiceView.tsx`
- [ ] `StyleGuideEditor.tsx` → `GuideEditor.tsx` or `ToneOfVoiceEditor.tsx`
- [ ] `StyleGuideCover.tsx` → `GuideCover.tsx`
- [ ] `StyleGuideHeader.tsx` → `GuideHeader.tsx`
- [ ] `StyleGuideLayout.tsx` → `GuideLayout.tsx`
- [ ] `StyleGuideSidebar.tsx` → `GuideSidebar.tsx`
- [ ] `StyleGuideAccordion.tsx` → `GuideAccordion.tsx`

**Inside each component:**
- [ ] Update component names (function/export names)
- [ ] Update user-facing text/labels
- [ ] Update prop type names if they reference "StyleGuide"
- [ ] Update imports in parent components

#### Other Components
- [ ] `Footer.tsx` - Copyright, links, product name
- [ ] `ContentGate.tsx` - CTA copy ("upgrade to get full guide")
- [ ] `CreateGuideModal.tsx` - Modal title, descriptions
- [ ] `UpgradeNudgeModal.tsx` - Modal copy
- [ ] `UserMenu.tsx` - Menu labels if any
- [ ] `landing/*` components - All marketing copy
  - `hero-section.tsx`
  - `whats-included-section.tsx`
  - `final-cta-section.tsx`
  - `testimonials-section.tsx`
- [ ] `dashboard/GuideCard.tsx` - Card labels, tooltips

---

### 5. Library Files (`/lib`)

#### File Renames Needed
- [ ] `lib/style-guide-styles.ts` → `lib/guide-styles.ts`
  - Update all imports across codebase
  - Update token export names if they include "STYLE_GUIDE"

#### Files to Update
- [ ] `lib/openai.ts` - AI generation prompts, system messages
- [ ] `lib/template-processor.ts` - Template strings, error messages
- [ ] `lib/content-parser.ts` - Error messages, comments
- [ ] `lib/api-utils.ts` - Error messages (already checked, minimal)
- [ ] `lib/landing-data.tsx` - All marketing copy
- [ ] `lib/email-service.ts` - Email subject lines, body text

#### Hooks
- [ ] `hooks/use-style-guide.ts` → `hooks/use-guide.ts`
  - Update hook name and exports
  - Update all imports

---

### 6. Templates & Prompts

#### templates/style_guide_template.md
- [ ] Rename file → `tone_of_voice_template.md` or `guide_template.md`
- [ ] Update header/intro text
- [ ] Keep section structure (Voice Traits, Writing Rules, etc.)
- [ ] Update any meta-references to "style guide"

#### lib/prompts/
- [ ] `aistyleguide-style-guide.md` → Consider renaming
- [ ] Update AI generation prompts to reference "tone of voice guide"
- [ ] System messages: "You are generating a tone of voice guide..."

---

### 7. Scripts (`/scripts`)

- [ ] `test-style-guide-generation.mjs` → `test-guide-generation.mjs`
- [ ] `test-style-guide-system.mjs` → `test-guide-system.mjs`
- [ ] `generate-preview-pdf.mjs` - Update output filename
- [ ] `test-real-website.mjs` - Update console.log messages
- [ ] `create-stripe-products.mjs` - Product names, descriptions
- [ ] Any other scripts with "style guide" in output

---

### 8. Public Assets (`/public`)

#### Logo & Branding
- [ ] Delete or archive: `aistyleguide-logo.png`, `.jpeg`, `.svg`
- [ ] Create new: `toneofvoice-logo.png`, `.svg`
- [ ] Update favicon files (if they include old branding)
- [ ] `brand-voice-guidelines.png` → Check if needs update for new branding

#### Other Assets
- [ ] Any screenshots or demo images with old branding
- [ ] OG image for social sharing (new domain/branding)

---

### 9. Documentation (`/docs`)

- [ ] `RELEASE-NOTES-2026-02.md` - Add rebrand note
- [ ] `CHANGELOG-*.md` - Add rebrand entry
- [ ] `STRIPE-RESTRICTED-KEY-SETUP.md` - Update domain references
- [ ] Any other docs with product name or domain

---

### 10. Tests

- [ ] `lib/content-parser.test.ts` - Update test descriptions
- [ ] Any other test files with "style guide" in descriptions
- [ ] Update test data/fixtures if they include old terminology

---

## 🗄️ Database & Infrastructure

### Supabase Database

#### Table: `style_guides`
**Decision needed:** Rename table or keep for stability?

**Option B: Keep table name (stable, technical debt)**
- Keep `style_guides` as internal DB name
- Use "guides" or "tone_of_voice_guides" in UI/API layer
- Add comment to document the naming

**Recommendation:** Keep table name for now. Schedule migration later with proper backup/testing.

#### Columns to Consider
- `plan_type` - Contains "style_guide" enum value → keep or migrate?
- Any `_style_guide` suffixed columns?

### Supabase Storage Buckets
- [ ] Check if any buckets are named with "style-guide" or "aistyleguide"
- [ ] Create new buckets for new domain if needed

### Environment Variables
- [ ] `NEXT_PUBLIC_APP_URL` → Update to `https://toneofvoice.app`
- [ ] Verify no other env vars hardcode old domain

---

## 💳 Third-Party Services (programmatically if possible, tell user to do if not)

### Stripe
- [ ] Product names: "AI Style Guide - Starter" → "Tone of Voice - Starter"
- [ ] Product descriptions: Update to reference tone of voice
- [ ] Checkout page branding/logo
- [ ] Update webhook endpoint if domain changes
- [ ] Test checkout flow with new copy

### Vercel
- [ ] Project name (optional, cosmetic)
- [ ] Domain configuration: Add toneofvoice.app
- [ ] Environment variables: Update `NEXT_PUBLIC_APP_URL`
- [ ] Remove old domain or set up redirect
- [ ] Update Vercel project settings if needed

### PostHog
- [ ] Update project name/description
- [ ] Create new events if tracking "tone_of_voice_generated" vs "style_guide_generated"
- [ ] Update dashboards with new terminology

### Email Service (Resend)
- [ ] Update "From" name: "AI Style Guide" → "Tone of Voice"
- [ ] Update email domain: `support@aistyleguide.com` → `support@toneofvoice.app`
- [ ] Configure new domain in Resend
- [ ] Update email templates with new branding

### Analytics & Tracking
- [ ] Google Analytics (gtag.js) - Line 75 in layout.tsx
  - Create new property for new domain or update existing
- [ ] Google Ads tracking - Update if running campaigns
- [ ] Any retargeting pixels - Update domain

### Social Media
- [ ] Add to agency website / update on portfolio site

---

## 🎨 Code Architecture Changes

### Component Naming Convention

**Current pattern:**
```tsx
// Old
import StyleGuideView from '@/components/StyleGuideView'
import { useStyleGuide } from '@/hooks/use-style-guide'
import { PREVIEW_H1_STYLE } from '@/lib/style-guide-styles'
```

**New pattern:**
```tsx
// New
import GuideView from '@/components/GuideView'
import { useGuide } from '@/hooks/use-guide'
import { PREVIEW_H1_STYLE } from '@/lib/guide-styles'
```

### URL Structure

**Current:**
- `/brand-details` ✓ (keep)
- `/guide` ✓ (keep)
- `/dashboard` ✓ (keep)
- `/api/save-style-guide` → Consider `/api/save-guide`

**Decision:** Keep API routes for backward compatibility. Plan deprecation timeline if needed.

---

## 🚀 Implementation Checklist

### Phase 1: Pre-Launch Prep (Before Domain Switch)

#### Asset Creation
- [x] Design new logo for "Tone of Voice" - Group 22.svg in /public
- [x] Create PNG exports from Group 22.svg (16x16, 32x32, 48x48, 180x180, 192x192, 512x512)
- [x] Design new OG image for social sharing (1200x630) - og-image.png
- [x] Generate favicon files from chosen logo (favicon.ico, favicon-*.png, apple-touch-icon, android-chrome)


#### Domain & Infrastructure
- [x] Purchase toneofvoice.app domain
- [x] Configure DNS for toneofvoice.app
- [x] Set up SSL certificate
- [x] Configure Vercel domain settings


#### Third-Party Services Setup
- [x] Create Resend domain for support@toneofvoice.app
- [x] Verify email sending works
- [ ] Update Stripe products
- [ ] Test Stripe checkout with new copy
- [ ] Update PostHog project settings
- [ ] Set up Google Analytics for new domain (or update existing)

### Phase 2: Code Changes

#### Critical Path (Do First)
- [x] Update `app/layout.tsx` - All metadata and schema
- [x] Update `lib/landing-data.tsx` - Marketing copy
- [ ] Update landing page components - Hero, CTA, etc.
- [x] Update `package.json` - Name and description
- [x] Update `README.md` - Project documentation
- [x] Update `PROJECT_CONTEXT.md` - Architecture docs

#### Component Renames (Do Together)
- [x] Rename all `StyleGuide*.tsx` components
- [x] Update all component imports across codebase
- [x] Update component function names
- [x] Update prop type names
- [ ] Run `pnpm build` to catch broken imports

#### Library & Hooks
- [x] Rename `lib/style-guide-styles.ts` → `lib/guide-styles.ts`
- [x] Update all imports of guide-styles
- [x] Rename `hooks/use-style-guide.ts` → `hooks/use-guide.ts`
- [x] Update all hook imports

#### Templates & Content
- [ ] Rename template files (kept as-is for compatibility)
- [x] Update AI generation prompts in `lib/openai.ts`
- [ ] Update template processor
- [x] Update email templates

#### API Routes (Optional Renames)
- [x] Decide: Rename or keep API routes? ✅ KEEP for backward compatibility
- [x] If renaming: Update all API routes (N/A - keeping old routes)
- [x] Update client-side fetch calls (N/A - keeping old routes)
- [x] Add redirects for old API routes if needed (N/A - keeping old routes)

#### Tests & Scripts
- [x] delete all tests and scripts

### Phase 3: Testing & QA

#### Copy & Content Review
- [x] Audit all pages for "AI Style Guide" references
- [x] Check all error messages
- [x] Check all email templates
- [ ] Review landing page copy
- [ ] Review FAQ copy
- [x] Check footer copy


---

## ⚠️ Risks & Mitigation

### Risk: Broken Links & SEO Impact
**Mitigation:**
- Set up 301 redirects from old domain to new
- Submit new sitemap to Google Search Console
- Update all backlinks where possible
- Monitor search rankings for 3-6 months

### Risk: User Confusion
**Mitigation:**
- Add banner/notice on old domain: "We've moved to toneofvoice.app"
- Send email to existing users explaining rebrand
- Keep old domain redirect active for 6-12 months

### Risk: API Breaking Changes
**Mitigation:**
- Keep old API routes active as aliases
- Version API if needed (`/api/v1/...`)
- Plan deprecation timeline (6+ months notice)

### Risk: Database Migration Issues
**Mitigation:**
- Don't rename database tables in initial launch
- Plan separate migration with full testing
- Keep internal naming for stability

### Risk: Lost Branding/Recognition
**Mitigation:**
- "Tone of Voice" is more recognizable than "AI Style Guide"
- Higher search volume validates the change
- Clear value prop: "Define your tone of voice"

---

---

## 📝 Notes & Open Questions

### Decisions Needed
1. **API Routes**: Rename now or keep for compatibility?
   - **Recommendation:** Keep for now, plan v2 API later
2. **Database Tables**: Rename `style_guides` or keep?
   - **Recommendation:** Keep, too risky for launch
3. **Component Names**: `GuideView` vs `ToneOfVoiceView`?
   - **Recommendation:** `GuideView` (shorter, cleaner)
4. **URL Slugs**: `/tone-of-voice/[id]` or `/guide/[id]`?
   - **Recommendation:** Keep `/guide/[id]` (shorter, clean)

### Future Considerations
- International expansion: "Tone of voice" translates well
- Content marketing: Target "tone of voice" keywords
- Product positioning: B2B (agencies, marketing teams)
- Potential upsell: "Tone of Voice + Content Guidelines"

---

## 🔗 Reference Links

- [ ] Old domain: aistyleguide.com
- [ ] New domain: toneofvoice.app
- [ ] Staging URL: [TBD]
- [ ] Figma designs: [If applicable]
- [ ] Project tracking: [GitHub project/issues]

---

**Last Updated:** 2026-02-12
**Status:** Planning
**Owner:** Development Team

---

## Quick Command Reference

```bash
# Search for all "style guide" references
grep -r "style guide" --include="*.ts" --include="*.tsx" --include="*.md" .

# Search for "AI Style Guide" specifically
grep -r "AI Style Guide" --include="*.ts" --include="*.tsx" --include="*.md" .

# Find all StyleGuide components
find . -name "*StyleGuide*" -type f

# Test build after changes
pnpm build

# Run tests
pnpm test

# Check for broken imports
pnpm tsc --noEmit
```
