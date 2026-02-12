// Design system: see DESIGN_SYSTEM.md for full typography/spacing decisions and Edit → Preview mapping.
// Single source of truth for all style guide typography and spacing (this file is what the code uses).
// If you change any PREVIEW_* or EDITOR_* tokens here, update the mapping table in DESIGN_SYSTEM.md.
// Preview variants: larger, more premium, generous spacing
// Editor variants: slightly more compact, functional, still readable

import type { CSSProperties } from "react"

// Shared serif font style (used by both preview and editor)
export const SERIF_FONT_STYLE: CSSProperties = {
  fontFamily: "var(--font-display), serif",
  letterSpacing: "-0.02em",
}

// ============================================================================
// PREVIEW MODE STYLES (Premium, generous, magazine-like)
// ============================================================================

// H1 - Cover page title (very large)
export const PREVIEW_H1_CLASS = "text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[0.95]"
export const PREVIEW_H1_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
}

// H2 - Section headings (large, premium)
export const PREVIEW_H2_CLASS = "text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]"
export const PREVIEW_H2_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
}

// H3 - Subsection headings (medium-large, serif)
export const PREVIEW_H3_CLASS = "text-2xl md:text-3xl font-bold text-gray-900"
export const PREVIEW_H3_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
  hyphens: "none",
  wordBreak: "keep-all",
}

// H4 - Sub-subsection headings
export const PREVIEW_H4_CLASS = "text-lg font-medium text-gray-700"

// Eyebrow label (like "BRAND IDENTITY SYSTEM" on cover)
export const PREVIEW_EYEBROW_CLASS = "text-xs font-medium uppercase tracking-widest text-gray-500"

// Body text - generous line height for readability
export const PREVIEW_BODY_CLASS = "text-base md:text-lg leading-relaxed text-gray-600"
export const PREVIEW_BODY_STYLE: CSSProperties = {
  orphans: 2,
  widows: 2,
}

// Lists
export const PREVIEW_LIST_CLASS = "text-base md:text-lg leading-relaxed text-gray-600"
export const PREVIEW_LIST_ITEM_CLASS = "leading-relaxed"

// Blockquote
export const PREVIEW_BLOCKQUOTE_CLASS = "border-l-4 border-gray-200 pl-4 italic text-gray-600"

// Horizontal rule
export const PREVIEW_HR_CLASS = "border-gray-200"

// Decorative bar under H2 (matches cover page aesthetic)
export const PREVIEW_H2_BAR_CLASS = "h-1 w-24 bg-gray-900 rounded-full"

// Section description (italic explainer text below H2)
export const PREVIEW_SECTION_DESCRIPTION_CLASS = "text-sm text-gray-500 italic"

// Spacing tokens
export const PREVIEW_H2_MARGIN_TOP = "mt-24" // Generous spacing above sections
export const PREVIEW_H2_MARGIN_BOTTOM = "mb-8"
export const PREVIEW_H3_MARGIN_TOP = "mt-12"
export const PREVIEW_H3_MARGIN_BOTTOM = "mb-5"
export const PREVIEW_P_MARGIN_BOTTOM = "mb-5"
export const PREVIEW_LIST_MARGIN_BOTTOM = "mb-6"
export const PREVIEW_HR_MARGIN = "my-12"

// ============================================================================
// EDITOR MODE STYLES (Functional, slightly more compact)
// ============================================================================

// H1 - Editor title
export const EDITOR_H1_CLASS = "text-5xl md:text-6xl font-bold tracking-tight leading-[0.95] text-gray-900 border-b border-gray-200"
export const EDITOR_H1_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
}

// H2 - Editor section headings (smaller than preview to signal "editable")
export const EDITOR_H2_CLASS = "text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] text-gray-900"
export const EDITOR_H2_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
}

// H3 - Editor subsection headings (must include serif - currently missing!)
export const EDITOR_H3_CLASS = "text-xl md:text-2xl font-bold tracking-tight text-gray-900"
export const EDITOR_H3_STYLE: CSSProperties = {
  ...SERIF_FONT_STYLE,
}

// H4 - Editor sub-subsection headings
export const EDITOR_H4_CLASS = "text-lg font-semibold tracking-tight text-gray-800"

// Body text in editor
export const EDITOR_BODY_CLASS = "text-base leading-relaxed text-gray-700"

// Decorative bar under H2 in editor (same as preview for consistency)
export const EDITOR_H2_BAR_CLASS = "h-1 w-16 bg-gray-900 rounded-full"

// Spacing tokens for editor
export const EDITOR_H1_MARGIN_TOP = "mt-8"
export const EDITOR_H1_MARGIN_BOTTOM = "mb-4"
export const EDITOR_H2_MARGIN_TOP = "mt-16"
export const EDITOR_H2_MARGIN_BOTTOM = "mb-6"
export const EDITOR_H3_MARGIN_TOP = "mt-10"
export const EDITOR_H3_MARGIN_BOTTOM = "mb-4"
export const EDITOR_H4_MARGIN_TOP = "mt-6"
export const EDITOR_H4_MARGIN_BOTTOM = "mb-2"

// ============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// ============================================================================

// These are kept for now but will be replaced with PREVIEW variants
export const SECTION_H2_CLASS = PREVIEW_H2_CLASS
export const SECTION_H2_STYLE = PREVIEW_H2_STYLE
export const SECTION_H2_BAR_CLASS = PREVIEW_H2_BAR_CLASS

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Section explainer copy: first person plural, informational. Preview only (not in editor). */
export function getSectionDescription(headingText: string): string | null {
  const text = headingText.trim();
  const lower = text.toLowerCase();
  if (lower.includes("brand voice")) return "The core character of our brand that defines the dos and don'ts of our personality.";
  if (/your\s+audience/i.test(text)) return "Who we write for and how to address them.";
  if (/content\s+guidelines/i.test(text)) return "Guardrails for short-form, long-form, and product copy.";
  if (/style\s+rules/i.test(text)) return "Rules that support our brand voice across every channel.";
  if (/before.*after/i.test(text)) return "Real examples that show our guidelines in action.";
  if (/word\s+list/i.test(text)) return "Preferred terms, words to avoid, and spelling conventions.";
  return null;
}

/** Get eyebrow label for a section (uppercase category label like "BRAND IDENTITY SYSTEM") */
export function getSectionEyebrow(headingText: string): string | null {
  const text = headingText.trim();
  const lower = text.toLowerCase();
  if (lower.includes("about")) return "BRAND OVERVIEW";
  if (lower.includes("how to use")) return "USAGE GUIDE";
  if (/your\s+audience/i.test(text)) return "WHO YOU'RE WRITING FOR";
  if (/content\s+guidelines/i.test(text)) return "FOUNDATION";
  if (lower.includes("brand voice")) return "BRAND IDENTITY";
  if (/style\s+rules/i.test(text)) return "STYLE RULES";
  if (/before.*after/i.test(text)) return "EXAMPLES";
  if (/word\s+list/i.test(text)) return "TERMINOLOGY";
  return null;
}
