# Single Editor Migration Plan

**Goal:** Replace multiple per-section editors with one unified Plate editor (cover + one scrollable doc with all sections). User scrolls through sections like Plate Playground.

---

## 1. Current Architecture Summary

### Data Flow
- `previewContent` = full markdown string (stored in localStorage, used for download/export)
- `sections` = parsed from `previewContent` via `parseStyleGuideContent()`; each section has `id`, `title`, `content`, `minTier`
- Each section renders either `ContentGate` (locked) or `StyleGuideEditor` (one Plate instance per section)
- `onChange` per editor: updates that section in `sections`, then reconstructs `previewContent` by merging all section contents
- PDF export: clones `#pdf-export-content` DOM, applies `.pdf-only` / `.pdf-exclude`, uses html2pdf
- Rewrite API: takes `currentContent` (one section’s markdown), returns rewritten markdown; caller updates that section

### Dependencies on Section-Based Model
| Consumer | Dependency | Risk if removed |
|----------|------------|-----------------|
| Sidebar | `sections[]` for nav, `activeSectionId` | Must derive sections from single-doc content for jump-to |
| RewriteBar | `activeSectionId` → extract section content for rewrite | Need to extract section by heading/position from single doc |
| PDF export | DOM structure under `#pdf-export-content` | Must keep same structure: cover + content + footer |
| Download (MD/DOCX) | `previewContent` | Single doc markdown = `previewContent` directly |
| IntersectionObserver | `document.getElementById(section.id)` per section | Sections must still have stable IDs in DOM |

---

## 2. Target Architecture

### Layout
```
[Cover] (unchanged, separate component)
────────────────────────────────────
[Single Plate Editor - full width, scrollable]
  ## About [Brand]
  content...

  ## How to Use
  content...

  ## General Guidelines
  content...

  ## Brand Voice
  content...

  [LOCKED: Style Rules - ContentGate or read-only block]
  ## Style Rules
  blurred/locked content...
────────────────────────────────────
[RewriteBar] (fixed bottom)
```

### Data Model
- **Single source of truth:** `previewContent` (full markdown)
- **Derived:** `sections` from `parseStyleGuideContent(previewContent)` for sidebar + intersection observer
- **Editor:** One Plate instance with full `previewContent` (minus cover)
- **Locked sections:** Either (A) rendered as read-only/blurred blocks inside editor via custom Plate nodes, or (B) kept as separate DOM blocks between editor and ContentGate — **Plan assumes (B) for lower risk** (see below)

---

## 3. Risk Factors & Mitigations

### R1: Locked Sections Inside One Editor
**Risk:** Plate doesn’t support per-node or per-range read-only. Locked content would need custom nodes that block edits.

**Mitigation:** Use **hybrid layout**: one editor for all *unlocked* sections only. Locked sections remain separate `ContentGate` blocks. Flow: Cover → Editor (free sections) → ContentGate (pro/team sections). Simpler and avoids custom Plate nodes.

**Alternative (higher risk):** Single editor with all content; locked sections as custom read-only nodes. Requires Plate plugin work and careful cursor/selection handling.

### R2: Section Extraction for Rewrite
**Risk:** Rewrite API expects one section’s markdown. With a single doc, we must extract the “active” section by `activeSectionId` and heading boundaries.

**Mitigation:**
- Keep `parseStyleGuideContent()` and `sections` for structure.
- Add `getSectionContentFromMarkdown(markdown, sectionId)` that finds `## Section Title` and returns content up to next `##`.
- `handleRewrite` uses this to get `currentContent`, then replaces that section in full markdown with API response.
- Edge case: if heading text changes, section matching may break. Mitigation: match by `sectionId` derived from heading (existing logic in `parseStyleGuideContent`).

### R3: Sidebar Jump-to-Section
**Risk:** Sections live inside one editor; there are no `id="section-id"` wrappers.

**Mitigation:**
- Option A: Add `data-section-id` to H2 elements via custom Plate node. Scroll to first block with that attribute.
- Option B: Keep section wrappers: wrap each logical section (heading + content) in a `<div id={section.id}>` by rendering custom block wrappers. Plate supports custom block components.
- **Recommendation:** Use custom H2 component that renders `<h2 id={sectionId} data-section-id={sectionId}>`. Section IDs are derived from heading text (e.g. "About Brand" → "about"). `scrollIntoView` works on that element.
- **Caveat:** On first load, IDs come from parsed sections. When user edits a heading, ID might change. Mitigation: use stable IDs from `STYLE_GUIDE_SECTIONS` when heading matches; fallback to slug from heading.

### R4: IntersectionObserver for activeSectionId
**Risk:** Observer needs elements with section IDs to detect which section is in view.

**Mitigation:** Same as R3 — H2s (or wrappers) with `id` and `data-section-id`. Observer stays as-is.

### R5: PDF Export
**Risk:** PDF clones `#pdf-export-content`. Structure must remain: cover + content + footer. Plate renders a contenteditable div; we must ensure the clone includes the right structure.

**Mitigation:**
- Keep `#pdf-export-content` as wrapper.
- Children: Cover div, Editor container (which renders the doc), PDF footer.
- Add `pdf-exclude` to editor toolbar, RewriteBar, any UI-only elements.
- html2pdf captures the editor’s rendered content. Verify that what’s visible (including headings) matches what we want in the PDF.
- **Gotcha:** ContentEditable styling can differ. Ensure prose/heading styles are applied so PDF looks correct.

### R6: localStorage & Auto-Save
**Risk:** `StyleGuideEditor` uses `storageKey` for auto-save per section. Single editor needs one key for full content.

**Mitigation:**
- Single `storageKey` e.g. `preview-full` or `preview-{brandId}`.
- Save full markdown on change (debounced).
- On load: prefer localStorage over `previewContent` if present and newer (existing pattern elsewhere).

### R7: full-access Page Parity
**Risk:** `full-access` also uses section-based editors. Inconsistent UX if only preview changes.

**Mitigation:**
- Phase 1: Migrate preview only.
- Phase 2 (optional): Migrate full-access using same pattern.
- Document the pattern for reuse.

### R8: Plate Editor Re-mount / Value Sync
**Risk:** If we pass `previewContent` as initial value and update it externally (e.g. after rewrite), Plate may reset or conflict.

**Mitigation:**
- Use controlled value only when we intentionally replace content (e.g. after rewrite).
- Avoid updating `previewContent` from outside while user is typing; let `onChange` be the single source of updates during editing.
- On rewrite: replace section in full markdown, call `editor.api.markdown.deserialize(newMarkdown)` or equivalent to update editor value. Check Plate docs for correct API.

### R9: Content Structure Mismatch
**Risk:** `parseStyleGuideContent` expects `## Heading` structure. If user deletes a heading or changes format, parsing may break.

**Mitigation:**
- Validation: ensure sections always have `## Title` format when saving.
- Graceful fallback: if parsing returns fewer sections, still show doc; sidebar may have stale items until next parse.
- Consider periodic re-parse on content change with error boundaries.

### R10: Performance
**Risk:** One large editor with many sections could be slower than multiple small editors.

**Mitigation:**
- Plate/Slate handles large docs. Test with full style guide (e.g. 98 rules).
- If needed: virtualized blocks or lazy rendering (advanced). Start without; optimize only if needed.

---

## 4. Implementation Steps

### Phase 1: Prep (No User-Facing Changes)
1. **Add `getSectionContentFromMarkdown(markdown, sectionId)`** in `content-parser.ts`
   - Input: full markdown, section id
   - Output: content for that section (heading + body) or empty string
   - Use same heading regex as `parseStyleGuideContent`; match by `configId` or generated id from title

2. **Add `replaceSectionInMarkdown(markdown, sectionId, newContent)`** in `content-parser.ts`
   - Replaces the section’s content (from `## Heading` to next `##` or end)
   - Returns new full markdown

3. **Unit tests** for both functions with realistic markdown

### Phase 2: Custom H2 for Section IDs
4. **Create `H2SectionElement`** (or extend `H2Element`)
   - Renders `<h2 id={sectionId} data-section-id={sectionId}>` when heading matches a known section
   - `sectionId` from `STYLE_GUIDE_SECTIONS` or `generateSectionId(title)`
   - Integrate with Plate’s H2Plugin

5. **Verify** sidebar jump and IntersectionObserver work with new H2s (can test with a minimal single-editor prototype)

### Phase 3: Single Editor on Preview Page
6. **Restructure preview page layout**
   - Cover (unchanged)
   - Single `StyleGuideEditor` for full `previewContent` (exclude cover from markdown; cover is separate)
   - Actually: `previewContent` = content only (no cover). Cover is never in markdown. Confirm current behavior.
   - Current: `previewContent` = full guide markdown (About, How to Use, etc.). Cover is visual-only. So editor gets `previewContent` as-is.

7. **Handle locked sections (hybrid approach)**
   - Parse `previewContent` → sections
   - Split content into: (a) free sections concatenated, (b) pro/team sections concatenated
   - Render: Editor (free sections) + ContentGate (locked sections) *OR*
   - Render: Editor (all sections) with locked sections as non-editable blocks
   - **Simpler:** One editor with ALL content. Locked sections shown as-is in editor but we intercept `beforeInput`/`onChange` and reject edits in locked ranges. Complex.
   - **Simpler:** Hybrid. Editor = free sections only. Below editor, ContentGate blocks for locked sections. User sees one scroll, but locked parts are separate components. Section IDs in editor come from H2s; section IDs in ContentGate from wrapper divs.
   - Implementation: Build `editableMarkdown` = concatenation of free sections. Build `lockedSections` = array of locked section objects. Render: Editor(markdown=editableMarkdown) + lockedSections.map(ContentGate). Problem: two separate scroll areas? No — put both in one scroll container. Editor scrolls, ContentGates below. Same scroll. Good.

8. **Merge logic for onChange**
   - Editor’s `onChange` receives only editable (free) markdown. We don’t have “one” markdown for everything.
   - So: `previewContent` = editableMarkdown + lockedSectionsContent. When user edits, we update editable part. When we need full content (download, etc.), we merge: editableMarkdown + lockedSectionsMarkdown.
   - Locked sections content: from initial `previewContent` parse. Stored in state `lockedSectionsMarkdown` or derived from `sections.filter(locked)`.

9. **Update handleRewrite**
   - Get `currentContent` via `getSectionContentFromMarkdown(previewContent, activeSectionId)` (handles both free and locked for pro user)
   - If section is locked and user is free, RewriteBar is hidden — no change
   - After rewrite: `replaceSectionInMarkdown(previewContent, activeSectionId, data.content)` → setPreviewContent
   - If single editor: must also update editor value. Use `editor.api.markdown.deserialize(newMarkdown)` or replace value prop.

### Phase 4: Remove Per-Section Editors
10. **Replace** the `sections.map` that renders `StyleGuideEditor` per section with:
    - One editor for editable content
    - One scroll container: Cover, Editor, LockedSection blocks
11. **Wire** `onChange` to update `previewContent` (and `lockedSectionsMarkdown` if we store it separately)
12. **Wire** sidebar `onSectionSelect` to scroll to H2 or section wrapper
13. **Ensure** `#pdf-export-content` wraps: Cover + Editor container + Locked blocks + Footer

### Phase 5: Polish
14. **Hide** editor toolbar when focused on a locked block (N/A if locked are separate components)
15. **Tip banner** — show once at top of editor
16. **Storage** — single key, full content
17. **Test** PDF export, MD/DOCX download, Rewrite, sidebar nav, scroll, resize

---

## 5. File Change Summary

| File | Changes |
|------|---------|
| `lib/content-parser.ts` | +`getSectionContentFromMarkdown`, +`replaceSectionInMarkdown`; export if used elsewhere |
| `components/editor/StyleGuideEditor.tsx` | Optional: H2SectionElement for section IDs; or new wrapper component |
| `components/ui/heading-node.tsx` | Possibly extend H2 to accept section id prop (or render from node data) |
| `app/preview/page.tsx` | Major refactor: single editor, hybrid locked sections, new merge/split logic |
| `app/full-access/page.tsx` | No change in Phase 1 (optional later) |

---

## 6. Testing Checklist

- [ ] Load preview with free user → see single editor with free sections, locked ContentGates below
- [ ] Load preview with pro user → see single editor with all sections (no ContentGate)
- [ ] Edit content in editor → `previewContent` updates
- [ ] Click sidebar item → scrolls to correct section (H2 or wrapper)
- [ ] Scroll manually → `activeSectionId` updates
- [ ] Rewrite section (pro) → section content updates in editor
- [ ] Download PDF → contains cover, content, footer
- [ ] Download MD/DOCX → contains correct full content
- [ ] Refresh → content persists (localStorage)
- [ ] Subscription tier change → locked sections appear/disappear correctly

---

## 7. Rollback Strategy

- **Branch:** Implement on feature branch; merge only after full testing
- **Feature flag:** Optional `NEXT_PUBLIC_SINGLE_EDITOR=true` to toggle between old and new layout during rollout
- **Reversion:** If critical bugs: revert to section-based editors; `previewContent` format unchanged, so no data migration needed

---

## 8. Open Decisions

1. **Locked sections:** Hybrid (editor + ContentGate) vs single editor with custom read-only blocks. Plan assumes hybrid.
2. **full-access migration:** Include in same PR or separate?
3. **H2 section IDs:** Render from Plate H2 node (requires heading-to-id mapping at render time) vs wrapper divs with IDs.

---

*Document created: 2026-02-07*
