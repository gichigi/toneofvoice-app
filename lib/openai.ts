import { OpenAI } from "openai"
import Logger from "./logger"
import { TRAITS, type MixedTrait, type TraitName, isPredefinedTrait, isCustomTrait } from "./traits"

interface GenerationResult {
  success: boolean
  content?: string
  error?: string
}

type ResponseFormat = "json" | "markdown"

async function validateJsonResponse(text: string): Promise<{ isValid: boolean; content?: any; error?: string }> {
  // No validation - just pass through the raw JSON
  return {
    isValid: true,
    content: text
  }
}

async function validateMarkdownResponse(text: string): Promise<{ isValid: boolean; content?: string; error?: string }> {
  try {
    // Basic validation - ensure text is not empty and contains valid UTF-8
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        error: "Empty or whitespace-only response"
      }
    }
    
    // Normalize Unicode characters to ensure consistent encoding
    const normalized = text.normalize('NFC')
    
    return {
      isValid: true,
      content: normalized
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid text format"
    }
  }
}

async function cleanResponse(text: string, format: ResponseFormat): Promise<string> {
  // Remove any markdown code block syntax if it exists
  text = text.replace(/```(json|markdown)\n?/g, "").replace(/```\n?/g, "")
  
  // Remove any leading/trailing whitespace
  text = text.trim()

  // For JSON responses, try to extract JSON if wrapped in markdown
  if (format === "json") {
    // Try to parse and re-stringify to clean up any trailing text
    try {
      // Find the start of JSON (either [ or {)
      const jsonStart = Math.min(
        text.indexOf('[') >= 0 ? text.indexOf('[') : Infinity,
        text.indexOf('{') >= 0 ? text.indexOf('{') : Infinity
      )
      
      if (jsonStart < Infinity) {
        // Try to parse from this point
        let jsonText = text.substring(jsonStart)
        
        // Try to find valid JSON by attempting to parse progressively smaller substrings
        let foundValid = false
        for (let i = jsonText.length; i > 0; i--) {
          try {
            const candidate = jsonText.substring(0, i)
            const parsed = JSON.parse(candidate)
            // If parse succeeds, re-stringify to clean format
            const cleaned = JSON.stringify(parsed)
            text = cleaned
            foundValid = true
            break
          } catch (e) {
            // Continue trying shorter substrings
          }
        }
        
        // If we couldn't find valid JSON, fall back to original text
        if (!foundValid) {
          text = jsonText
        }
      }
    } catch (e) {
      // If all else fails, try the old regex approach
      const arrayMatch = text.match(/\[[\s\S]*\]/)
      const objectMatch = text.match(/\{[\s\S]*\}/)
      
      if (arrayMatch) {
        text = arrayMatch[0]
      } else if (objectMatch) {
        text = objectMatch[0]
      }
    }
  }
  
  return text
}

export async function generateWithOpenAI(
  prompt: string, 
  systemPrompt: string,
  responseFormat: ResponseFormat = "json",
  max_tokens: number = 2000,
  model: string = "gpt-5.2", // Default to GPT-5.2 with reasoning
  reasoningEffort: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" = "medium"
): Promise<GenerationResult> {
  const maxAttempts = 3
  Logger.info("Starting OpenAI generation", { prompt: prompt.substring(0, 100) + "...", format: responseFormat, model, reasoningEffort })
  Logger.debug("Full prompt", { prompt })

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(`OpenAI attempt ${attempt}/${maxAttempts}`)
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const requestParams: any = {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }
      
      // GPT-5+ uses max_completion_tokens + reasoning_effort; older models use max_tokens + temperature
      if (model === "gpt-5.2" || model.startsWith("gpt-5")) {
        requestParams.max_completion_tokens = max_tokens
        requestParams.reasoning_effort = reasoningEffort
      } else {
        requestParams.max_tokens = max_tokens
        requestParams.temperature = 0.4
      }
      
      const response = await openai.chat.completions.create(requestParams)

      const rawResponse = response.choices[0]?.message?.content
      if (!rawResponse) {
        throw new Error("Empty response from OpenAI")
      }

      Logger.debug("Raw OpenAI response", { response: rawResponse })

      // Log token usage information
      if (response.usage) {
        console.log("=".repeat(50))
        console.log("🔢 TOKEN USAGE SUMMARY")
        console.log("=".repeat(50))
        console.log(`Model: ${response.model}`)
        console.log(`Prompt tokens: ${response.usage.prompt_tokens}`)
        console.log(`Completion tokens: ${response.usage.completion_tokens}`) 
        console.log(`Total tokens: ${response.usage.total_tokens}`)
        console.log(`Max tokens requested: ${max_tokens}`)
        console.log("=".repeat(50))
      }

      // Clean the response based on expected format
      const cleanedResponse = await cleanResponse(rawResponse, responseFormat)
      Logger.debug("Cleaned response", { response: cleanedResponse })

      // Skip validation - just return the cleaned response
      Logger.info("OpenAI generation successful", { length: cleanedResponse.length, format: responseFormat })
      return {
        success: true,
        content: cleanedResponse
      }

    } catch (error) {
      if (attempt === maxAttempts) {
        Logger.error(
          "OpenAI generation failed",
          error instanceof Error ? error : new Error("Unknown error"),
          { attempt }
        )
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate content"
        }
      }
      Logger.warn("OpenAI generation attempt failed, retrying", {
        attempt,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  // This should never be reached due to the error handling above
  return {
    success: false,
    error: "Unexpected error in generation"
  }
}

// Helper function to convert predefined trait to markdown format
function predefinedTraitToMarkdown(traitName: TraitName, index: number): string {
  const trait = TRAITS[traitName]
  
  return `### ${index}. ${traitName}

${trait.definition}

***What It Means***

${trait.do.map(item => `→ ${item}`).join('\n')}

***What It Doesn't Mean***

${trait.dont.map(item => `✗ ${item}`).join('\n')}`
}

// Function to generate custom trait description via AI (used by preview which needs 1 trait)
async function generateCustomTraitDescription(traitName: string, brandDetails: any, index: number): Promise<string> {
  const genResult = await generateAllTraitsInOneCall(brandDetails, [traitName]);
  if (genResult.success && genResult.content) return genResult.content.trim();
  console.error("[generateCustomTraitDescription] Failed for", traitName, genResult.error);
  return `### ${index}. ${traitName}

This trait should be tailored specifically to ${brandDetails.name} and their ${brandDetails.audience || "target audience"}.

***What It Means***

→ Use clear, professional language appropriate for your audience
→ Maintain consistent tone and style across all communications
→ Structure content logically for easy comprehension

***What It Doesn't Mean***

✗ Using generic examples that don't reflect your brand's uniqueness
✗ Applying this trait without considering your audience's expectations
✗ Taking this trait to extremes that don't align with your brand context`;
}

// Generate all trait descriptions in a single API call
async function generateAllTraitsInOneCall(brandDetails: any, traitNames: string[]): Promise<GenerationResult> {
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\n• Keywords: ${brandDetails.keywords.slice(0, 25).join(', ')}`
    : '';
  const productsServicesSection = Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
    ? `\n• Products/Services: ${brandDetails.productsServices.slice(0, 12).join(', ')}`
    : '';
  const traitsList = traitNames.map((t, i) => `${i + 1}. ${t}`).join('\n');

  const prompt = `You are a brand voice expert. Generate communication style guidelines for the following traits based on this brand information.

Brand Info:
• Brand Name: ${brandDetails.name}
• What they do: ${brandDetails.brandDetailsDescription}
• Audience: ${brandDetails.audience}${keywordSection}${productsServicesSection}

Traits to generate (${traitNames.length} total):
${traitsList}

For EACH trait, create a description in this EXACT format. Use the exact heading level and structure:

### 1. [TraitName]

[ONE SENTENCE description of what this trait means for this specific brand and why it's important. Explicitly reference the core audience at least once.]

Important constraints for the ONE SENTENCE (3 rules):
- Be neutral and explanatory; never adopt the trait's tone.
- Max 20 words; no first/second person, emojis, or hype.
- Reading level/formality do NOT affect this sentence; they only affect examples.

***What It Means***

→ [Specific actionable writing instruction - around 10 words]
→ [Specific actionable writing instruction - around 10 words]
→ [Specific actionable writing instruction - around 10 words]

***What It Doesn't Mean***

✗ [How the first instruction could be taken too far]
✗ [How the second instruction could be taken too far]
✗ [How the third instruction could be taken too far]

Repeat this block for each trait (### 2. [TraitName], ### 3. [TraitName], etc.). Each "What It Doesn't Mean" should show how its corresponding "What It Means" could be taken too far. Use → (unicode arrow) and ✗ (unicode cross) exactly as shown.`;

  const result = await generateWithOpenAI(
    prompt,
    "You are a brand voice expert creating specific, actionable communication style guidelines.",
    "markdown", 2500, "gpt-5.2", "medium"
  );

  if (result.success && result.content) {
    return { success: true, content: result.content.trim() };
  }
  return { success: false, error: result.error || "Failed to generate traits" };
}

// Main function to generate brand voice traits (single API call for all traits)
export async function generateBrandVoiceTraits(brandDetails: any): Promise<GenerationResult> {
  try {
    if (!brandDetails.traits || !Array.isArray(brandDetails.traits) || brandDetails.traits.length === 0) {
      return { success: false, error: "No traits selected for this brand" };
    }

    const traitNames = brandDetails.traits
      .map((t: any) => (typeof t === 'string' ? t : t?.name))
      .filter(Boolean);
    if (traitNames.length === 0) {
      return { success: false, error: "No valid traits found" };
    }

    console.log(`[generateBrandVoiceTraits] Generating ${traitNames.length} traits in one call:`, traitNames);

    const result = await generateAllTraitsInOneCall(brandDetails, traitNames);

    if (result.success && result.content) {
      console.log(`[generateBrandVoiceTraits] Generated ${traitNames.length} traits successfully`);
      return { success: true, content: result.content };
    }

    return { success: false, error: result.error || "Failed to generate traits" };
  } catch (error) {
    console.error("[generateBrandVoiceTraits] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error generating brand voice traits" };
  }
}

// Generate brand voice traits with preview limits (for preview page)
export async function generateBrandVoiceTraitsPreview(
  brandDetails: any,
  fullCount: number = 1,
  nameCount: number = 2
): Promise<GenerationResult> {
  try {
    if (!brandDetails.traits || !Array.isArray(brandDetails.traits) || brandDetails.traits.length === 0) {
      return { success: false, error: "No traits selected for this brand" }
    }

    const totalNeeded = Math.min(fullCount + nameCount, brandDetails.traits.length)
    const availableTraits = brandDetails.traits.slice(0, totalNeeded)

    // Generate full descriptions for first N traits
    const fullTraitPromises = availableTraits.slice(0, fullCount).map((trait: any, i: number) => {
      const index = i + 1
      const traitName = typeof trait === 'string' ? trait : trait?.name
      return generateCustomTraitDescription(traitName, brandDetails, index)
    })

    const results = await Promise.allSettled(fullTraitPromises)
    const fullTraits: string[] = []
    results.forEach(r => { if (r.status === 'fulfilled' && r.value) fullTraits.push(r.value) })

    const nameOnlyTraits: string[] = availableTraits.slice(fullCount, totalNeeded).map((t: any) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)

    const payload = { fullTraits, nameOnlyTraits }
    return { success: true, content: JSON.stringify(payload) }
  } catch (error) {
    console.error("Error in generateBrandVoiceTraitsPreview:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Generate before/after examples (5 content types, 1-2 sentences each)
export async function generateBeforeAfterSamples(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  try {
    const productsServicesSection =
      Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
        ? `\nProducts/Services: ${brandDetails.productsServices.slice(0, 15).join(", ")}`
        : "";
    const prompt = `Create exactly 5 "Before → After" content transformation examples for ${brandDetails.name}. Each tied to a content type.

Brand: ${brandDetails.name}
Description: ${brandDetails.brandDetailsDescription}
Audience: ${brandDetails.audience}${productsServicesSection}
${traitsContext ? `Traits: ${traitsContext.slice(0, 800)}` : ""}

Content types (one example each):
1. Homepage headline
2. Email subject line
3. Social media post
4. Error or empty state message
5. Blog intro paragraph

For each: "Before" = plausible generic copy (not absurdly bad). "After" = on-brand, demonstrates voice. 1-2 sentences each.

Return JSON:
{"examples":[{"contentType":"Homepage Headline","before":"...","after":"..."}, ...]}`;

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert copywriter who transforms generic content into distinctive brand voice. Return strict JSON only.",
      "json",
      800,
      "gpt-5.2",
      "medium"
    );

    if (!result.success || !result.content) {
      return { success: false, error: result.error || "Failed to generate before/after samples" };
    }

    try {
      const parsed = JSON.parse(result.content);
      const examples = Array.isArray(parsed?.examples) ? parsed.examples : [];
      const contentTypes = [
        "Homepage Headline",
        "Email Subject Line",
        "Social Media Post",
        "Error or Empty State Message",
        "Blog Intro Paragraph",
      ];
      const markdown = examples
        .slice(0, 5)
        .map((ex: any, i: number) => {
          const ct = ex.contentType || contentTypes[i] || `Example ${i + 1}`;
          return `### ${ct}\n\n**Before:** ${ex.before || ""}\n\n**After:** ${ex.after || ""}`;
        })
        .join("\n\n");
      return { success: true, content: markdown };
    } catch (e) {
      return { success: false, error: "Invalid before/after JSON response" };
    }
  } catch (error) {
    console.error("Error in generateBeforeAfterSamples:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/* Function to generate style guide rules
export async function generateStyleGuideRules(brandDetails: any, section: string): Promise<GenerationResult> {
  const prompt = `Create style guide rules for ${brandDetails.name}'s ${section} section.
  
Brand Description: ${brandDetails.brandDetailsDescription}
Target Audience: ${brandDetails.audience}

Consider how ${brandDetails.audience} will interact with the content. Rules should help content creators effectively communicate with this audience.

Provide 1 specific rule in this EXACT format:

[rule description]
✅ Right: [clear example that follows the rule]
❌ Wrong: [example that breaks the rule]

Each rule must:
1. Start with the rule name
2. Include a Right example with '✅ Right:'
3. Include a Wrong example with '❌ Wrong:'
4. Use markdown formatting for emphasis
5. Be specific and actionable

Provide exactly ONE rule for each section, not a list. Do NOT include more than one rule. Only output one rule block in the format below.

Example format:

Use active voice
✅ The team completed the project on time
❌ The project was completed by the team

Use British English spelling
✅ Colour
❌ Color`

  return generateWithOpenAI(prompt, "You are an expert content strategist who creates clear, actionable style guide rules.", "markdown")
}*/

// Generate exactly 25 style rules (one per canonical category)
export async function generateStyleRules(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  console.log("[generateStyleRules] Generating 25 rules for:", brandDetails?.name);

  try {
    const rulesSchema = await import("./rules-schema");
    const { getAllowedCategoriesPromptText, validateRules } = rulesSchema;
    const { renderRulesMarkdown } = await import("./rules-renderer");

    const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : "";
    const allowedCategories = getAllowedCategoriesPromptText();
    const keywordSection =
      Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
        ? `\nKeywords: ${brandDetails.keywords.slice(0, 25).join(", ")}`
        : "";
    const productsServicesSection =
      Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
        ? `\nProducts/Services: ${brandDetails.productsServices.slice(0, 12).join(", ")}`
        : "";
    const traitNames = Array.isArray(brandDetails.traits)
      ? brandDetails.traits.map((t: any) => (typeof t === "string" ? t : t?.name)).filter(Boolean)
      : [];

    const prompt = `Create exactly 25 writing style rules for this brand. Use ONE rule per category from the list below. Rules support brand voice traits.

Brand:
- Name: ${brandDetails.name}
- Audience: ${brandDetails.audience}
- Description: ${brandDetails.brandDetailsDescription}
- Formality: ${brandDetails.formalityLevel || "Neutral"}
- Reading Level: ${brandDetails.readingLevel || "10-12"}
- English Variant: ${brandDetails.englishVariant || "american"}${keywordSection}${productsServicesSection}
${traitNames.length ? `- Selected Traits: ${traitNames.join(", ")}` : ""}
${traitsSection}

Allowed categories (use each exactly once, in this order):
${allowedCategories}

Return STRICT JSON array:
[{"category": "Category Name", "title": "Category Name", "description": "One sentence rule 8-12 words", "examples": {"good": "Example", "bad": "Example"}}]

Requirements:
- Each rule description must FRONT-LOAD the reason for the chosen rule based on the brand details given, then the concrete rule. Use instructive verbs (e.g. "Maintain a refined voice by…", "Provide a supportive tone by…"). Example: "Maintain a refined voice by limiting contractions." or "Provide a supportive tone by avoiding emojis in product copy." — one trait per rule, not listing all traits.
- Use lowercase for the trait when it appears as the descriptor: "Stay direct by…", "Keep refined by…", "Be supportive by…" — capitalise only the first word (the verb), not the trait name.
- Pick the single trait that best fits each rule; vary which traits you use across rules.
- Voice-shaping rules (1-7) must reference Selected Traits by name in that front-loaded reason.
- Examples must sound like ${brandDetails.name} speaking to ${brandDetails.audience}
- Description 8-12 words max
- Exactly 25 rules, one per category
- Format times without extra spaces (e.g. "10:00 am" not "10: 00 am")
- Use a space before quoted text (e.g. "Click \"Mark as duplicate\"" not "Click\"Mark as duplicate\"")
- In the Emojis rule, do NOT use emoji characters in examples; use plain text only (avoids encoding artifacts)`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const result = await generateWithOpenAI(
        prompt,
        "You are a writing style guide expert. Return strict JSON array only.",
        "json",
        5500,
        "gpt-5.2",
        "medium"
      );

      if (!result.success || !result.content) {
        if (attempts === maxAttempts) {
          return { success: false, error: result.error || "Failed after retries" };
        }
        continue;
      }

      try {
        const parsed = JSON.parse(result.content);
        const rules = Array.isArray(parsed) ? parsed : [parsed];
        const validation = validateRules(rules);
        if (validation.valid.length >= 20) {
          const markdown = renderRulesMarkdown(validation.valid.slice(0, 25));
          return { success: true, content: markdown };
        }
      } catch (e) {
        console.error("[generateStyleRules] Parse/validation failed:", e);
      }
    }
    return { success: false, error: "Failed to generate valid rules after retries" };
  } catch (error) {
    console.error("[generateStyleRules] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


// Audience section: primary + optional secondary audience
export async function generateAudienceSection(brandDetails: any): Promise<GenerationResult> {
  const keywordSection =
    Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
      ? `\nKeywords: ${brandDetails.keywords.slice(0, 25).join(", ")}`
      : "";
  const productsServicesSection =
    Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
      ? `\nProducts/Services: ${brandDetails.productsServices.slice(0, 15).join(", ")}`
      : "";
  const prompt = `Based on this brand, write an Audience section (markdown) with:
1. **Primary audience** (2-4 sentences): Who they are, what they care about, how to address them
2. **Secondary audience** (optional, 1-2 sentences): If applicable, a secondary audience and how tone shifts. Omit if brand has single audience.

Brand: ${brandDetails.name}
What they do: ${brandDetails.brandDetailsDescription}
Audience hint: ${brandDetails.audience || "general audience"}${keywordSection}${productsServicesSection}

Output markdown only, no code blocks. Use ### Primary Audience and ### Secondary Audience as subheadings.`;

  return generateWithOpenAI(
    prompt,
    "You are a brand strategist who writes precise audience definitions.",
    "markdown",
    400,
    "gpt-5.2",
    "medium"
  );
}

// Content guidelines: short-form, long-form, product/UX copy
export async function generateContentGuidelines(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  const traitsSection = traitsContext ? `\nTraits: ${traitsContext.slice(0, 600)}\n` : "";
  const prompt = `Write brand-specific Content Guidelines (markdown) with 3 subsections. Each has 3-4 bullets derived from the brand's traits and audience. No generic platitudes.

### Short-form
_social, ads, subject lines_
- 3-4 bullets tailored to this brand

### Long-form
_blogs, newsletters, case studies_
- 3-4 bullets tailored to this brand

### Product and UX copy
_buttons, errors, onboarding_
- 3-4 bullets tailored to this brand

Brand: ${brandDetails.name}
Description: ${brandDetails.brandDetailsDescription}
Audience: ${brandDetails.audience}${traitsSection}

Output markdown only.`;

  return generateWithOpenAI(
    prompt,
    "You are a content strategist who creates actionable, brand-specific guidelines.",
    "markdown",
    800,
    "gpt-5.2",
    "medium"
  );
}

// How to Use: mostly static template, brand name injected
export function getHowToUseContent(brandName: string): string {
  return `This document outlines the rules for brand voice, spelling, grammar, and formatting across all content channels. Anyone writing or publishing content for ${brandName} should follow these guidelines.

**Who should use this document**
Content team members, freelancers, agencies, and anyone creating branded materials—including when briefing AI tools.

**When to reference it**
- Starting new campaigns or content projects
- Onboarding new writers or contractors
- Reviewing drafts for brand consistency
- Setting up AI writing assistants (paste into system prompt)

**Using with AI tools**
Paste this guide into your AI tool's system prompt or instructions to ensure generated content matches your brand voice. Include the Brand Voice and Style Rules sections for best results.`;
}

// Word list: preferred terms, avoid terms, spelling/usage
export async function generateWordList(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  const keywords =
    Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
      ? brandDetails.keywords.slice(0, 25).join(", ")
      : "none";
  const productsServicesSection =
    Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
      ? `\nProducts/Services: ${brandDetails.productsServices.slice(0, 15).join(", ")}`
      : "";
  const traitsSection = traitsContext ? `\nTraits: ${traitsContext.slice(0, 400)}` : "";
  const ukUs = brandDetails.englishVariant === "british" ? "UK" : "US";
  const prompt = `Create a Word List for this brand. Return JSON:
{"preferredTerms":["Use X not Y",...],"avoidTerms":["Avoid X",...],"spellingUsage":["X not Y",...]}

- **preferredTerms** (5-8): Brand-specific language. Use keywords: ${keywords}. Format "Use X not Y"
- **avoidTerms** (5-8): Words that conflict with brand voice. Derived from traits. Format "Avoid X"
- **spellingUsage** (3-5): Contested spellings for ${ukUs} English and industry. Format "X not Y"

Brand: ${brandDetails.name}
Description: ${brandDetails.brandDetailsDescription}${productsServicesSection}${traitsSection}

Return JSON only.`;

  const result = await generateWithOpenAI(
    prompt,
    "You are a brand voice expert. Return strict JSON only.",
    "json",
    600,
    "gpt-5.2",
    "medium"
  );

  if (!result.success || !result.content) return result;

  try {
    const parsed = JSON.parse(result.content);
    const pref = Array.isArray(parsed.preferredTerms) ? parsed.preferredTerms : [];
    const avoid = Array.isArray(parsed.avoidTerms) ? parsed.avoidTerms : [];
    const spell = Array.isArray(parsed.spellingUsage) ? parsed.spellingUsage : [];
    const lines: string[] = [];
    if (pref.length) {
      lines.push("### Preferred Terms", ...pref.map((s: string) => `- ${s}`), "");
    }
    if (avoid.length) {
      lines.push("### Avoid Terms", ...avoid.map((s: string) => `- ${s}`), "");
    }
    if (spell.length) {
      lines.push("### Spelling and Usage", ...spell.map((s: string) => `- ${s}`));
    }
    return { success: true, content: lines.join("\n").trim() };
  } catch (e) {
    return { success: false, error: "Invalid word list JSON" };
  }
}

// Generate keywords for content marketing and brand voice
export async function generateKeywords(params: { name: string; brandDetailsDescription: string; audience?: string }): Promise<GenerationResult> {
  const { name, brandDetailsDescription, audience = 'general audience' } = params
  
  const prompt = `Generate up to 25 high-value keywords for this brand's content marketing and communications.

- Brand
  - Name: ${name}
  - Description: ${brandDetailsDescription}
  - Audience: ${audience}

- Guidelines
  - Focus on terms the audience actually searches for and uses
  - Include product/service names, features, and industry terminology
  - Avoid generic buzzwords like "innovative", "leading", "solution"
  - Each keyword MUST be 20 characters or less (including spaces)
  - Prefer 1-2 words; use 3 words only if under 20 chars
  - Choose terms that would appear in blog posts, marketing copy, and user communications
  
- Output format
  - Return clean JSON: {"keywords": ["keyword1", "keyword2", ...]}
  - 15-25 keywords`

  return generateWithOpenAI(
    prompt,
    "You are a keyword expert focused on content marketing terms.",
    "json",
    400,
    "gpt-5.2",
    "low"
  )
}

// Generate a short internal audience description (1–2 sentences, ~25–40 words)
export async function generateAudienceSummary(params: { name: string; brandDetailsDescription: string }): Promise<GenerationResult> {
  const { name, brandDetailsDescription } = params
  const prompt = `Based on the brand below, write a concise audience description (1–2 sentences, ~25–40 words). Keep it practical and specific. Output plain text only.

Brand Name: ${name}
What they do: ${brandDetailsDescription}`

  return generateWithOpenAI(
    prompt,
    "You are a brand strategist who writes precise, practical audience descriptions.",
    "markdown",
    200,
    "gpt-4o-mini"
  )
}

// Function to generate a concise brand summary from a single textarea
export async function generateBrandSummary(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Write a single paragraph (30–40 words) that starts with the brand name and summarizes the brand using all key info, keywords, and terms from the input below.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown", 2000, "gpt-5.2", "low");
}

// Function to extract just the brand name from brandDetailsText
export async function extractBrandName(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Extract only the brand name from the text below. Return just the brand name, nothing else.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand analyst. Extract only the brand name from the given text.", "markdown", 2000, "gpt-5.2", "low");
}

// Generate trait suggestions based on brand information
export async function generateTraitSuggestions(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Based on this brand information, suggest exactly 3 brand voice traits that would work best for this brand.

Brand Name: ${brandDetails.name || 'Brand'}
Description: ${brandDetails.brandDetailsDescription || brandDetails.brandDetailsText}
Audience: ${brandDetails.audience || brandDetails.targetAudience}

Available traits: Assertive, Witty, Direct, Inspiring, Warm, Inclusive, Playful, Supportive, Refined

Return ONLY a JSON array with exactly 3 trait names, like this:
["Warm", "Professional", "Inspiring"]`

  return generateWithOpenAI(
    prompt,
    "You are a brand voice expert. Choose the 3 most fitting traits for this brand.",
    "json",
    100,
    "gpt-5.2",
    "medium"
  )
}
