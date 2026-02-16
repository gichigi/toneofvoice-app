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
- Write rule descriptions naturally. Most should include why the rule matters, but use varied sentence structures to avoid monotony: "Use contractions to sound conversational and warm." or "Stick with British spelling throughout." or "Keep sentences under 20 words—shorter sentences are easier to scan." or "Multiple exclamation marks feel jarring and lose impact."
- Break monotony by using different sentence patterns: some with "to" connectors, some with periods separating the action from the benefit, some as observations. Vary opening words and structure.
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

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY in env.")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey })

  const brandDetails = {
    name: "Notion",
    brandDetailsDescription:
      "Notion is a connected workspace that combines notes, docs, project management, and wikis in one place. Teams use Notion to organize knowledge, collaborate on projects, and build custom workflows. It's designed to be flexible and powerful while staying simple to use.",
    audience: "Knowledge workers, teams, and creators who want to organize their work and collaborate effectively",
    traits: ["Empowering", "Clear"],
    keywords: ["workspace", "productivity", "collaboration", "organization", "docs"],
    productsServices: ["Notes", "Docs", "Wikis", "Project management", "Databases"],
    formalityLevel: "Professional",
    readingLevel: "10-12",
    englishVariant: "american",
  }

  const traitsContext = `Selected Traits: Empowering, Clear

**Empowering**
What It Means
→ Show people what they can do and how to do it.
→ Help users feel confident and in control.
→ Celebrate what people create and accomplish.

What It Doesn't Mean
✗ Being patronizing or over-explaining basics.
✗ Making exaggerated promises about capabilities.
✗ Ignoring real limitations or challenges.

**Clear**
What It Means
→ Use simple, direct language that anyone can understand.
→ Break down complex features into easy steps.
→ Remove unnecessary words and jargon.

What It Doesn't Mean
✗ Being overly simple or dumbing things down.
✗ Skipping important details for brevity.
✗ Using robotic or impersonal language.`

  try {
    const jsonText = await generateStyleRules({ openai, brandDetails, traitsContext })
    const rules = JSON.parse(jsonText)

    console.log("=" . repeat(80))
    console.log("ALL 25 RULES - Notion")
    console.log("=" . repeat(80))

    rules.forEach((rule, i) => {
      console.log(
        `\n${i + 1}. ${rule.title}\n   "${rule.description}"\n   ✅ ${truncate(rule.examples.good, 65)}\n   ❌ ${truncate(rule.examples.bad, 65)}`
      )
    })
  } catch (err) {
    console.error("\n❌ FAILED:", err?.message || err)
    process.exit(1)
  }
}

main()
