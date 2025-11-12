# AI Link Automation Plan

## Goal
Leverage an OpenAI model through the Supabase MCP server to insert hub blockquotes and closing "Next steps" sentences using the same rules as our manual SQL scripts.

## System Components
1. **Data Loader (MCP Tool)**
   - Read `scripts/content-batch-plan.md` to fetch hub and cross link requirements per slug.
   - Pull the target post content from Supabase (`blog_posts.content`).
   - Optionally fetch referenced posts to supply titles for anchor text validation.

2. **LLM Orchestrator**
   - Prompt structure: provide current article body, planned hub/cross links, and formatting rules.
   - Request structured JSON diff (e.g., `{ blockquote, closing, inline_inserts[] }`) instead of freeform markdown.
   - Include guidance reminders: preserve existing text, ensure two newlines between sections, maintain `> This playbook pairs...` pattern, end with a period.

3. **Executor & Validation Layer**
   - Convert JSON diff into SQL updates matching `scripts/update-batch4-links.sql` patterns.
   - Validation checks before executing:
     - URLs match allowed slugs.
     - Blockquote inserted after H1.
     - Closing sentence contains "Next steps:" and two references.
     - No unexpected deletions vs original diff.
   - Dry-run option that logs proposed changes without writing.

## Proposed Workflow
1. Operator selects slug(s) for cleanup.
2. MCP tool gathers:
   - Original content from Supabase.
   - Plan row from `content-batch-plan.md`.
   - Titles for hub/cross targets (for anchor wording).
3. Orchestrator submits prompt to OpenAI (gpt-4.1 or comparable) to generate diff JSON.
4. Validation layer reviews diff:
   - Reject if schema mismatch, missing references, or large deletions (>5% of text).
   - On failure, log reason and fall back to manual SQL.
5. Translate diff to SQL updates (one transaction per batch) and execute via Supabase MCP `execute_sql`.
6. Run verification SELECT (first/last 200 chars + status flag) and store audit log.

## Implementation Checklist
- [ ] Build MCP tool method to load content plan rows and Supabase content.
- [ ] Define reusable prompt template + schema for LLM response.
- [ ] Implement validator + SQL generator (reuse logic from `scripts/update-batch4-links.sql`).
- [ ] Wire into Supabase MCP execute endpoint with dry-run flag.
- [ ] Add audit logging (before/after snippets) for manual review.
- [ ] Document operator instructions and fallback procedure.

## Safeguards & Testing
- Unit tests with fixture posts comparing AI output to known-good SQL.
- Rate limit model calls; require human approval for first rollout.
- Maintain manual script (`update-batchX-links.sql`) as backup path.
- Store diffs in Supabase table for rollback (slug, prev_content, new_content, timestamp).

## Dependencies & Open Questions
- Ensure OpenAI API key available to MCP server with model access (probably gpt-4.1 or gpt-4.1-mini).
- Confirm Supabase MCP server can call both OpenAI and database within same job.
- Decide whether to chunk long posts or send full body (current posts ~10k chars, acceptable for 128k context models).
- Determine human approval UX (CLI prompt, dashboard, or PR-style interface).
- Maintain explicit SQL generation step: MCP sandbox requires full statements for safety, so the orchestrator must emit vetted SQL (no direct diff application).
