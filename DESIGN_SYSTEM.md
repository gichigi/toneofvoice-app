# Style Guide Document Design System

This document defines the visual design system for AI Style Guide document output. All styling decisions for the style guide document (cover page, content sections, trait cards, rules, examples) are documented here.

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

### Font Sizes
- **Cover page brand name**: `text-5xl` to `text-6xl` (48px-60px) with display font
- **H1**: `text-4xl` (36px) with display font
- **H2 sections**: `text-3xl` (30px) with display font, `mt-16 mb-6`
- **H3 subsections**: `text-2xl` (24px) with display font, `mt-8 mb-4`
- **Body text**: `text-base` (16px) with `leading-8` (32px line-height)

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

### MarkdownRenderer (Preview/Free View)
- Uses `.style-guide-document` CSS class
- Read-only, polished output
- No toolbar or editing UI
- Premium fonts applied via CSS

### StyleGuideEditor (Plate.js Edit Mode)
- Uses same `.style-guide-document` CSS class for consistency
- Editor toolbar visible (functional, minimal)
- Document area below toolbar matches MarkdownRenderer styling
- AI Assist toolbar appears on text selection

### PDF Export
- Clones DOM from page, inherits all styles
- Premium fonts must be available in cloned DOM (may need inline font-face)
- Print-specific styles in `@media print` block
- Page breaks configured to avoid breaking on H2, H3, trait cards, rule sections

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
- **Headers shown**: "25 Core Rules", "Before/After Examples" (no body content)

### Upgrade CTA Card
- **Position**: Centered between faded content and locked headers
- **Background**: `bg-blue-50` with `border border-blue-200`
- **Padding**: `p-6` (24px)
- **Text**: Centered, `text-center`
- **Button**: Primary CTA button with `bg-gray-900 hover:bg-gray-800`
- **Height**: ~200-300px total locked section height

---

## Implementation Notes

### CSS Class: `.style-guide-document`
Applied to both MarkdownRenderer container and Plate.js editor container to ensure visual consistency.

### Font Loading
Display font loaded via `next/font/google` in root layout, exported as CSS variable `--font-display`, applied to all headings via `font-display` class.

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
