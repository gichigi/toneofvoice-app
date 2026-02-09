// Renderer to convert validated JSON rules to markdown format

import { StyleRule } from './rules-schema';

/** Fix common model output quirks: quote spacing, orphan chars, time format */
function sanitizeRuleText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\uFFFD/g, '') // Strip replacement char (emoji/Unicode corruption)
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\u2060]/g, '') // Variation selectors, zero-width
    .replace(/([a-zA-Z0-9])"([a-zA-Z0-9/])/g, '$1 "$2') // Add space before opening " (Click"Create -> Click "Create)
    .replace(/(\d+):\s+(\d+)/g, '$1:$2') // Fix 10: 00 -> 10:00
    .replace(/\n+/g, ' ') // Collapse stray newlines to space
    .trim();
}

/**
 * Render an array of style rules to markdown format
 * Format: ### N. Title
 *         Description line
 *         ✅ Good example
 *         ❌ Bad example
 */
export function renderRulesMarkdown(rules: StyleRule[]): string {
  if (!rules || rules.length === 0) {
    return '';
  }

  return rules
    .map((rule, index) => {
      const number = index + 1;
      const desc = sanitizeRuleText(rule.description);
      const good = sanitizeRuleText(rule.examples?.good ?? '');
      const bad = sanitizeRuleText(rule.examples?.bad ?? '');
      const lines = [
        `### ${number}. ${rule.title}`,
        desc,
        `✅ ${good}`,
        `❌ ${bad}`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');
}

