# Claude Code Instructions

This file contains durable working instructions for Claude Code on this codebase.
For product details, architecture, and flows see **`PROJECT.md`**.

---

## Working Preferences

### Communication Style
- **CRITICAL: Low verbosity always** - Keep responses short and concise. Never write long explanations.
- **Plain English**: Short, casual sentences. No jargon.
- **Be direct**: Tell the truth. Admit when you don't know. Suggest solutions.
- **Challenge when needed**: Don't just agree. Push back if something's wrong.

### Before You Start
1. **Read `PROJECT.md`** - product spec, architecture, key files
2. **Check `PROJECT_CONTEXT.md`** - recent changes log
3. **Check recent commits** - what changed since last update
4. **Refer to docs**: `DESIGN_SYSTEM.md`, `/docs/RELEASE-NOTES-*.md`, `/docs/CHANGELOG-*.md`

### Writing Style
- **UI/User-facing copy**: Never use em dash (—). Use hyphen (-) or rewrite.
- **Code comments**: Clear and short
- **Error messages**: Clear for users
- **Agent prompts**: Single lead sentence → short bullets

### Build & Deploy
- **Always use `pnpm`** not `npm`
- **Don't auto-run builds** after fixes (unless big refactor)

### UI Priorities
Clarity and usability over aesthetics.

---

## Code Quality

- TypeScript strictly - explicit types over `any`
- Handle errors gracefully with clear user messages
- Run `pnpm test` before committing
- Update tests when changing logic
- Never commit API keys
- Sanitize user inputs, validate server-side

---

## Architecture Principles

- Prefer RSC (React Server Components) for data fetching
- Keep API routes thin - business logic in `/lib`
- Supabase is source of truth (localStorage only for creation flow)
- Use tokens from `lib/style-guide-styles.ts` for typography
- Update both code and `DESIGN_SYSTEM.md` when changing styles

---

## File Organization

| Type | Location |
|------|----------|
| API Routes | `/app/api/[feature]/route.ts` |
| Business Logic | `/lib/[feature].ts` |
| Components | `/components/[FeatureName].tsx` |
| Types | same file, or `/types/[feature].ts` if shared |
| Tests | co-located with implementation |

### Documentation Updates
- **Architecture changes**: Update `PROJECT_CONTEXT.md`
- **Design changes**: Update `DESIGN_SYSTEM.md` + `lib/style-guide-styles.ts`
- **New features**: Add to `/docs/RELEASE-NOTES-[YYYY-MM].md`
- **Breaking changes**: Document in `/docs/CHANGELOG-[YYYY-MM-DD].md`

---

## Security

1. Never commit secrets - use `.env.local` (gitignored)
2. Server-side validation for all user inputs
3. Escape HTML, sanitize markdown outputs
4. Rate limit API routes (especially `/api/extract-website`)
5. Always verify `userId` from Supabase before DB operations

---

## Commit Conventions

```
type(scope): subject

body (optional)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

---

## Token Usage Tracking

Run `npx ccusage@latest` to see daily consumption.

When closing GitHub issues, add a comment:
```markdown
## Token Usage Summary
**Feature:** [Name]
**Date Range:** [Dates]
**Total Tokens:** [Amount]
**Estimated Cost (a la carte):** $[Amount]
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `pnpm dev` |
| Run tests | `pnpm test` |
| Build | `pnpm build` |
| Check token usage | `npx ccusage@latest` |

---

**Last Updated:** 2026-02-18
