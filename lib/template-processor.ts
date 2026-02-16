import {
  generateBrandVoiceTraits,
  generateStyleRules,
  generateAudienceSection,
  generateBeforeAfterSamples,
  generateWordList,
  getHowToUseContent,
  generateAudienceSummary,
} from "./openai"

// Configuration for preview limits - easy to adjust for A/B testing
// Rules and before/after no longer generated in preview (ContentGate hides them)
export const PREVIEW_CONFIG = {
  VISIBLE_TRAITS_FULL: 1,     // number of traits shown with full descriptions
  VISIBLE_TRAITS_NAMES: 2,    // number of additional trait names shown
}

// Auto-retry utility with logging
const logGenerationMetrics = (operationName: string, success: boolean, attemptCount: number, error?: any) => {
  const logData = {
    operation: operationName,
    success,
    attempts: attemptCount,
    timestamp: new Date().toISOString(),
    error: error ? {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines only
    } : null
  };
  
  if (success) {
    console.log(`[AI_GENERATION_SUCCESS] ${JSON.stringify(logData)}`);
  } else {
    console.error(`[AI_GENERATION_FAILURE] ${JSON.stringify(logData)}`);
  }
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 2,
  operationName: string
): Promise<T | null> => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[${operationName}] Attempt ${attempt}/${maxAttempts}`);
      const result = await operation();
      
      // Log success
      logGenerationMetrics(operationName, true, attempt);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[${operationName}] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        // Brief delay before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // Log final failure
  logGenerationMetrics(operationName, false, maxAttempts, lastError);
  return null;
};

// Function to load a template file via API or from disk (server-side)
export async function loadTemplate(templateName: string): Promise<string> {
  console.log(`[loadTemplate] Called with templateName: "${templateName}"`)

  try {
    // Server-side: read from disk when possible (no NEXT_PUBLIC_APP_URL needed)
    if (typeof window === 'undefined') {
      try {
        const path = await import('path')
        const fs = await import('fs/promises')
        const templatePath = path.join(process.cwd(), 'templates', `${templateName}.md`)
        const content = await fs.readFile(templatePath, 'utf8')
        console.log(`[loadTemplate] Loaded from disk: "${templateName}" (${content.length} chars)`)
        return content
      } catch (diskError) {
        console.warn(`[loadTemplate] Disk read failed, falling back to API:`, diskError)
      }
    }

    // Client-side or fallback: fetch from API
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`

    console.log(`[loadTemplate] Base URL: "${baseUrl}"`)
    const fullUrl = `${baseUrl}/api/load-template?name=${templateName}`
    const response = await fetch(fullUrl)
    const data = await response.json()

    if (!response.ok) {
      console.error(`[loadTemplate] API error:`, data)
      throw new Error(data.error || `Failed to load template: ${templateName}`)
    }

    console.log(`[loadTemplate] Loaded template "${templateName}" (${data.content?.length ?? 0} chars)`)
    return data.content
  } catch (error) {
    console.error(`[loadTemplate] Error loading template ${templateName}:`, error)
    throw new Error(`Failed to load template: ${templateName}`)
  }
}

// Function to format markdown content for consistent display
// Simple normalization for audience content: just fix whitespace/newlines
function normalizeMarkdownContent(content: string | undefined): string {
  if (!content) return ''

  return content
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2 (markdown blank line)
    .replace(/\s+$/gm, "") // Remove trailing whitespace
    .replace(/^\s+/gm, "") // Remove leading whitespace
    .trim()
}

function formatMarkdownContent(content: string | undefined): string {
  if (!content) {
    console.warn('Empty content passed to formatMarkdownContent')
    return ''
  }

  // Step 0: Remove any main title since template handles it
  let formatted = content.replace(/^#\s*.*Style.*Rules?.*$/im, '');

  // Step 1: Clean up basic whitespace
  let formatted2 = formatted
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/\s+$/gm, "") // Remove trailing whitespace
    .replace(/^\s+/gm, "") // Remove leading whitespace
    .trim()

  // Step 1.5: Convert section headers like '1. Spelling Conventions' to H2
  formatted2 = formatted2.replace(/^(\d+\.?\s+[^\n]+)$/gm, '## $1');

  // Step 1.6: Convert rule names (e.g. 'Company Name Spelling') to bold paragraph text, not headings
  formatted2 = formatted2.replace(/^\*\*([^*\n]+)\*\*\s*$/gm, '<strong>$1</strong>');
  // Remove any leftover H3/H4 for rule names
  //formatted2 = formatted2.replace(/^#{3,4}\s*([^\n]+)$/gm, '<strong>$1</strong>');

  // Step 1.7: Prevent wraps around spaced dashes/slashes; leave quotes untouched
  // Convert patterns like "foo - bar" or "foo / bar" to use non-breaking spaces
  // so they don't wrap awkwardly, without altering hyphenated words or quoted text.
  // Use [a-zA-Z0-9] instead of \w to avoid matching emoji/Unicode characters
  formatted2 = formatted2.replace(/([a-zA-Z0-9])\s+([\-\/])\s+([a-zA-Z0-9])/g, '$1\u00A0$2\u00A0$3');

  // Step 1.8: Fix broken parentheses across line breaks
  formatted2 = formatted2.replace(/\(\s*\n\s*/g, '(').replace(/\s*\n\s*\)/g, ')');

  // Step 2: Standardize trait headings to H3
  // Convert bold trait names to H3
  formatted2 = formatted2.replace(/^\*\*([^*\n]+)\*\*(?!\n#)/gm, '### $1')
  // Convert ## or #### trait names to H3
  // formatted2 = formatted2.replace(/^#{2,}\s*([^\n]+)$/gm, '### $1')
  // Convert plain trait names at the start of a block to H3 (followed by What It Means/Doesn't Mean or a description)
  formatted2 = formatted2.replace(/^([A-Z][a-zA-Z ]{2,30})\n(?=(What It Means|What It Doesn\'t Mean|[A-Z][a-z]+))/gm, '### $1\n')
  
  // Step 3: Convert "What It Means" and "What It Doesn't Mean" to H4 with double spacing above
  formatted2 = formatted2.replace(/^(?:\*\*\*?|__)?(What It (?:Doesn't )?Means?)(?:\*\*\*?|__)?/gm, '\n\n#### $1');
  // Remove any extra blank lines that may result
  formatted2 = formatted2.replace(/\n{3,}/g, '\n\n');
  
  // Step 4: Fix spacing for headings
  formatted2 = formatted2
    // Add newline after headings if not present
    .replace(/^(#{1,6}\s[^\n]+)(?!\n)/gm, '$1\n')
    // Ensure exactly one blank line before headings (except at start)
    .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')

  // Step 6: Fix spacing for examples (no Right/Wrong text)
  formatted2 = formatted2
    // Normalize spacing after ✅ and ❌ (no Right/Wrong text expected)
    .replace(/(✅|❌)\s*/g, '$1 ')
    // Ensure each example is on its own line
    .replace(/(✅[^\n]+)\s+(❌)/g, '$1\n$2')
    // Add newline after each example if not present
    .replace(/(✅[^\n]+|❌[^\n]+)(?!\n)/g, '$1\n')
    // Ensure examples are grouped together with single line spacing
    .replace(/(✅[^\n]+)\n\n(❌)/g, '$1\n$2')
    // Join orphan trailing letters on the next line BEFORE adding italics
    // Example: "✅ Financial Data Analysis Tool\ns" => "✅ Financial Data Analysis Tools"
    .replace(/^(✅|❌)\s+([^\n]+)\n([a-z]{1,3})(?=\n)/gm, '$1 $2$3')
    // Wrap example text in italics for UI rendering (after joins)
    .replace(/^(✅|❌)\s+(.+)$/gm, '$1 *$2*')

  // Step 7: Fix spacing for lists and arrows
  formatted2 = formatted2
    // Normalize arrow spacing
    .replace(/^→\s*/gm, '→ ')
    // Normalize x mark spacing
    .replace(/^✗\s*/gm, '✗ ')
    // Add newline after list items if not present
    .replace(/^([-→✗]\s[^\n]+)(?!\n)/gm, '$1\n')

  // Step 8: Fix punctuation issues - prevent quotes/periods from breaking to new lines
  formatted2 = formatted2
    // Fix dangling quotes and punctuation
    .replace(/(\w+)\s+([,.!?:;"])(\s*\n)/g, '$1$2$3')
    // Ensure there's no space before periods/commas (exclude " to preserve space before opening quotes)
    .replace(/\s+([,.!?:;])/g, '$1')
    // Fix word breaking with non-breaking space for single character endings
    .replace(/(\w+)(\s*\n\s*)([a-z])(\s*\n)/g, '$1$3$4')

  // Step 9: Fix section spacing
  formatted2 = formatted2
    // Ensure sections are separated by exactly one blank line
    .replace(/\n{3,}/g, '\n\n')
    // Extra spacing before/after What It Means/Doesn't Mean sections
    .replace(/(####\s+What It (?:Doesn't )?Means?)\n/g, '$1\n\n')

  // Step 10: Ensure space after colon
  formatted2 = formatted2.replace(/:(\S)/g, ': $1')

  return formatted2;
}

// Function to validate markdown content
function validateMarkdownContent(content: string | undefined): boolean {
  if (!content || typeof content !== 'string') {
    console.warn('Invalid content passed to validateMarkdownContent')
    return false
  }

  // Clean the content first
  const cleanedContent = content
    .replace(/```markdown\n?/g, '') // Remove markdown code block markers
    .replace(/```\n?/g, '') // Remove any remaining code block markers
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double

  // Check for basic markdown structure
  const hasHeaders = /^#{1,6}\s.+/m.test(cleanedContent)
  const hasFormatting = /[*_`]/.test(cleanedContent)
  
  if (!hasHeaders) {
    console.warn('Content missing required markdown header')
    return false
  }
  
  // For voice traits, check for trait structure
  if (cleanedContent.toLowerCase().includes('trait')) {
    const hasTraitSections = (
      cleanedContent.includes("What It Means") || 
      cleanedContent.includes("Description") ||
      cleanedContent.includes("What It Doesn't Mean") ||
      cleanedContent.includes("Guidelines") ||
      cleanedContent.includes("Avoid")
    )
    if (!hasTraitSections) {
      console.warn('Voice trait content missing required sections')
    }
    return hasHeaders && hasTraitSections
  }
  
  // For rules, check for example structure
  if (cleanedContent.toLowerCase().includes('rule')) {
    // Accept any of these as valid example lines:
    // ✅ *example text*
    // ❌ *example text*
    const hasCorrect = cleanedContent.match(/(^|\n)✅/)
    const hasIncorrect = cleanedContent.match(/(^|\n)❌/)
    const hasRuleHeader = cleanedContent.match(/^###\s.+/m)
    if (!hasCorrect || !hasIncorrect || !hasRuleHeader) {
      console.warn('Rule content missing required example structure')
      return false
    }
    return true
  }
  
  // If neither traits nor rules, just check for basic markdown
  return hasHeaders && hasFormatting
}

// Add validation function
function validateBrandDetails(details: any) {
  const errors: string[] = []
  
  // Name validation
  if (!details.name || details.name.trim().length === 0) {
    errors.push("Brand name is required")
  } else if (details.name.length > 50) {
    errors.push("Brand name must be 50 characters or less")
  }
  
  // Description validation
  if (!details.brandDetailsDescription || details.brandDetailsDescription.trim().length === 0) {
    errors.push("Brand description is required")
  } else if (details.brandDetailsDescription.length > 2500) {
    errors.push("Brand description must be 2500 characters or less")
  }
  
  // Audience validation
  if (!details.audience || details.audience.trim().length === 0) {
    errors.push("Target audience is required")
  } else if (details.audience.length > 500) {
    errors.push("Target audience must be 500 characters or less")
  }
  
  // Tone is optional - voice is now defined by selected traits
  
  return errors
}

// Function to prepare markdown content for React component rendering
async function prepareMarkdownContent(markdown: string): Promise<string> {
  // Simply return the markdown content - react-markdown will handle the rendering
  return markdown
}

// Helper function to format the current date
function formatDate(): string {
  const date = new Date()
  const day = date.getDate()
  const month = date.toLocaleString("default", { month: "long" })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Generic content for preview
const GENERIC_VOICE_TRAIT_1 = `**Clear & Concise**

What It Means
→ Use simple, direct language that anyone can understand.
→ Break down complex ideas into easy steps.
→ Keep sentences short and to the point.

What It Doesn't Mean
✗ Leaving out important details for the sake of brevity.
✗ Using jargon or technical terms without explanation.
✗ Oversimplifying topics that need nuance.`;

const GENERIC_VOICE_TRAIT_2 = `**Friendly & Approachable**

What It Means
→ Write as if you're talking to a real person.
→ Use a warm, welcoming tone in every message.
→ Encourage questions and feedback.

What It Doesn't Mean
✗ Being overly casual or unprofessional.
✗ Using slang that not everyone will understand.
✗ Ignoring the needs or concerns of your audience.`;

// Shared function to render style guide template (unified template, isPreview for free-tier flow)
export async function renderStyleGuideTemplate({
  brandDetails,
  useAIContent = false,
  isPreview = false,
  userEmail,
}: {
  brandDetails: any;
  useAIContent?: boolean;
  isPreview?: boolean;
  userEmail?: string | null;
}): Promise<string> {
  console.log(`[renderStyleGuideTemplate] isPreview=${isPreview}, useAIContent=${useAIContent}`);

  const template = await loadTemplate("style_guide_template");
  const formattedDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const brandName = brandDetails.name || "Your Brand";
  // Contact footer: use user email when available; fallback for preview/unauthed
  const contactFooter =
    userEmail && userEmail.trim()
      ? `Questions about ${brandName} content? Contact ${userEmail.trim()}.`
      : `Questions? Contact the ${brandName} content team.`;
  const brandDesc =
    brandDetails.brandDetailsDescription ||
    brandDetails.brandDetailsText ||
    "An innovative company focused on delivering exceptional results.";
  const audience = brandDetails.audience || "Business professionals and decision makers";

  // Contact section
  const contactSection = userEmail && userEmail.trim()
    ? `Need help applying these guidelines? Have questions about ${brandName}'s voice?\n\n**Contact:** ${userEmail.trim()}`
    : `Need help applying these guidelines? Have questions about ${brandName}'s voice?\n\nContact the ${brandName} content team.`;

  let result = template
    .replace(/{{DD MONTH YYYY}}/g, formattedDate)
    .replace(/{{brand_name}}/g, brandName)
    .replace(/{{brand_description}}/g, brandDesc)
    .replace(/{{brand_audience}}/g, audience)
    .replace(/{{contact_section}}/g, contactSection);

  if (!useAIContent) {
    result = result
      .replace(/{{audience_section}}/g, "_Your audience will be described here._")
      .replace(/{{how_to_use_section}}/g, getHowToUseContent(brandName))
      .replace(/{{brand_voice_traits}}/g, `${GENERIC_VOICE_TRAIT_1}\n\n${GENERIC_VOICE_TRAIT_2}`)
      .replace(/{{style_rules}}/g, "_Unlock to see Style Rules._")
      .replace(/{{before_after_examples}}/g, "_Unlock to see Before/After examples._")
      .replace(/{{word_list}}/g, "_Unlock to see Word List._");
    return await prepareMarkdownContent(result);
  }

  const validatedDetails = {
    name: brandName,
    brandDetailsDescription: brandDesc,
    audience: audience.trim() || "general audience",
    traits: brandDetails.traits || [],
    keywords: Array.isArray(brandDetails.keywords) ? brandDetails.keywords : [],
    productsServices: Array.isArray(brandDetails.productsServices)
      ? brandDetails.productsServices
      : [],
    formalityLevel: brandDetails.formalityLevel || "",
    readingLevel: brandDetails.readingLevel || "",
    englishVariant: brandDetails.englishVariant || "american",
  };

  if (!validatedDetails.audience || validatedDetails.audience.toLowerCase() === "general audience") {
    try {
      const aud = await generateAudienceSummary({
        name: validatedDetails.name,
        brandDetailsDescription: validatedDetails.brandDetailsDescription,
      });
      if (aud.success && aud.content) validatedDetails.audience = aud.content.trim();
    } catch (_e) {
      /* ignore */
    }
  }

  let traitsContext: string | undefined;
  let brandVoiceContent: string;

  if (brandDetails.previewTraits) {
    brandVoiceContent = brandDetails.previewTraits;
    const traitNames = (validatedDetails.traits as any[])
      .map((t) => (typeof t === "string" ? t : t?.name))
      .filter(Boolean);
    traitsContext = [traitNames.length ? `Selected Traits: ${traitNames.join(", ")}` : "", brandVoiceContent]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 4000);
  } else {
    const traitsResult = await generateBrandVoiceTraits(validatedDetails);
    if (traitsResult.success && traitsResult.content) {
      brandVoiceContent = traitsResult.content;
      const traitNames = (validatedDetails.traits as any[])
        .map((t) => (typeof t === "string" ? t : t?.name))
        .filter(Boolean);
      traitsContext = [traitNames.length ? `Selected Traits: ${traitNames.join(", ")}` : "", brandVoiceContent]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 4000);
    } else {
      brandVoiceContent = "_Could not generate brand voice traits._";
      traitsContext = undefined;
    }
  }

  result = result.replace(/{{brand_voice_traits}}/g, formatMarkdownContent(brandVoiceContent));
  result = result.replace(/{{how_to_use_section}}/g, getHowToUseContent(brandName));

  if (isPreview) {
    const audienceResult = await generateAudienceSection(validatedDetails);
    result = result.replace(
      /{{audience_section}}/g,
      audienceResult.success && audienceResult.content
        ? normalizeMarkdownContent(audienceResult.content)
        : "_Could not generate audience section._"
    );
    result = result.replace(/{{style_rules}}/g, "_Unlock to see Style Rules._");
    result = result.replace(/{{before_after_examples}}/g, "_Unlock to see Before/After examples._");
    result = result.replace(/{{word_list}}/g, "_Unlock to see Word List._");
  } else {
    const [rulesResult, beforeAfterResult, wordListResult, audienceResult] = await Promise.all([
      generateStyleRules(validatedDetails, traitsContext),
      generateBeforeAfterSamples(validatedDetails, traitsContext),
      generateWordList(validatedDetails, traitsContext),
      generateAudienceSection(validatedDetails),
    ]);
    result = result.replace(
      /{{style_rules}}/g,
      rulesResult.success && rulesResult.content ? formatMarkdownContent(rulesResult.content) : "_Could not generate rules._"
    );
    result = result.replace(
      /{{before_after_examples}}/g,
      beforeAfterResult.success && beforeAfterResult.content
        ? beforeAfterResult.content
        : "_Could not generate before/after examples._"
    );
    result = result.replace(
      /{{word_list}}/g,
      wordListResult.success && wordListResult.content ? wordListResult.content : "_Could not generate word list._"
    );
    result = result.replace(
      /{{audience_section}}/g,
      audienceResult.success && audienceResult.content ? normalizeMarkdownContent(audienceResult.content) : "_Could not generate audience._"
    );
  }

  return await prepareMarkdownContent(result);
}

// Render preview-style guide (free-tier: traits + audience + content guidelines, locked sections get placeholders)
export async function renderPreviewStyleGuide({ brandDetails }: { brandDetails: any }): Promise<string> {
  console.log(`[renderPreviewStyleGuide] Generating preview for:`, brandDetails?.name || "not set");
  return renderStyleGuideTemplate({ brandDetails, useAIContent: true, isPreview: true });
}

/**
 * Generate full guide by merging preview content with newly generated locked sections.
 * Preserves the preview the user liked; only generates Style Rules, Before/After, Word List.
 */
export async function renderFullGuideFromPreview({
  previewContent,
  brandDetails,
  userEmail,
}: {
  previewContent: string;
  brandDetails: any;
  userEmail?: string | null;
}): Promise<string> {
  const { replaceSectionInMarkdown } = await import("./content-parser");
  const brandName = brandDetails.name || "Your Brand";
  const contactFooter =
    userEmail && userEmail.trim()
      ? `Questions about ${brandName} content? Contact ${userEmail.trim()}.`
      : `Questions? Contact the ${brandName} content team.`;

  const validatedDetails = {
    name: brandName,
    brandDetailsDescription: brandDetails.brandDetailsDescription || brandDetails.brandDetailsText || "",
    audience: brandDetails.audience || "general audience",
    traits: brandDetails.traits || [],
    keywords: Array.isArray(brandDetails.keywords) ? brandDetails.keywords : [],
    formalityLevel: brandDetails.formalityLevel || "",
    readingLevel: brandDetails.readingLevel || "",
    englishVariant: brandDetails.englishVariant || "american",
  };

  const traitNames = (validatedDetails.traits as any[])
    .map((t) => (typeof t === "string" ? t : t?.name))
    .filter(Boolean);
  const brandVoiceMatch = previewContent.match(/## Brand Voice([\s\S]*?)(?=##|$)/);
  const traitsContext = brandVoiceMatch
    ? [traitNames.length ? `Selected Traits: ${traitNames.join(", ")}` : "", brandVoiceMatch[1].trim()]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 4000)
    : undefined;

  const [rulesResult, beforeAfterResult, wordListResult] = await Promise.all([
    generateStyleRules(validatedDetails, traitsContext),
    generateBeforeAfterSamples(validatedDetails, traitsContext),
    generateWordList(validatedDetails, traitsContext),
  ]);

  const styleRulesContent =
    rulesResult.success && rulesResult.content
      ? formatMarkdownContent(rulesResult.content)
      : "_Could not generate rules._";
  const beforeAfterContent =
    beforeAfterResult.success && beforeAfterResult.content
      ? beforeAfterResult.content
      : "_Could not generate before/after examples._";
  const wordListContent =
    wordListResult.success && wordListResult.content
      ? wordListResult.content
      : "_Could not generate word list._";

  let merged = previewContent;

  // Log before replacement for debugging
  console.log("[renderFullGuideFromPreview] Replacing sections...");

  const beforeRules = merged;
  merged = replaceSectionInMarkdown(merged, "style-rules", `## Style Rules\n\n${styleRulesContent}`);
  if (merged === beforeRules) {
    console.warn("[renderFullGuideFromPreview] Section replacement failed for style-rules, using fallback");
    // Fallback: direct string replacement for placeholder
    merged = merged.replace(
      /## Style Rules\s*\n+_Unlock to see Style Rules\._/g,
      `## Style Rules\n\n${styleRulesContent}`
    );
  }

  const beforeExamples = merged;
  merged = replaceSectionInMarkdown(merged, "examples", `## Before / After\n\n${beforeAfterContent}`);
  if (merged === beforeExamples) {
    console.warn("[renderFullGuideFromPreview] Section replacement failed for examples, using fallback");
    merged = merged.replace(
      /## Before \/ After\s*\n+_Unlock to see Before\/After examples\._/g,
      `## Before / After\n\n${beforeAfterContent}`
    );
  }

  const beforeWordList = merged;
  merged = replaceSectionInMarkdown(merged, "word-list", `## Word List\n\n${wordListContent}`);
  if (merged === beforeWordList) {
    console.warn("[renderFullGuideFromPreview] Section replacement failed for word-list, using fallback");
    merged = merged.replace(
      /## Word List\s*\n+_Unlock to see Word List\._/g,
      `## Word List\n\n${wordListContent}`
    );
  }

  // Update Questions section with user email if available
  const questionsSection = `## Questions?\n\n${contactFooter}`;
  merged = replaceSectionInMarkdown(merged, "questions", questionsSection);

  return merged;
}