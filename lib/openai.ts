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
  model: string = "gpt-4o-mini" // Default to faster model
): Promise<GenerationResult> {
  const maxAttempts = 3
  Logger.info("Starting OpenAI generation", { prompt: prompt.substring(0, 100) + "...", format: responseFormat, model })
  Logger.debug("Full prompt", { prompt })

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(`OpenAI attempt ${attempt}/${maxAttempts}`)
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: max_tokens
      })

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

// Function to generate custom trait description via AI
async function generateCustomTraitDescription(traitName: string, brandDetails: any, index: number): Promise<string> {
  console.log(`🔧 [DEBUG] generateCustomTraitDescription called for trait: ${traitName}`)
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\n• Keywords: ${brandDetails.keywords.slice(0, 15).join(', ')}`
    : '';
  
  const prompt = `You are a brand voice expert. Generate communication style guidelines for the trait "${traitName}" based on this brand information.

Brand Info:
• Brand Name: ${brandDetails.name}
• What they do: ${brandDetails.description}
• Audience: ${brandDetails.audience}${keywordSection}

Create the trait description in this EXACT format:

### ${index}. ${traitName}

[ONE SENTENCE description of what this trait means for this specific brand and why it's important. Explicitly reference the core audience at least once (e.g., "instills confidence in healthcare providers", "helps CFOs make faster decisions").]

Important constraints for the ONE SENTENCE description (3 rules):
- Be neutral and explanatory; never adopt the trait’s tone.
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

Each "What It Doesn't Mean" should show how its corresponding "What It Means" could be taken too far - the same concept but pushed to an extreme. Focus on writing style, tone, and language use. Use → (unicode arrow) and ✗ (unicode cross) exactly as shown.`;

  const result = await generateWithOpenAI(prompt, "You are a brand voice expert creating specific, actionable communication style guidelines.", "markdown", 800, "gpt-4o");
  
  if (result.success && result.content) {
    return result.content.trim()
  } else {
    // Fallback if AI generation fails
    console.error(`Failed to generate trait description for ${traitName}:`, result.error)
    return `### ${index}. ${traitName}

This trait should be tailored specifically to ${brandDetails.name} and their ${brandDetails.audience || 'target audience'}.

***What It Means***

→ Use clear, professional language appropriate for your audience
→ Maintain consistent tone and style across all communications
→ Structure content logically for easy comprehension

***What It Doesn't Mean***

✗ Using generic examples that don't reflect your brand's uniqueness
✗ Applying this trait without considering your audience's expectations
✗ Taking this trait to extremes that don't align with your brand context`
  }
}

// Main function to generate brand voice traits using user's selected traits
export async function generateBrandVoiceTraits(brandDetails: any): Promise<GenerationResult> {
  try {
    // Check if we have selected traits
    if (!brandDetails.traits || !Array.isArray(brandDetails.traits) || brandDetails.traits.length === 0) {
      return {
        success: false,
        error: "No traits selected for this brand"
      }
    }

    console.log(`🎯 Processing ${brandDetails.traits.length} selected traits:`, brandDetails.traits)

    // Create array of trait generation promises for parallel processing
    const traitPromises = brandDetails.traits.map((trait: any, i: number) => {
      const index = i + 1
      
      if (typeof trait === 'string') {
        // Generate AI description for ALL traits (both predefined and custom)
        console.log(`🎨 Generating AI description for trait: ${trait}`)
        return generateCustomTraitDescription(trait, brandDetails, index)
      } else if (trait && typeof trait === 'object') {
        // Handle MixedTrait objects - generate AI descriptions for ALL traits
        if (isPredefinedTrait(trait)) {
          console.log(`🎨 Generating AI description for predefined trait: ${trait.name}`)
          return generateCustomTraitDescription(trait.name, brandDetails, index)
        } else if (isCustomTrait(trait)) {
          console.log(`🎨 Generating AI description for custom trait: ${trait.name}`)
          return generateCustomTraitDescription(trait.name, brandDetails, index)
        }
      }
      return Promise.resolve("") // Fallback for invalid traits
    })

    // Execute all trait generations in parallel with error resilience
    console.log(`🚀 Starting parallel generation of ${traitPromises.length} traits...`)
    const traitResults = await Promise.allSettled(traitPromises)
    
    // Filter successful results and log any failures
    const traitMarkdown: string[] = []
    traitResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        traitMarkdown.push(result.value)
      } else if (result.status === 'rejected') {
        console.error(`❌ Trait ${i+1} failed:`, result.reason)
      }
    })

    // Require minimum 2 out of 3 traits to succeed (or all if less than 3)
    const minRequired = Math.min(2, brandDetails.traits.length)
    if (traitMarkdown.length < minRequired) {
      console.error(`❌ Only ${traitMarkdown.length} out of ${brandDetails.traits.length} traits succeeded (minimum ${minRequired} required)`)
      return {
        success: false,
        error: `Only ${traitMarkdown.length} out of ${brandDetails.traits.length} traits could be generated (minimum ${minRequired} required)`
      }
    }

    const finalContent = traitMarkdown.join('\n\n')
    console.log(`✅ Generated brand voice traits successfully (${traitMarkdown.length} traits)`)
    
    return {
      success: true,
      content: finalContent
    }
    
  } catch (error) {
    console.error("Error in generateBrandVoiceTraits:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error generating brand voice traits"
    }
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

// Generate preview-specific style rules (limited count) matching core rules format
export async function generatePreviewRules(brandDetails: any, traitsContext?: string, count: number = 3): Promise<GenerationResult> {
  console.log('============================================')
  console.log('[generatePreviewRules] FUNCTION CALLED')
  console.log('[generatePreviewRules] Brand:', brandDetails?.name, 'Count:', count)
  console.log('============================================')
  
  try {
    console.log('[generatePreviewRules] About to import rules-schema...')
    const rulesSchema = await import('./rules-schema')
    console.log('[generatePreviewRules] rules-schema imported successfully')
    
    console.log('[generatePreviewRules] About to import rules-renderer...')
    const rulesRenderer = await import('./rules-renderer')
    console.log('[generatePreviewRules] rules-renderer imported successfully')
    
    const { getAllowedCategoriesPromptText, validateRules } = rulesSchema
    const { renderRulesMarkdown } = rulesRenderer
    
    console.log('[generatePreviewRules] All imports successful')
    
    const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : ''
    const styleConstraints = `\nStyle Constraints:\n- Formality: ${brandDetails.formalityLevel || 'Neutral'} (Professional: avoid contractions; Casual: allow contractions; Very Formal: use third person)\n- Reading Level: ${brandDetails.readingLevel || '10-12'} (6–8: short sentences, simple vocab; 13+: technical precision allowed)\n- English Variant: ${brandDetails.englishVariant || 'american'} (apply spelling and punctuation accordingly)`
    const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
      ? `\nBrand Keywords (use naturally in examples where helpful):\n- ${brandDetails.keywords.slice(0, 15).join('\n- ')}`
      : ''

    const allowedCategories = getAllowedCategoriesPromptText()

    const prompt = `You are a writing style guide expert. Based on the brand info below, create exactly ${count} specific writing style rules that support and reinforce the brand voice traits for this brand.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • What they do: ${brandDetails.description}

${traitsSection}
${styleConstraints}
${keywordSection}
${Array.isArray(brandDetails.traits) && brandDetails.traits.length ? `\nSelected Traits: ${brandDetails.traits.join(', ')}` : ''}
${Array.isArray(brandDetails.traits) && brandDetails.traits.length ? `\nSelected Traits: ${brandDetails.traits.join(', ')}` : ''}
${Array.isArray(brandDetails.traits) && brandDetails.traits.length ? `\nSelected Traits: ${brandDetails.traits.join(', ')}` : ''}

CRITICAL: Choose ONLY from these allowed categories. Reject content/tone/strategy topics (e.g., Clarity, Positive Language, Playful Language, Technical Terms, Success Stories, Technical Terminology).

Allowed Categories:
${allowedCategories}

Instructions:
- Prioritize rules that reflect the type of brand (online/offline, B2B/B2C, etc.) and support the chosen brand voice traits.
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Return STRICT JSON array format: [{"category": "Contractions", "title": "Contractions", "description": "Avoid contractions to maintain our Authoritative tone", "examples": {"good": "We will help you streamline workflows", "bad": "We'll help you streamline workflows"}}]
- Description must be 8–12 words max. In ~60% of rules, explicitly reference 1–2 of the Selected Traits by name (e.g., "supports our Direct and Thoughtful voice", "reinforces our Authoritative tone").
- Examples should be 6–12 words and MUST reflect the brand voice described in the Traits Context above. Write examples as if ${brandDetails.name} is speaking to ${brandDetails.audience}. Include brand/context words where helpful.

Example JSON for TechFlow (a B2B SaaS productivity platform for remote teams - Direct + Supportive + Authoritative traits):
[
  {
    "category": "Contractions",
    "title": "Contractions",
    "description": "Avoid contractions to maintain our Authoritative tone",
    "examples": {
      "good": "We will help you streamline workflows",
      "bad": "We'll help you streamline workflows"
    }
  },
  {
    "category": "Capitalisation",
    "title": "Capitalisation",
    "description": "Capitalize product names to support our Direct voice",
    "examples": {
      "good": "TechFlow Dashboard",
      "bad": "techflow dashboard"
    }
  },
  {
    "category": "Pronouns",
    "title": "Pronouns",
    "description": "Use third person to reinforce our Supportive voice",
    "examples": {
      "good": "Users can customize their dashboard settings",
      "bad": "You can customize your dashboard settings"
    }
  }
]

Return ONLY valid JSON array with exactly ${count} rules.`

    // Generate rules with validation and repair loop
    let validRules: any[] = []
    let attempts = 0
    const maxAttempts = 3

    while (validRules.length < count && attempts < maxAttempts) {
      attempts++

    const result = await generateWithOpenAI(
      prompt,
        "You are a writing style guide expert. Return strict JSON only.",
        "json",
      2000,
      "gpt-4o"
    )

    if (!result.success || !result.content) {
        if (attempts === maxAttempts) {
          return { success: false, error: result.error || 'Failed to generate preview rules after retries' }
        }
        continue
      }

      try {
        console.log(`[generatePreviewRules] Raw JSON response (first 500 chars):`, result.content.substring(0, 500))
        const parsed = JSON.parse(result.content)
        const rules = Array.isArray(parsed) ? parsed : [parsed]
        console.log(`[generatePreviewRules] Attempt ${attempts}: Parsed ${rules.length} rules from JSON`)
        
        const validation = validateRules(rules)
        console.log(`[generatePreviewRules] Validation: ${validation.valid.length} valid, ${validation.invalid.length} invalid`)
        
        if (validation.invalid.length > 0) {
          console.log('[generatePreviewRules] Invalid rules:', JSON.stringify(validation.invalid.map(r => r.category)))
        }
        
        validRules = validation.valid
        
        // If we have invalid rules and haven't reached max attempts, try to repair them
        if (validation.invalid.length > 0 && attempts < maxAttempts && validRules.length < count) {
          console.log(`[generatePreviewRules] Attempt ${attempts}: ${validRules.length} valid, ${validation.invalid.length} invalid. Retrying...`)
          
          // Create repair prompt for invalid rules
          const repairPrompt = `The following rules use invalid categories. Replace them with rules using ONLY these allowed categories:

${allowedCategories}

Invalid rules to replace:
${JSON.stringify(validation.invalid, null, 2)}

Brand context:
- Name: ${brandDetails.name}
- Audience: ${brandDetails.audience}
- Type: ${brandDetails.description}

Return ${validation.invalid.length} replacement rules as JSON array using ONLY allowed categories.`

          const repairResult = await generateWithOpenAI(
            repairPrompt,
            "You are a writing style guide expert. Return strict JSON only.",
            "json",
            1000,
            "gpt-4o"
          )

          if (repairResult.success && repairResult.content) {
            try {
              const repairedParsed = JSON.parse(repairResult.content)
              const repairedRules = Array.isArray(repairedParsed) ? repairedParsed : [repairedParsed]
              const repairedValidation = validateRules(repairedRules)
              validRules = [...validRules, ...repairedValidation.valid]
            } catch (e) {
              console.error('[generatePreviewRules] Failed to parse repair response:', e)
            }
          }
        }

        // If we have enough valid rules, break
        if (validRules.length >= count) {
          break
        }
  } catch (error) {
        console.error('[generatePreviewRules] Failed to parse JSON:', error)
        if (attempts === maxAttempts) {
          return { success: false, error: 'Failed to parse rules JSON after retries' }
        }
      }
    }

    // Take only the requested count
    const finalRules = validRules.slice(0, count)
    
    console.log(`[generatePreviewRules] Final rules count: ${finalRules.length}`)
    
    if (finalRules.length === 0) {
      console.log('[generatePreviewRules] No valid rules generated, returning empty')
      // Return empty content instead of error to avoid breaking the preview
      return { success: true, content: '' }
    }

    // Render to markdown
    const markdown = renderRulesMarkdown(finalRules)
    
    console.log(`[generatePreviewRules] Successfully generated ${finalRules.length} rules, markdown length: ${markdown.length}`)
    
    return { success: true, content: markdown }
  } catch (error) {
    console.error('[generatePreviewRules] Error:', error)
    console.error('[generatePreviewRules] Stack:', error instanceof Error ? error.stack : 'No stack')
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Generate before/after content samples (limited count) - return JSON
export async function generateBeforeAfterSamples(brandDetails: any, traitsContext?: string, count: number = 3): Promise<GenerationResult> {
  try {
    const prompt = `Create exactly ${count} "Before → After" content transformation examples for the ${brandDetails.name} brand.

Brand Details:
- Name: ${brandDetails.name}
- Description: ${brandDetails.description}
- Target Audience: ${brandDetails.audience}
${traitsContext ? `- Brand Voice Traits: ${traitsContext.slice(0, 1000)}` : ''}

Generate ${count} pairs showing how generic content transforms to match this brand's voice. Each pair should:
- Be ≤12 words each (both before and after)
- Show this brand's personality in the "After" version
- Balance all selected brand voice traits - don't overemphasize one trait at the expense of others
- Be relevant to the business type
- Have obvious context (no channel labels needed)
- Make the "Before" generic, "After" distinctly on-brand

Return as JSON with this exact structure:
{
  "examples": [
    { "before": "Try our pancakes today.", "after": "Taste the cosmos." }
  ]
}

Create ${count} similar transformations that feel natural for ${brandDetails.name} and their ${brandDetails.audience} audience.`

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert copywriter who transforms generic content into distinctive brand voice. Return strict JSON only.",
      "json",
      400,
      "gpt-4o"
    )

    if (!result.success || !result.content) {
      return { success: false, error: result.error || 'Failed to generate before/after samples' }
    }

    return { success: true, content: result.content }
  } catch (error) {
    console.error('Error in generateBeforeAfterSamples:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/* Function to generate style guide rules
export async function generateStyleGuideRules(brandDetails: any, section: string): Promise<GenerationResult> {
  const prompt = `Create style guide rules for ${brandDetails.name}'s ${section} section.
  
Brand Description: ${brandDetails.description}
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

// Function to generate the entire core style guide in one go
export async function generateFullCoreStyleGuide(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  console.log('[generateFullCoreStyleGuide] Generating core style guide for:', brandDetails?.name)
  
  try {
    const rulesSchema = await import('./rules-schema')
    const { getAllowedCategoriesPromptText } = rulesSchema
    
    const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : ''

    const allowedCategories = getAllowedCategoriesPromptText()

    const prompt = `Create exactly 25 writing style rules in markdown format for this brand.

- Brand
  - Name: ${brandDetails.name}
  - Audience: ${brandDetails.audience}
  - Description: ${brandDetails.description}
  - Formality: ${brandDetails.formalityLevel || 'Neutral'}
  - Reading Level: ${brandDetails.readingLevel || '10-12'}
  - English Variant: ${brandDetails.englishVariant || 'american'}
  - Keywords: ${Array.isArray(brandDetails.keywords) && brandDetails.keywords.length ? brandDetails.keywords.slice(0, 15).join(', ') : 'None'}

${traitsSection}

- Allowed Categories
${allowedCategories}

- Rules format
  - ### N. Category Name
  - One sentence rule (8–12 words)
  - ✅ Good example in brand voice
  - ❌ Bad example in brand voice
  
- Critical instructions
  - Examples must sound like ${brandDetails.name} speaking to ${brandDetails.audience}
  - No duplicate categories
  - Exactly 25 rules`

    // Generate markdown rules directly
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      
      const result = await generateWithOpenAI(
        prompt,
        "You are a writing style guide expert. Generate clean markdown with exactly 25 numbered rules.",
        "markdown",
        5000,
        "gpt-4o"
      )

      if (!result.success || !result.content) {
        if (attempts === maxAttempts) {
          console.error('[generateFullCoreStyleGuide] Failed after all attempts:', result.error)
          return { success: false, error: result.error || 'Failed to generate core rules after retries' }
        }
        continue
      }

      console.log(`[generateFullCoreStyleGuide] Success! Generated ${result.content.length} chars`)
      return { success: true, content: result.content }
    }

    return { success: false, error: 'Failed to generate rules after all attempts' }
  } catch (error) {
    console.error('[generateFullCoreStyleGuide] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to generate the entire complete style guide in one go
export async function generateCompleteStyleGuide(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : '';
  const styleConstraints = `\nStyle Constraints:\n- Formality: ${brandDetails.formalityLevel || 'Neutral'} (Professional: avoid contractions; Casual: allow contractions; Very Formal: use third person)\n- Reading Level: ${brandDetails.readingLevel || '10-12'} (6–8: short sentences, simple vocab; 13+: technical precision allowed)\n- English Variant: ${brandDetails.englishVariant || 'american'} (apply spelling and punctuation accordingly)`;
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\nBrand Keywords (use naturally in examples where helpful):\n- ${brandDetails.keywords.slice(0, 15).join('\n- ')}`
    : '';
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a comprehensive set of writing style rules that support and reinforce the brand voice traits for this brand, covering all the detailed topics listed.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • What they do: ${brandDetails.description}

${traitsSection}
${styleConstraints}
${keywordSection}

Instructions:
- Each main section should be H2 (##) without numbers (e.g., "## Spelling Conventions").
- Each rule name should be H3 heading (###) with sequential numbering from 1 onwards.
- Do NOT break lines for dashes, slashes, or quotes—keep them in the same line as the text.
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Do NOT include general brand, marketing, or content strategy rules.
- Each rule must:
  1. Start with an H3 heading with sequential number and keyword (e.g., "### 1. Company Name Spelling", "### 2. Proper Nouns").
  2. Give a **ONE SENTENCE** description of the rule (8–16 words). In ~60% of rules, explicitly reference 1–2 of the Selected Traits by name (e.g., "supports our Direct and Thoughtful voice", "reinforces our Authoritative tone").
  3. Include a ✅ example and a ❌ example on separate lines. Examples MUST reflect the brand voice described in the Traits Context above. Write examples as if ${brandDetails.name} is speaking to ${brandDetails.audience}.
  4. Be formatted in markdown.
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
- **IMPORTANT**: Put each ✅ and ❌ example on separate lines with line breaks between them.
- Organize the rules into the following sections and topics, in this order:

## Spelling Conventions
   - ### 1. Capitalisation of Months of the Year
   - ### 2. Capitalisation of Seasons & Directions
   - ### 3. Company Name Spelling
   - ### 4. Complex vs. Simple Words
   - ### 5. Hyphenation in Heritage Terms
   - ### 6. Possessives
   - ### 7. Proper Nouns
   - ### 8. Spelling for Loanwords
   - ### 9. Spelling of Internet Terms
   - ### 10. UK vs. US English

## Grammar & Mechanics
   - ### 11. Abbreviated Words
   - ### 12. Acronyms
   - ### 13. Active vs. Passive Voice
   - ### 14. Capitalisation
   - ### 15. Compound Adjectives
   - ### 16. Contractions
   - ### 17. eg / ie / etc.
   - ### 18. Emojis
   - ### 19. Jargon Translation
   - ### 20. Job Titles
   - ### 21. Languages
   - ### 22. Sentence Case
   - ### 23. Title Case
   - ### 24. Upper Case

## Punctuation
   - ### 25. Accents
   - ### 26. Ampersands
   - ### 27. Apostrophes
   - ### 28. Asterisks
   - ### 29. At Symbols
   - ### 30. Colons
   - ### 31. Commas
   - ### 32. Ellipses
   - ### 33. Ellipsis Spacing
   - ### 34. Em Dash
   - ### 35. En Dash
   - ### 36. Exclamation Points
   - ### 37. Hash Symbols
   - ### 38. Hyphens
   - ### 39. Multiple Punctuation
   - ### 40. Parentheses
   - ### 41. Periods
   - ### 42. Pipes
   - ### 43. Question Marks
   - ### 44. Quotation Marks
   - ### 45. Semicolons
   - ### 46. Slashes
   - ### 47. Special Characters

## Formatting
   - ### 48. Alignment
   - ### 49. Bold and Italics
   - ### 50. Bullet Points
   - ### 51. Coloured Text
   - ### 52. Numbered Lists
   - ### 53. Spacing
   - ### 54. Strikethrough

## Digital & Web
   - ### 55. Alt Text
   - ### 56. Button Capitalisation
   - ### 57. Buttons
   - ### 58. Call-to-Action Text
   - ### 59. Character Limits for Inputs
   - ### 60. Checkboxes
   - ### 61. Email Addresses
   - ### 62. Empty State Guidance
   - ### 63. Error Message Tone
   - ### 64. File Extensions
   - ### 65. Forms
   - ### 66. Image Captions
   - ### 67. Loading State Messaging
   - ### 68. Meta Descriptions
   - ### 69. Radio Buttons
   - ### 70. Social Media Hashtags
   - ### 71. URL & Link Formatting
   - ### 72. UTM & Tracking Rules
   - ### 73. Video Transcripts

## Numbers & Data
   - ### 74. Big Numbers
   - ### 75. Dates
   - ### 76. Decimals
   - ### 77. Fractions
   - ### 78. Measurements
   - ### 79. Millions & Billions
   - ### 80. Money
   - ### 81. Numerals
   - ### 82. Percentages
   - ### 83. Ranges
   - ### 84. Telephone Numbers
   - ### 85. Temperature
   - ### 86. Time & Time Zones
   - ### 87. Weights
   - ### 88. Whole Numbers

## People & Inclusive Language
   - ### 89. Age References
   - ### 90. Disability-related Terms
   - ### 91. Gender & Sexuality Terminology
   - ### 92. Heritage & Nationality Terminology
   - ### 93. Mental Health Terminology
   - ### 94. Neurodiversity References
   - ### 95. Person-first Language
   - ### 96. Socio-economic References

## Points of View
   - ### 97. First vs. Third Person
   - ### 98. Pronouns

## Style Consistency
   - ### 99. AI-Generated Content Flags
   - ### 100. Consistency Review
   - ### 101. Disclaimers & Fine Print
   - ### 102. Readability Grade Target
   - ### 103. Sentence Length Limit
   - ### 104. Serial Comma
   - ### 105. Slang & Jargon
   - ### 106. Source Attribution
   - ### 107. Third-Party Brand References
   - ### 108. Titles and Headings
   - ### 109. Trademarks

Example rules:

### 3. Company Name Spelling
Always capitalize "${brandDetails.name}" consistently to maintain brand identity and our professional voice.
✅ Right: ${brandDetails.name} offers innovative solutions for businesses.
❌ Wrong: ${brandDetails.name.toLowerCase()} offers innovative solutions for businesses.

### 11. Abbreviated Words
Spell out abbreviated words on first use to maintain clarity for all readers.
✅ The World Health Organization (WHO) recommends...
❌ WHO recommends... (without introduction)

### 71. URL & Link Formatting
Format web addresses consistently and use descriptive link text for accessibility.
✅ Read our [privacy policy](https://example.com/privacy) for details.
❌ Click here: https://example.com/privacy

### 104. Serial Comma
Use the Oxford comma in lists of three or more items for clarity.
✅ We offer consulting, development, and support services.
❌ We offer consulting, development and support services.

### 81. Numerals 1–9
Write out numbers one through nine; use numerals for 10 and above.
✅ We have five products and 12 team members.
❌ We have 5 products and twelve team members.

### 16. Contractions
Avoid contractions to support our authoritative tone.
✅ We do not accept late submissions.
❌ We don't accept late submissions.

### 49. Bold and Italics
Use bold for emphasis and key terms; use italics for foreign words and publication titles.
✅ Our **core values** include respect for all *stakeholders*.
❌ Our *core values* include respect for all **stakeholders**.

### 95. Person-first Language
Put the person before their condition or characteristic to show respect and dignity.
✅ We support employees with disabilities through accessible design.
❌ We support disabled employees through accessible design.

---
- Generate the rules in the exact order above with sequential ordering.
- Use markdown H2 (##) for each main section WITHOUT numbers (e.g., "## Spelling Conventions").
- Use H3 (###) for each rule name WITH sequential numbers (e.g., "### 1. Company Name Spelling").
- Start numbering from 1 and continue sequentially through all sections.
- Do not skip any rule or section.
- Generate exactly 98 rules total across all sections as listed above.
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
`;
  return generateWithOpenAI(prompt, "You are a writing style guide expert.", "markdown", 9000, "gpt-4o");
}

// Generate keywords for content marketing and brand voice
export async function generateKeywords(params: { name: string; description: string; audience?: string }): Promise<GenerationResult> {
  const { name, description, audience = 'general audience' } = params
  
  const prompt = `Generate 8-10 high-value keywords for this brand's content marketing and communications.

- Brand
  - Name: ${name}
  - Description: ${description}
  - Audience: ${audience}

- Guidelines
  - Focus on terms the audience actually searches for and uses
  - Include product/service names, features, and industry terminology
  - Avoid generic buzzwords like "innovative", "leading", "solution"
  - Each keyword MUST be 20 characters or less (including spaces)
  - Prefer 1-2 words; use 3 words only if under 20 chars
  - Choose terms that would appear in blog posts, marketing copy, and user communications
  
- Output format
  - Return clean JSON: {"keywords": ["keyword1", "keyword2", "keyword3"]}
  - Must contain exactly 8-10 keywords, no more, no less`

  return generateWithOpenAI(
    prompt,
    "You are a keyword expert focused on content marketing terms.",
    "json",
    400,
    "gpt-4o-mini"
  )
}

// Generate a short internal audience description (1–2 sentences, ~25–40 words)
export async function generateAudienceSummary(params: { name: string; description: string }): Promise<GenerationResult> {
  const { name, description } = params
  const prompt = `Based on the brand below, write a concise audience description (1–2 sentences, ~25–40 words). Keep it practical and specific. Output plain text only.

Brand Name: ${name}
What they do: ${description}`

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
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown");
}

// Function to extract just the brand name from brandDetailsText
export async function extractBrandName(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Extract only the brand name from the text below. Return just the brand name, nothing else.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand analyst. Extract only the brand name from the given text.", "markdown");
}

// Generate trait suggestions based on brand information
export async function generateTraitSuggestions(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Based on this brand information, suggest exactly 3 brand voice traits that would work best for this brand.

Brand Name: ${brandDetails.name || 'Brand'}
Description: ${brandDetails.description || brandDetails.brandDetailsText}
Audience: ${brandDetails.audience || brandDetails.targetAudience}

Available traits: Authoritative, Witty, Direct, Inspiring, Warm, Inclusive, Optimistic, Passionate, Playful, Supportive, Sophisticated, Thoughtful

Return ONLY a JSON array with exactly 3 trait names, like this:
["Warm", "Professional", "Inspiring"]`

  return generateWithOpenAI(
    prompt,
    "You are a brand voice expert. Choose the 3 most fitting traits for this brand.",
    "json",
    100,
    "gpt-4o"
  )
}
