// Schema and validation for style guide rules
// Design system: consolidated 25 rule categories (see plan)

export const ALLOWED_RULE_CATEGORIES = [
  "Contractions",
  "Active vs. Passive Voice",
  "Emojis",
  "Exclamation Points",
  "Sentence Length",
  "Slang and Jargon",
  "Pronouns and Point of View",
  "UK vs. US English",
  "Serial Comma",
  "Capitalisation",
  "Title Case vs. Sentence Case",
  "Acronyms",
  "Abbreviated Words",
  "Numbers",
  "Dates",
  "Time and Time Zones",
  "Money and Currency",
  "Percentages",
  "Hedging Language",
  "Sentence Structure",
  "Ellipses",
  "Quotation Marks",
  "Company and Product Name Spelling",
  "Job Titles",
  "Inclusive Language",
] as const;

export type RuleCategory = (typeof ALLOWED_RULE_CATEGORIES)[number];

export interface StyleRule {
  category: string;
  title: string;
  description: string;
  examples: {
    good: string;
    bad: string;
  };
}

export interface ValidationResult {
  valid: StyleRule[];
  invalid: StyleRule[];
}

/**
 * Check if a rule category is in the allowed list
 */
export function isValidRuleCategory(category: string): boolean {
  return ALLOWED_RULE_CATEGORIES.includes(category as RuleCategory);
}

/**
 * Check if a single rule is valid
 */
export function isValidRule(rule: StyleRule): boolean {
  // Check required fields exist
  if (!rule.category || !rule.title || !rule.description || !rule.examples) {
    return false;
  }

  // Check examples have both good and bad
  if (!rule.examples.good || !rule.examples.bad) {
    return false;
  }

  // Check category is in allowed list
  if (!isValidRuleCategory(rule.category)) {
    return false;
  }

  return true;
}

/**
 * Validate an array of rules and separate valid from invalid
 */
export function validateRules(rules: StyleRule[]): ValidationResult {
  const valid: StyleRule[] = [];
  const invalid: StyleRule[] = [];
  const seenCategories = new Set<string>();

  for (const rule of rules) {
    // Basic structural/category validation first
    if (!isValidRule(rule)) {
      invalid.push(rule);
      continue;
    }

    // Enforce unique categories (case-insensitive, trimmed)
    const key = (rule.category || "").trim().toLowerCase();
    if (seenCategories.has(key)) {
      invalid.push(rule);
      continue;
    }
    seenCategories.add(key);

    valid.push(rule);
  }

  return { valid, invalid };
}

/**
 * Get a formatted list of allowed categories for prompts
 */
export function getAllowedCategoriesPromptText(): string {
  return ALLOWED_RULE_CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join("\n");
}
