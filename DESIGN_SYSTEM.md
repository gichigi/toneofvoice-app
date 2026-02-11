# Style Guide Document Design System

This document defines the visual design system for AI Style Guide document output. All styling decisions for the style guide document (cover page, content sections, trait cards, rules, examples) are documented here.

**Cross-reference**: Typography and Edit → Preview mapping are implemented in `lib/style-guide-styles.ts`. If you change this doc (e.g. the mapping table or font sizes), update the corresponding tokens in `lib/style-guide-styles.ts`; if you change that file, update this doc so they stay in sync.

**Code convention**: Files implementing design system decisions should include:
```typescript
// Design system: see DESIGN_SYSTEM.md for typography/spacing decisions
```

---

## Fonts

### Display Font (Headings)
- **Font**: Playfair Display (serif) via `next/font/google`
- **Usage**: All H1, H2, H3 headings in the document
- **Why**: Serif display fonts convey premium, editorial quality. Creates contrast with clean sans-serif body text.
- **Loading**: Loaded via `next/font/google` in `app/layout.tsx` and applied via CSS custom property `--font-display`

### Body Font
- **Font**: Geist Sans (current) or Inter
- **Usage**: All body text, paragraphs, lists
- **Why**: Clean, readable sans-serif that pairs well with serif headings
- **Loading**: Already loaded via Next.js default

### Font Sizes (Single Source of Truth)

All typography tokens are defined in `lib/style-guide-styles.ts` to prevent CSS specificity conflicts and ensure consistency.

**Preview Mode** (premium, generous spacing):
- **Cover page brand name**: `text-5xl md:text-6xl` with serif display font
- **H1**: `text-5xl md:text-6xl` with serif, `mt-8 mb-4`
- **H2 sections**: `text-5xl md:text-6xl` with serif, `mt-24 mb-8` (larger than editor to signal premium)
- **H3 subsections**: `text-2xl md:text-3xl` with serif, `mt-12 mb-5`
- **Body text**: `text-base md:text-lg leading-relaxed` (generous line height)

**Editor Mode** (functional, slightly more compact):
- **H1**: `text-5xl md:text-6xl` with serif, `mt-8 mb-4`
- **H2 sections**: `text-3xl md:text-4xl` with serif, `mt-16 mb-6` (smaller than preview to signal editable)
- **H3 subsections**: `text-xl md:text-2xl` with serif, `mt-10 mb-4`
- **Body text**: `text-base leading-relaxed`

---

## Color Palette

### Document Colors
- **Primary text**: `gray-900` (`#111827`) - main headings and body text
- **Secondary text**: `gray-700` (`#374151`) - supporting text, metadata
- **Muted text**: `gray-500` (`#6B7280`) - dates, labels
- **Section accents**: `blue-600` (`#2563EB`) - subtle left border on H2 sections (optional)

### Trait Cards
- **Background**: `blue-50` (`#EFF6FF`) - light tint for trait cards
- **Border**: `blue-200` (`#BFDBFE`) - subtle border
- **Text**: `blue-700` (`#1D4ED8`) - trait name text
- **Badge background**: `blue-50` with `blue-700` text for trait badges

### Rule Examples
- **Good example**: Green accent border `border-l-4 border-green-500` with `bg-green-50` background
- **Bad example**: Red accent border `border-l-4 border-red-500` with `bg-red-50` background
- **Example text**: `gray-800` for readability

### Locked Content
- **Gradient fade**: `mask-image: linear-gradient(to bottom, black 0%, transparent 100%)`
- **Locked header text**: `gray-400` (`#9CA3AF`) - dimmed
- **Lock icon**: `gray-500` (`#6B7280`)
- **Upgrade CTA card**: `blue-50` background with `blue-600` border

---

## Spacing Scale

### Section Spacing
- **H2 section top margin**: `mt-16` (64px) - generous spacing between major sections
- **H2 section bottom margin**: `mb-6` (24px) - space before content starts
- **H3 subsection top margin**: `mt-8` (32px) - spacing between subsections
- **H3 subsection bottom margin**: `mb-4` (16px)

### Paragraph Spacing
- **Paragraph bottom margin**: `mb-4` (16px)
- **Paragraph line-height**: `leading-8` (32px) - generous for readability
- **List item spacing**: `space-y-2` (8px) between items

### Cover Page Spacing
- **Vertical padding**: `py-20` to `py-24` (80px-96px) - magazine cover feel
- **Horizontal padding**: `px-8` (32px) on mobile, `px-12` (48px) on desktop
- **Brand name bottom margin**: `mb-4` (16px)
- **Date top margin**: `mt-2` (8px)

---

## Component Patterns

### Cover Page
- **Layout**: Full-width container with centered content (`max-w-4xl mx-auto`)
- **Brand name**: Large display font, `text-5xl` or `text-6xl`, `font-bold`
- **Subtitle**: "Brand Voice & Style Guide" on new line, smaller size
- **Background**: Subtle gradient `bg-gradient-to-br from-gray-50 to-white` or solid `bg-gray-50`
- **Metadata**: Date and guide type as understated text, not badges
- **Preview badge**: Small, subtle if present (`text-xs`, `px-2.5 py-1`)

### Trait Sections
- **Layout**: Each trait as a card with padding `p-6` (24px)
- **Trait heading (H3)**: Numbered format "1. Trait Name" with display font
- **Description paragraph**: Regular body text with `leading-8`
- **Dos/Don'ts layout**: 
  - **Desktop**: Two-column grid (`grid-cols-2 gap-6`) for "What It Means" and "What It Doesn't Mean"
  - **Mobile**: Stacked single column
- **Dos list**: Left column, green accent `border-l-4 border-green-500`, `bg-green-50/30`, `pl-4`
- **Don'ts list**: Right column, red accent `border-l-4 border-red-500`, `bg-red-50/30`, `pl-4`
- **Arrow/cross symbols**: `→` for dos, `✗` for don'ts, styled with appropriate colors

### Rule Sections
- **Rule heading (H3)**: Numbered format "1. Rule Name" with display font
- **Rule description**: One sentence, `text-gray-700`, `mb-3`
- **Examples container**: `mt-4` spacing
- **Good example**: 
  - Green left border `border-l-4 border-green-500`
  - Light green background `bg-green-50`
  - Padding `p-3` (12px)
  - `✅` emoji or green checkmark icon
- **Bad example**:
  - Red left border `border-l-4 border-red-500`
  - Light red background `bg-red-50`
  - Padding `p-3` (12px)
  - `❌` emoji or red X icon

### Section Dividers
- **Replacement for `<hr>`**: Elegant thin line with spacing
- **Style**: `border-t border-gray-200` (1px solid line)
- **Spacing**: `my-12` (48px) - wider than default
- **Alternative**: Subtle left accent border on H2 sections instead of horizontal rule

---

## Surface Parity Notes

### MarkdownRenderer (Preview Mode)
- Uses PREVIEW_*** tokens from `style-guide-styles.ts`
- Read-only, polished output with premium aesthetic
- No toolbar or editing UI
- Larger headings, generous spacing, eyebrow labels above H2s
- Serif fonts applied via inline `style` prop using `PREVIEW_*_STYLE` objects

### StyleGuideEditor (Plate.js Edit Mode)
- Uses EDITOR_*** tokens from `style-guide-styles.ts`
- Editor toolbar visible (functional, minimal)
- Slightly smaller headings than preview to signal "editable"
- Same serif font family but different sizing/spacing
- AI Assist toolbar appears on text selection

### PDF Export
- **Primary**: Server-side via `POST /api/export-pdf` (Puppeteer + Chromium). Client sends serialized `#pdf-export-content` HTML and critical CSS from `/pdf-styles`; server returns PDF buffer.
- **Fallback**: If the API fails or times out, client uses improved html2pdf.js (same clone with `.pdf-rendering` class, `document.fonts.ready`, improved html2canvas options). Both paths use the same `.pdf-rendering` styles in `globals.css` so cover title, gradients, and text render correctly.
- **Structure**: Must remain cover + content + footer under `#pdf-export-content`; `.pdf-only` / `.pdf-exclude` control visibility during export.
- Page breaks configured to avoid breaking on H2, H3, trait cards, rule sections.

**Alternative services (future):** If we want to drop Puppeteer/Chrome and use a hosted HTML→PDF API instead, options with free monthly allocation: **PDFBolt** (~100 free/month), **html2pdfapi.com** (~50 free/month). Others: Api2Pdf, CloudConvert, pdfg.net. All accept HTML or URL and return PDF; no local Chrome needed.

**Quality/control vs our implementation:**
- **Our primary (Puppeteer)**: Chrome print engine, full control (viewport 816×1056, Letter, 0.5in margins, printBackground). We own HTML/CSS and server; no rate limits or request caps.
- **PDFBolt / html2pdfapi**: Both use headless Chrome in the cloud. Output quality is on par with our primary (same engine). They expose page size, margins, waitUntil (e.g. networkidle0), printBackground, viewport/scale. PDFBolt adds print-production options (PDF/X, CMYK). Control is slightly less low-level (we’d use their params instead of our own launch/viewport) but sufficient for our use case. Trade-off: rate limits, request size limits, and dependency on their uptime.
- **Our fallback (html2pdf.js)**: Canvas-based; quality and control are lower than any Chrome-based path (fonts/gradients can differ, fewer layout guarantees).

### Word Export (DOCX)
- Uses `docx` library to generate Word document
- Heading styles mapped: H1 → HeadingLevel.TITLE, H2 → HEADING_1, H3 → HEADING_2
- Font sizes: H1=24pt, H2=20pt, H3=16pt
- Spacing: `before: 240` (12pt), `after: 120` (6pt) for headings
- Good/bad examples: Green/red left borders via paragraph borders

---

## Lock/Blur Visual Treatment

### Gradient Fade
- **CSS**: `mask-image: linear-gradient(to bottom, black 0%, transparent 100%)`
- **Applied to**: Last visible paragraph before paywall
- **Effect**: Content fades out smoothly over ~100px

### Locked Section Headers
- **Style**: Dimmed text `text-gray-400`, smaller size `text-lg`
- **Icon**: Lock icon (`Lock` from lucide-react) before header text
- **Spacing**: `mt-8` from fade, `mb-4` between headers
- **Headers shown**: "Style Rules", "Before/After Examples" (no body content)

### Upgrade CTA Card
- **Position**: Centered between faded content and locked headers
- **Background**: `bg-blue-50` with `border border-blue-200`
- **Padding**: `p-6` (24px)
- **Text**: Centered, `text-center`
- **Button**: Primary CTA button with `bg-gray-900 hover:bg-gray-800`
- **Height**: ~200-300px total locked section height

---

## Implementation Notes

### Single Source of Truth: `lib/style-guide-styles.ts`

All typography and spacing tokens are centralized in `lib/style-guide-styles.ts` (see file header comment there for link back to this doc). **If you change tokens in that file, update the "Edit → Preview mapping" table and any related sections in this doc; if you change this doc, update the code.**
- **PREVIEW_*** tokens: Used by `MarkdownRenderer.tsx` for premium preview mode
- **EDITOR_*** tokens: Used by `heading-node.tsx` for functional editor mode
- Both variants share the same serif font (`SERIF_FONT_STYLE`) but differ in size/spacing
- This prevents CSS specificity conflicts that previously caused inconsistent rendering

### Edit → Preview mapping

Reference for how each formatting option in edit mode is rendered in preview. Tokens live in `lib/style-guide-styles.ts`; this table documents the current mapping only (no behavior change).

| Element | Edit mode | Preview mode |
|--------|-----------|--------------|
| **H1** | `EDITOR_H1_*`: `text-5xl md:text-6xl`, serif, border-b, `mt-8 mb-4` | `PREVIEW_H1_*`: `text-5xl md:text-6xl`, serif, `mb-6 border-b pb-4` |
| **H2** | `EDITOR_H2_*`: `text-3xl md:text-4xl`, serif, `mt-16 mb-6`, bar `h-1 w-16` | `PREVIEW_H2_*`: `text-5xl md:text-6xl`, serif, `mt-24 mb-8`, bar `h-1 w-24`. Optional eyebrow (`getSectionEyebrow`) + section description (`getSectionDescription`) above/below (preview-only). |
| **H3** | `EDITOR_H3_*`: `text-xl md:text-2xl`, serif, `mt-10 mb-4` | `PREVIEW_H3_*`: `text-2xl md:text-3xl`, serif, `mt-12 mb-5` |
| **H4** | `EDITOR_H4_*`: `text-lg font-semibold text-gray-800`, `mt-6 mb-2` | `PREVIEW_H4_*`: `text-lg font-medium text-gray-700`, `mb-2 mt-4` |
| **Body (p)** | `EDITOR_BODY_CLASS`: `text-base leading-relaxed text-gray-700` | `PREVIEW_BODY_*`: `text-base md:text-lg leading-relaxed text-gray-600`, `mb-5` |
| **Lists (ul/ol/li)** | Editor default styling | `PREVIEW_LIST_*` / `PREVIEW_LIST_ITEM_*`: `text-base md:text-lg leading-relaxed text-gray-600`, list-disc/list-decimal, `space-y-2`, `mb-6` |
| **Blockquote** | Editor default | `PREVIEW_BLOCKQUOTE_*`: `border-l-4 border-gray-200 pl-4 italic text-gray-600`, `my-4` |
| **Horizontal rule** | Editor default | `PREVIEW_HR_*`: `border-gray-200`, `my-12` |

Preview-only treatments (not shown in edit): eyebrow label above H2 (`PREVIEW_EYEBROW_CLASS`), section description below H2 (`PREVIEW_SECTION_DESCRIPTION_CLASS`), H2 decorative bar.

### CSS Class: `.style-guide-document`
Applied to both MarkdownRenderer container and Plate.js editor container. Only defines the `--font-display` custom property. All typography styles come from Tailwind classes via tokens.

### Font Loading
Display font loaded via `next/font/google` in root layout, exported as CSS variable `--font-display`, applied via inline `style` prop using `SERIF_FONT_STYLE` from tokens.

### Page Architecture

**Single Unified Route**: `/guide`
- Handles both preview flow (free users, localStorage) and full-access flow (paid users, database)
- Determines flow type from query params (`guideId` = database flow, no `guideId` = localStorage flow)
- Default view mode: "preview" for free users, "edit" for paid users
- Old routes `/preview` and `/full-access` redirect to `/guide` for backward compatibility

### Responsive Behavior
- Cover page: Full width on mobile, centered `max-w-4xl` on desktop
- Trait dos/don'ts: Stacked on mobile (`flex-col`), two-column on desktop (`md:grid-cols-2`)
- Section spacing: Slightly reduced on mobile (`mt-12` instead of `mt-16`)

### Dark Mode
- Document maintains light theme even in dark mode (document is meant to be printed/shared)
- Editor UI adapts to dark mode, but document content stays light

---

## Future Considerations

- Consider adding subtle animations on cover page load
- Explore custom serif font pairing options
- A/B test spacing values for optimal readability
- Consider adding subtle texture/pattern to cover page background
