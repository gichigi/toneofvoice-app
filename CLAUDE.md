# Claude Code Instructions

This file contains durable working instructions for Claude Code on this codebase.
For product details, architecture, and flows see **`PROJECT.md`**.

---

## Working Preferences

### Communication Style
- **CRITICAL: Low verbosity always** - Keep responses short and concise. Never write long explanations.
- **Plain English**: Short, casual sentences. No jargon.
- **Be direct**: Tell the truth. Admit when you don't know. Suggest solutions.
- **Be critical**: Evaluate approaches honestly. Push back when an implementation is weak, a flow is confusing, or a shortcut will cause problems later. Don't say what the user wants to hear.

### Before You Start
1. **Read `PROJECT.md`** - product spec, architecture, key files
2. **Check `PROJECT_CONTEXT.md`** - recent changes log
3. **Check recent commits** - what changed since last update
4. **Refer to docs**: `DESIGN_SYSTEM.md`, `/docs/RELEASE-NOTES-*.md`, `/docs/CHANGELOG-*.md`

### Clarifying Before Starting
- Only ask clarifying questions when there's **genuine high uncertainty** that would cause you to build the wrong thing - don't ask about details you can figure out
- If not given success criteria, state your assumed "Done when:" in one sentence and proceed
- Never ask clarifying questions mid-task - make reasonable decisions and keep going

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

## Agentic Working Style

- **Don't stop mid-task** to ask permission or confirm small decisions - make reasonable choices and keep going
- **Frame the full feature**, not the first step. When given a feature request, plan, scaffold, and connect all files needed to complete it end-to-end
- **Use success criteria as your finish line**: if the task includes "Done when:", run until every criterion is met before responding
- **If genuinely blocked** (missing secret, broken auth, external dependency) - state exactly what you'd do next, why you can't proceed, and what the user needs to do. Don't just hand the task back
- **Complete, then report** - deliver the finished thing with a short summary, not a running commentary

---

## Available CLIs & Tools

| Tool | How to use | Notes |
|------|-----------|-------|
| `pnpm` | `pnpm <cmd>` | Always use instead of npm |
| `supabase` | `npx supabase <cmd>` | Not globally installed |
| `vercel` | `vercel <cmd>` | Installed globally |
| `gh` | `gh <cmd>` | Installed globally |
| `stripe` | Not available | Use API directly or Stripe dashboard |

For Supabase schema/data operations: `npx supabase db ...` or query via the Supabase MCP server if configured.

### GitHub Token Auth Notes
- **Git operations**: use token in URL — `https://user:TOKEN@github.com/org/repo.git` (always works)
- **REST API**: use `Authorization: token <TOKEN>` — NOT `Bearer`. Using `Bearer` returns 401 even with a valid token.
- If API returns 401, check the header format first before assuming the token is invalid.

---

## Code Quality

- TypeScript strictly - explicit types over `any`
- Handle errors gracefully with clear user messages
- Run `pnpm test` before committing
- Update tests when changing logic
- Never commit API keys
- Sanitize user inputs, validate server-side
- **Always leave comments** when writing or refactoring code - explain the why, not the what
- Use documented APIs and official SDKs - don't roll your own when a library exists

---

## Architecture Principles

- Prefer RSC (React Server Components) for data fetching
- Keep API routes thin - business logic in `/lib`
- Supabase is source of truth (localStorage only for creation flow)
- Use tokens from `lib/style-guide-styles.ts` for typography
- Update both code and `DESIGN_SYSTEM.md` when changing styles

---

## Best Practices

Apply these standards by default - don't wait to be asked:

**UX & Product**
- User flows should be obvious - if a user has to think, simplify
- Information architecture: group related things, separate unrelated things, hierarchy first
- Error states, empty states, and loading states are part of the feature - not afterthoughts
- Microcopy matters: labels, placeholders, CTAs, and tooltips should be specific and action-oriented
- Confirm destructive actions; use optimistic UI for non-destructive ones

**UI & Responsive Design**
- Mobile-first. Test every layout at 375px, 768px, and 1280px
- Touch targets minimum 44px. Don't hide important actions on mobile
- Don't use fixed pixel widths for containers - use `max-w-*` with full width defaults

**Backend & Data**
- Validate at the boundary (API route), not just the client
- Keep DB queries out of components - go through `/lib` or API routes
- Never expose internal error details to the client
- Use Supabase RLS as the last line of defence, not the only one

**Auth & Security**
- Verify `userId` from Supabase session before any DB write
- Don't trust client-sent `userId` - always derive from session server-side
- Middleware handles route protection; individual routes handle data protection

**APIs & Integrations**
- Use official SDKs (Stripe.js, Supabase client) - don't hand-roll API calls
- Handle webhook events idempotently - assume they can arrive more than once
- Log enough context to debug production issues without logging PII

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

Commits are a permanent record - write them for someone reading the history in 6 months.

```
type(scope): subject

- What changed and why (not just what)
- Note any trade-offs or decisions made
- Reference issues or PRs if relevant

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

Always push to GitHub after completing a feature or fix so work is never lost locally.

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
