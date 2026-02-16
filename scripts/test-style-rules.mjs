import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config({ path: ".env" })

function truncate(text, max = 500) {
  const t = String(text ?? "").trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + "…"
}

async function generateStyleRules({ openai, brandDetails, traitsContext }) {
  const keywordSection =
    Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
      ? `\nKeywords: ${brandDetails.keywords.slice(0, 25).join(", ")}`
      : ""
  const productsServicesSection =
    Array.isArray(brandDetails.productsServices) && brandDetails.productsServices.length
      ? `\nProducts/Services: ${brandDetails.productsServices.slice(0, 12).join(", ")}`
      : ""
  const traitNames = Array.isArray(brandDetails.traits)
    ? brandDetails.traits.map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean)
    : []

  const prompt = `Create exactly 25 writing style rules for this brand. Use ONE rule per category from the list below. Rules support brand voice traits.

Brand:
- Name: ${brandDetails.name}
- Audience: ${brandDetails.audience}
- Description: ${brandDetails.brandDetailsDescription}
- Formality: ${brandDetails.formalityLevel || "Neutral"}
- Reading Level: ${brandDetails.readingLevel || "10-12"}
- English Variant: ${brandDetails.englishVariant || "american"}${keywordSection}${productsServicesSection}
${traitNames.length ? `- Selected Traits: ${traitNames.join(", ")}` : ""}
${traitsContext ? `\nTraits Context:\n${traitsContext}\n` : ""}

Allowed categories (use each exactly once, in this order):
1. Contractions
2. Active vs. Passive Voice
3. Emojis
4. Exclamation Points
5. Sentence Length
6. Slang and Jargon
7. Pronouns and Point of View
8. UK vs. US English
9. Serial Comma
10. Capitalisation
11. Numbers and Numerals
12. Abbreviations
13. Lists and Formatting
14. Quotation Marks
15. Hyphens and Dashes
16. Italics and Bold
17. Tone and Formality
18. Common Phrases
19. Industry Terminology
20. Brand Voice
21. Accessibility
22. Mobile-Friendly Language
23. Call to Action
24. Metaphors and Analogies
25. Consistency and Parallelism

Return STRICT JSON array:
[{"category": "Category Name", "title": "Category Name", "description": "One sentence rule 8-12 words", "examples": {"good": "Example", "bad": "Example"}}]

Requirements:
- Write rule descriptions naturally and concisely. Add a brief explanation of why when it clarifies the rule (e.g., "Use contractions to sound conversational and warm" or "Keep sentences under 20 words—shorter sentences are easier to scan").
- Avoid repetitive sentence patterns. Vary sentence structure and opening verbs across rules so no two descriptions feel the same.
- Pick the single trait that best fits each rule; vary which traits you use across rules.
- Examples must sound like ${brandDetails.name} speaking to ${brandDetails.audience}
- Description 8-12 words max
- Exactly 25 rules, one per category
- Format times without extra spaces (e.g. "10:00 am" not "10: 00 am")
- Use a space before quoted text (e.g. "Click \\"Mark as duplicate\\"" not "Click\\"Mark as duplicate\\"")
- In the Emojis rule, do NOT use emoji characters in examples; use plain text only (avoids encoding artifacts)
- IMPORTANT: Never use em dashes (—) anywhere in your output. Use hyphens (-) or rewrite sentences instead.`

  const res = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: "You are a tone of voice guide expert. Return strict JSON array only." },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 5500,
    reasoning_effort: "low",
  })

  const text = res.choices?.[0]?.message?.content
  if (!text) throw new Error("Empty response from OpenAI")
  return text.trim()
}

function evaluateRules(jsonText) {
  const parsed = JSON.parse(jsonText)
  const rules = Array.isArray(parsed) ? parsed : [parsed]

  let hasWhy = 0
  let repeatedPatterns = 0

  rules.forEach((rule) => {
    const desc = rule.description || ""

    // Check for "why" (contains explanation)
    if (desc.includes(" to ") || desc.includes(" — ") || desc.includes(" because ") || desc.includes(" so ")) {
      hasWhy++
    }

    // Check for repetitive opening patterns
    if (desc.match(/^(Use|Avoid|Keep|Choose|Write|Add|Include|Ensure|Stay|Be)/)) {
      repeatedPatterns++
    }
  })

  return {
    totalRules: rules.length,
    withWhy: hasWhy,
    withWhyPercent: rules.length ? Math.round((hasWhy / rules.length) * 100) : 0,
    repeatedOpeners: repeatedPatterns,
    repeatedPercent: rules.length ? Math.round((repeatedPatterns / rules.length) * 100) : 0,
    rules: rules,
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY in env.")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey })

  const brandDetails = {
    name: "Second Home",
    brandDetailsDescription:
      "Second Home is a flexible coworking space with cultural programming designed to help ambitious teams collaborate across disciplines. Located in London and Lisbon with hot desks, dedicated desks, and private offices.",
    audience: "Founders, creatives, and ambitious teams looking for flexible workspace",
    traits: ["Warm", "Inspiring"],
    keywords: ["workspace", "community", "collaboration", "cultural"],
    productsServices: ["Hot desks", "Dedicated desks", "Private offices", "Community events"],
    formalityLevel: "Conversational",
    readingLevel: "10-12",
    englishVariant: "british",
  }

  const traitsContext = `Selected Traits: Warm, Inspiring

**Warm**
What It Means
→ Create a human connection through genuine, approachable language.
→ Sound like you genuinely care about your audience.
→ Encourage a sense of community and belonging.

What It Doesn't Mean
✗ Being overly casual or unprofessional.
✗ Sacrificing clarity for friendliness.
✗ Ignoring the needs of your audience.

**Inspiring**
What It Means
→ Motivate action through optimistic, forward-looking language.
→ Celebrate achievements and possibilities.
→ Encourage ambition without being preachy.

What It Doesn't Mean
✗ Being saccharine or unrealistic.
✗ Overselling or making false promises.
✗ Motivating only one type of person or approach.`

  console.log("=" . repeat(80))
  console.log("STYLE RULES TEST: Second Home")
  console.log("=" . repeat(80))

  try {
    const jsonText = await generateStyleRules({ openai, brandDetails, traitsContext })
    const evaluation = evaluateRules(jsonText)

    console.log("\n✅ Generated " + evaluation.totalRules + " rules")
    console.log("\n📊 EVALUATION:")
    console.log(`  Rules with "why" explanation: ${evaluation.withWhy}/${evaluation.totalRules} (${evaluation.withWhyPercent}%)`)
    console.log(`  Repetitive opening verbs: ${evaluation.repeatedOpeners} (${evaluation.repeatedPercent}%)`)

    console.log("\n📋 SAMPLE RULES (first 5):")
    evaluation.rules.slice(0, 5).forEach((rule, i) => {
      console.log(`\n  ${i + 1}. ${rule.title}`)
      console.log(`     "${rule.description}"`)
      console.log(`     ✅ ${truncate(rule.examples.good, 60)}`)
      console.log(`     ❌ ${truncate(rule.examples.bad, 60)}`)
    })

    console.log("\n🎯 ASSESSMENT:")
    if (evaluation.withWhyPercent >= 60) {
      console.log("  ✓ Strong mix of explanations (60%+ have 'why')")
    } else if (evaluation.withWhyPercent >= 40) {
      console.log("  ~ Moderate explanations (" + evaluation.withWhyPercent + "%)")
    } else {
      console.log("  ✗ Low explanations (" + evaluation.withWhyPercent + "% - too formulaic)")
    }

    if (evaluation.repeatedPercent <= 40) {
      console.log("  ✓ Good variation in sentence structure (≤40% repetitive)")
    } else {
      console.log("  ✗ Too repetitive (" + evaluation.repeatedPercent + "% use same opening verbs)")
    }

    console.log("\n" + "=" . repeat(80))
  } catch (err) {
    console.error("\n❌ FAILED:", err?.message || err)
    process.exit(1)
  }
}

main()
