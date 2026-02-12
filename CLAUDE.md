# Claude Code Instructions for AI Style Guide

This file contains durable instructions for Claude Code when working on this codebase.

---

## 📋 Working Preferences

### Communication Style
- **Low verbosity**: Short, casual sentences. Plain English only.
- **Be honest**: Tell the truth. Admit when you don't know. Suggest solutions.
- **Don't just agree**: Challenge ideas if needed.

### Before You Start
- **Check PROJECT_CONTEXT.md first** before searching files
- **Check if files exist** before creating new ones
- **Read recent commits** to understand what changed

### Writing Style
- **UI/User-facing copy**: Never use em dash (—). Use hyphen (-) or rewrite.
- **Code comments**: Clear and short
- **Console messages**: Clear for debugging
- **Error messages**: Clear for users
- **Agent prompts**: Single lead sentence → short bullets (easy to scan/update)

### Build & Deploy
- **Don't auto-run builds** after fixes (unless big refactor)
- **Always use `pnpm`** not `npm`

### UI Priorities
Always prioritize clarity and usability over aesthetics.

---

## 📋 Context & Workflow

### Always Start Here
1. **Read `PROJECT_CONTEXT.md` first**: Current project state, architecture, key files
2. **Check recent commits**: What changed since last update
3. **Refer to docs**: `DESIGN_SYSTEM.md`, `/docs/RELEASE-NOTES-*.md`, `/docs/CHANGELOG-*.md`

### Project Overview
Generate professional brand voice and style guides using AI in under 5 minutes.

- Input: Website URL or brand description
- Output: Voice traits, writing rules, examples
- Tech: Next.js 15, React 19, TypeScript, Tailwind, Supabase, Stripe, OpenAI, Firecrawl

---

## 🎯 Key Principles

### Code Quality
- Use TypeScript strictly (explicit types over `any`)
- Handle errors gracefully with clear user messages
- Run `pnpm test` before committing
- Update tests when changing logic
- Never commit API keys
- Sanitize user inputs
- Validate on server side

### Architecture
- Prefer RSC (React Server Components) for data fetching
- Keep API routes thin (business logic in `/lib`)
- Supabase is source of truth (localStorage only for creation flow)
- Use tokens from `lib/style-guide-styles.ts`
- Update both code and `DESIGN_SYSTEM.md` when changing styles

### Design System
- Single source: `lib/style-guide-styles.ts` for typography
- Fonts: Playfair Display (headings), Geist Sans (body)
- Use Tailwind classes for spacing
- Document new patterns in `DESIGN_SYSTEM.md`

---

## 🔍 Token Usage Tracking

### Monitor Usage
- Run `npx ccusage@latest` to see daily token consumption
- Dollar figures show a la carte API pricing (not actual subscription cost)

### When Closing GitHub Issues
Track token usage for each feature:

1. Run `npx ccusage@latest`
2. Add comment to issue:
   ```markdown
   ## Token Usage Summary
   **Feature:** [Name]
   **Date Range:** [Dates]
   **Total Tokens:** [Amount]
   **Estimated Cost (a la carte):** $[Amount]
   ```
3. Close issue

**Example:**
```markdown
## Token Usage Summary
**Feature:** PDF Export with Puppeteer
**Date Range:** 2026-02-10 - 2026-02-11
**Total Tokens:** 127,450
**Estimated Cost (a la carte):** $3.82
```

---

## 🧪 Testing & Scripts

### Before Committing
```bash
# Run tests
pnpm test

# Test style guide generation
node scripts/test-real-website.mjs https://example.com

# Generate preview PDF
node scripts/generate-preview-pdf.mjs
```

### Token Usage Monitoring
```bash
# Check daily token consumption
npx ccusage@latest

# Use this when closing GitHub issues to log token expenditure
```

---

## 📁 File Organization

### When Adding New Features
- **API Routes**: `/app/api/[feature]/route.ts`
- **Business Logic**: `/lib/[feature].ts`
- **Components**: `/components/[feature]/` or `/components/[FeatureName].tsx`
- **Types**: Define in same file or `/types/[feature].ts` if shared
- **Tests**: Co-locate with implementation (e.g., `lib/feature.test.ts`)

### Documentation Updates
- **Architecture Changes**: Update `PROJECT_CONTEXT.md`
- **Design Changes**: Update `DESIGN_SYSTEM.md` + `lib/style-guide-styles.ts`
- **New Features**: Add to `/docs/RELEASE-NOTES-[YYYY-MM].md`
- **Breaking Changes**: Document in `/docs/CHANGELOG-[YYYY-MM-DD].md`

---

## 🚀 Deployment & Environment

### Environment Variables
Required for full functionality:
- `OPENAI_API_KEY`: OpenAI API
- `FIRECRAWL_API_KEY`: Firecrawl (optional, falls back to Cheerio)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase admin
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe
- `STRIPE_WEBHOOK_SECRET`: Stripe webhooks

### Deployment
- **Platform**: Vercel
- **Database**: Supabase (hosted)
- **Payments**: Stripe
- **CDN**: Vercel Edge Network

---

## 🔒 Security Best Practices

1. **Never commit secrets**: Use `.env` and `.env.local` (both gitignored)
2. **Validate inputs**: Server-side validation for all user inputs
3. **Sanitize outputs**: Escape HTML, sanitize markdown
4. **Rate limiting**: API routes should have rate limits (especially `/api/extract-website`)
5. **CORS**: API routes should validate origin
6. **Auth checks**: Always verify `userId` from Supabase before DB operations

---

## 📝 Commit Conventions

### Commit Messages
Use conventional commit format:
```
type(scope): subject

body (optional)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

**Example:**
```
feat(pdf-export): add Puppeteer primary with html2pdf fallback

- Server-side Puppeteer export at /api/export-pdf
- Client-side html2pdf.js fallback if API fails
- Exclude locked sections from PDF for free users

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🎨 Style Guide Generation Logic

### Key Flows
1. **Preview Flow** (Free users):
   - User enters URL/description → `/api/extract-website` (Firecrawl/Cheerio)
   - Generate preview sections (About, Audience, Voice, Guidelines)
   - Store in localStorage, redirect to `/guide`
   - Show gradient fade → locked sections → upgrade CTA

2. **Full Guide Flow** (Paid users):
   - After payment → generate full guide
   - **Merge mode**: If preview exists, preserve it, only generate locked sections
   - Save to DB with `guideId`
   - Redirect to `/guide?guideId=X`

3. **Edit Flow** (Paid users):
   - Load from DB by `guideId`
   - Auto-save on edit (2s debounce)
   - Switch between edit/preview modes

### Generation Prompts
- **Extraction**: `lib/prompts/extraction-prompt.ts` (extract brand info from website)
- **Guide Generation**: `lib/openai.ts` (generate traits, rules, examples)
- **Template**: `templates/style_guide_template.md` (base structure)

---

## 🐛 Debugging Tips

### Common Issues
1. **Auth errors**: Check Supabase URL/keys, verify RLS policies
2. **PDF export fails**: Check Puppeteer Chromium binary, fallback to html2pdf
3. **Firecrawl timeout**: Increase timeout or fallback to Cheerio
4. **Rate limits**: OpenAI API rate limits → queue requests or show error

### Logging
- **Server**: Use `console.log` in API routes (visible in Vercel logs)
- **Client**: Use browser console
- **Database**: Check Supabase logs for RLS policy violations

---

## 📚 Additional Resources

- **Design System**: `DESIGN_SYSTEM.md`
- **Project Context**: `PROJECT_CONTEXT.md`
- **Release Notes**: `/docs/RELEASE-NOTES-2026-02.md`
- **Changelog**: `/docs/CHANGELOG-2025-02-09.md`
- **Stripe Setup**: `/docs/STRIPE-RESTRICTED-KEY-SETUP.md`

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `pnpm dev` |
| Run tests | `pnpm test` |
| Build for production | `pnpm build` |
| Test guide generation | `node scripts/test-real-website.mjs <url>` |
| Check token usage | `npx ccusage@latest` |
| Generate preview PDF | `node scripts/generate-preview-pdf.mjs` |

---

**Last Updated:** 2026-02-12
**Maintained By:** Development team + Claude Code

When in doubt, read `PROJECT_CONTEXT.md` first, then refer back to this file for workflows and best practices.
