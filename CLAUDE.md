# Claude Code Instructions

This file contains durable working instructions for Claude Code on this codebase.
For product details, architecture, and flows see **`PROJECT.md`**.

---

## Before You Start

1. **Read `PROJECT.md`** - product spec, architecture, key files
2. **Check `PROJECT_CONTEXT.md`** - recent changes log
3. **Check `tasks/lessons.md`** - mistakes to avoid repeating
4. **Check recent commits** - what changed since last update
5. **Refer to docs**: `DESIGN_SYSTEM.md`, `/docs/RELEASE-NOTES-*.md`, `/docs/CHANGELOG-*.md`

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. Don't introduce new surface area.
- **Honest Uncertainty**: If you don't know, say so. Don't fabricate confidence.
- **Scope Discipline**: When a bug fix or feature expands unexpectedly, flag it - don't silently absorb it.

---

## Communication Style

- **CRITICAL: Low verbosity always** - Keep responses short and concise. Never write long explanations.
- **Plain English**: Short, casual sentences. No jargon.
- **Be direct**: Tell the truth. Admit when you don't know. Suggest solutions.
- **Be critical**: Evaluate approaches honestly. Push back when an implementation is weak, a flow is confusing, or a shortcut will cause problems later. Don't say what the user wants to hear.
- **Complete, then report** - deliver the finished thing with a short summary, not a running commentary.

---

## Agentic Working Style

### Planning
- Enter plan mode for ANY non-trivial task (3+ steps, touches 2+ files, or involves architectural decisions)
- Write detailed specs upfront - but if requirements are unclear, clarify before planning (see Decision Gateway)
- Write plan to `tasks/todo.md` with checkable items; mark complete as you go
- **Frame the full feature**, not the first step - scaffold and connect all files needed end-to-end
- If something goes sideways mid-execution: STOP, re-plan, surface the issue - don't keep pushing
- If re-planning reveals a deeper architectural problem, re-plan wins over autonomous bug fixing

### Execution
- **Don't stop mid-task** to ask permission or confirm small decisions - make reasonable choices and keep going
- **Use success criteria as your finish line**: if the task includes "Done when:", run until every criterion is met
- Go fix failing CI tests without being told how
- **If genuinely blocked** (missing secret, broken auth, external dependency) - state exactly what you'd do next, why you can't proceed, and what the user needs to do

### Verification
- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
- If you can't verify, say so explicitly - don't silently mark done

### Elegance
- For non-trivial changes (touching 2+ files or introducing new patterns): pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious, single-file fixes - don't over-engineer

### Bug Fixing
- When given a bug report with clear scope: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- **Exception:** if fixing the bug requires changing the approach significantly, surface this before proceeding

### Subagents
- Use subagents to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

---

## Decision Gateway

When uncertain whether to proceed or ask:

| Situation | Action |
|---|---|
| Requirements are ambiguous or contradictory | Ask ONE focused clarifying question, then proceed |
| You've hit an unexpected blocker mid-task | Stop, describe what you found, propose options |
| The task is clear but complex | Plan autonomously, proceed |
| You're >30% into a task and realize the approach is wrong | Stop immediately, re-plan, surface to user |
| A bug fix requires changing more than originally scoped | Flag the expanded scope before continuing |

**Default rule:** Attempt the task. Surface blockers early. Don't ask for permission to do the obvious.

If not given success criteria, state your assumed "Done when:" in one sentence and proceed.

---

## Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Review `tasks/lessons.md` at the start of each session

---

## Writing Style

- **UI/User-facing copy**: Never use em dash (—). Use hyphen (-) or rewrite.
- **Code comments**: Clear and short - explain the why, not the what
- **Error messages**: Clear for users
- **Agent prompts**: Single lead sentence → short bullets

---

## Build & Deploy

- **Always use `pnpm`** not `npm`
- **Don't auto-run builds** after fixes (unless big refactor)
- Run `pnpm test` before committing

### UI Priorities
Clarity and usability over aesthetics.

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
- Update tests when changing logic
- Never commit API keys
- Sanitize user inputs, validate server-side
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
| Task plans | `tasks/todo.md` |
| Lessons learned | `tasks/lessons.md` |

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

**Last Updated:** 2026-02-22
