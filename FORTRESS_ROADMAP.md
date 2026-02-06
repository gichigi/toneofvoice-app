# Fortress v1 Roadmap (Bible)

Goal: Ship a focused v1 that proves value, converts to Pro, and sets clean foundations for growth.

Stack guardrails: Supabase Auth (EU), Stripe Checkout + Portal, PostHog, Next.js 15+, single LLM refine for audit, Plate editor MVP.

Entitlements: Free (1 guide, 5 audit issues, MD export), Pro (unlimited guides, full audit, PDF/Word/HTML).

Tabs: Guidelines, Audit. Account page: name/email/password, Manage Billing, delete account (if required in EU).

---

## Phase 0 — Repo and config
- Fork AISG to Fortress without altering current production
- Create env scaffolds (local, prod) with EU data region for Supabase
- Add feature flags for audit, editor, exports, locale toggle
- Wire PostHog project keys (local/prod) and basic funnel events

## Phase 1 — Auth foundation
- Add Supabase Auth (email link + Google) with EU region
- Create user profile row on first login (plan: free)
- Protect app routes; redirect unauthenticated to signin or extractor

## Phase 2 — Plans and billing
- Create Stripe Pro monthly price and link to Customer Portal
- Implement upgrade/downgrade via Checkout/Portal
- Sync plan status via webhook; update profile.plan and period end

## Phase 3 — Guidelines model (no projects in v1)
- Define “guideline” entity per user (no project layer yet)
- Create CRUD: create from extractor, read latest, duplicate, delete
- Enforce free/pro limits at API and UI

## Phase 4 — Extractor + Audit v1
- Crawl homepage + up to 5 internal links (3s timeout, same domain)
- Run heuristics (meta, H1 count, brand casing, long sentences, exclamations)
- Run single LLM refine pass to group/dedupe and add clear recommendations (prompt supplied)
- Return audit payload with links/snippets; store alongside guideline
- Gate free: show up to 5 issues; Pro: show full list
- On upgrade: unlock saved full audit instantly; expose “Re‑run audit” (Pro)

## Phase 5 — Guideline generation and gating
- Reuse existing generation pipeline; pass locale (US/UK) into prompts
- Persist guideline content on create; maintain last_modified timestamp
- Gate exports and advanced sections per plan

## Phase 6 — Editor MVP (Plate)
- Integrate Plate editor for inline edits on guideline content
- Add section‑level “Regenerate” actions (traits, rules, before/after, summary, keywords)
- Provide undo/redo and autosave; show save status in UI

## Phase 7 — Dashboard and Account
- Dashboard: list user guidelines with quick actions (Open, Duplicate, Delete)
- Audit tab: list issues with page links, severity, recommendations, re‑run (Pro)
- Account: name/email/password, Manage Billing (Stripe Portal link), delete account (EU compliance)

## Phase 8 — Exports
- Free: Markdown export only
- Pro: PDF, Word (HTML/DOCX), HTML exports with consistent branding
- Add watermark toggle for Pro exports

## Phase 9 — Analytics and funnels
- Track funnel: extract → audit viewed → edit → export → upgrade
- Track upgrade CTAs from audit gating and exports
- Add error/latency logging for crawl, LLM, exports

## Phase 10 — Brand and comms
- Update app copy, headers/footers, emails to “Fortress” (domain decision later)
- Keep aistyleguide.com for now; plan 301s and Search Console later
- Keep current sender; plan RESEND domain switch later (SPF/DKIM)

## Phase 11 — QA and launch
- Test EU data path, auth flows, billing webhooks, entitlement gates
- Test crawl on slow/JS‑heavy pages; ensure graceful fallbacks
- Validate locale toggle (US/UK) across generation and examples
- Final content pass; ship v1 to production

---

## Acceptance criteria (v1)
- Users can sign in, generate one guideline, view 5 audit issues, export MD (Free)
- Upgrading unlocks full audit, unlimited guidelines, and PDF/Word/HTML exports (Pro)
- Editor supports inline edit, regenerate sections, autosave, undo/redo
- Locale toggle (US/UK) affects outputs; PostHog shows core funnel

## Post‑v1 (not in scope)
- Teams/orgs and seats; projects layer; comments; Whisper input; 301s and sender domain switch


