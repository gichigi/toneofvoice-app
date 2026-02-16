import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config({ path: ".env" })

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return null
  const v = process.argv[idx + 1]
  if (!v || v.startsWith("--")) return null
  return v
}

function getArgValues(flag) {
  const values = []
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === flag) {
      const v = process.argv[i + 1]
      if (v && !v.startsWith("--")) values.push(v)
    }
  }
  return values
}

function truncate(text, max = 500) {
  const t = String(text ?? "").trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + "…"
}

function buildAudiencePrompt(input) {
  const keywordsLine = input.keywords?.length ? input.keywords.slice(0, 25).join(", ") : ""
  const productsLine = input.productsServices?.length ? input.productsServices.slice(0, 15).join(", ") : ""

  return `Write an Audience section for the brand below.

Brand: ${truncate(input.brandName, 120)}
What they do: ${truncate(input.brandDetailsDescription, 700)}
Audience hint: ${truncate(input.audience || "general audience", 350)}
Keywords (optional): ${truncate(keywordsLine, 350)}
Products/services (optional): ${truncate(productsLine, 350)}

Output markdown only, with these headings exactly:
### Audience (Overview)
### Primary Audience
### Secondary Audience

Formatting rules:
- No bullets. No numbered lists. No tables. No code blocks.
- 1-2 sentences per paragraph. Keep sentences short.

Length rules:
- Overview: exactly 1 sentence.
- Primary: exactly 2 paragraphs, 2 sentences each (4 sentences total).
- Secondary: exactly 1 paragraph, 2 sentences.

Detail rules:
- Describe who they are and their context/mindset (goals, motivations, anxieties).
- Do not include writing advice or tone guidance.
- Be specific but don't invent facts. If unsure, use "often" or "typically."
- Never use em dashes (—). Use hyphens (-) or rewrite.`
}

async function extractBrandDetails({ baseUrl, url, description }) {
  const res = await fetch(`${baseUrl}/api/extract-website`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, description }),
  })

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Extract failed: invalid JSON response (${res.status})`)
  }

  if (!res.ok || !data?.success) {
    const msg = data?.message || data?.error || `Extract failed (${res.status})`
    throw new Error(msg)
  }

  return {
    brandName: data.brandName,
    brandDetailsDescription: data.brandDetailsDescription,
    audience: data.audience,
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    productsServices: Array.isArray(data.productsServices) ? data.productsServices : [],
  }
}

async function generateAudienceSection({ openai, prompt }) {
  const res = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: "You write precise, brand-specific audience sections for tone of voice guidelines." },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 450,
    reasoning_effort: "low",
  })

  const text = res.choices?.[0]?.message?.content
  if (!text) throw new Error("Empty response from OpenAI")
  return text.trim()
}

async function evaluateStyleRules(content) {
  const lines = content.split("\n")
  let hasWhy = 0
  let repeatedPatterns = 0
  let descriptions = []

  for (const line of lines) {
    if (line.startsWith("### ") || line.startsWith("## ")) {
      // Skip headers
      continue
    }
    const desc = line.trim()
    if (!desc || desc.match(/^(✅|❌|→|✗)/)) {
      // Skip examples and lists
      continue
    }

    descriptions.push(desc)

    // Check for "why" (contains explanation)
    if (desc.includes(" to ") || desc.includes(" — ") || desc.includes(" because ") || desc.includes(" so ")) {
      hasWhy++
    }

    // Check for repetitive opening patterns
    if (desc.match(/^(Use|Avoid|Keep|Choose|Write|Add|Include|Ensure|Stay|Be)/)) {
      repeatedPatterns++
    }
  }

  return {
    totalDescriptions: descriptions.length,
    withWhy: hasWhy,
    withWhyPercent: descriptions.length ? Math.round(hasWhy / descriptions.length * 100) : 0,
    repeatedOpeners: repeatedPatterns,
    repeatedPercent: descriptions.length ? Math.round(repeatedPatterns / descriptions.length * 100) : 0,
    sample: descriptions.slice(0, 3),
  }
}

async function main() {
  const baseUrl = getArgValue("--baseUrl") || process.env.BASE_URL || "http://localhost:3000"
  const urls = getArgValues("--url")
  const descs = getArgValues("--desc")
  const testRules = getArgValue("--test-rules") !== null

  const cases = []

  for (const u of urls) cases.push({ kind: "url", value: u })
  for (const d of descs) cases.push({ kind: "desc", value: d })

  if (cases.length === 0) {
    cases.push(
      { kind: "url", value: "https://www.secondhome.io" },
      { kind: "desc", value: "We make payroll and HR simpler for small UK businesses by handling payslips, pensions, and compliance in one place. Our customers are busy founders and office managers who want confidence everything is correct, on time, and easy to understand. We compete on clarity, support, and removing admin stress." }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY in env.")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey })

  console.log(`Base URL: ${baseUrl}`)
  console.log(`Cases: ${cases.length}`)

  for (const c of cases) {
    const label = c.kind === "url" ? c.value : truncate(c.value, 60)
    console.log("\n" + "=".repeat(80))
    console.log(`CASE: ${c.kind.toUpperCase()} | ${label}`)
    console.log("=".repeat(80))

    const extracted = await extractBrandDetails({
      baseUrl,
      url: c.kind === "url" ? c.value : undefined,
      description: c.kind === "desc" ? c.value : undefined,
    })

    console.log(`Brand: ${extracted.brandName}`)
    console.log(`Audience hint: ${truncate(extracted.audience, 160) || "(none)"}`)

    const prompt = buildAudiencePrompt(extracted)
    const audienceSection = await generateAudienceSection({ openai, prompt })

    console.log("\n--- Prompt ---\n" + prompt)
    console.log("\n--- Output ---\n" + audienceSection)

    if (testRules) {
      console.log("\n--- Testing Style Rules ---")
      try {
        const rulesRes = await fetch(`${baseUrl}/api/generate-styleguide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandDetails: {
              name: extracted.brandName,
              brandDetailsDescription: extracted.brandDetailsDescription,
              audience: extracted.audience,
              traits: ["Professional", "Clear"],
              keywords: extracted.keywords || [],
              productsServices: extracted.productsServices || [],
              formalityLevel: "Professional",
              readingLevel: "10-12",
              englishVariant: "american",
            },
          }),
        })

        let rulesData
        try {
          rulesData = await rulesRes.json()
        } catch {
          throw new Error(`Rules API failed: invalid JSON (${rulesRes.status})`)
        }

        if (!rulesRes.ok || !rulesData?.success) {
          const msg = rulesData?.message || rulesData?.error || `API failed (${rulesRes.status})`
          throw new Error(msg)
        }

        // Extract and evaluate just the style rules section
        const rulesMatch = rulesData.styleGuide?.match(/## Style Rules\s*\n([\s\S]*?)(?=##|$)/)
        const rulesContent = rulesMatch ? rulesMatch[1] : rulesData.styleGuide

        const evaluation = await evaluateStyleRules(rulesContent)
        console.log(`\n✓ Generated ${evaluation.totalDescriptions} rules`)
        console.log(`  ${evaluation.withWhy}/${evaluation.totalDescriptions} rules have "why" explanation (${evaluation.withWhyPercent}%)`)
        console.log(`  Repetitive openers: ${evaluation.repeatedPercent}%`)
        console.log(`\n  Sample descriptions:`)
        evaluation.sample.forEach((desc, i) => {
          console.log(`    ${i + 1}. ${truncate(desc, 85)}`)
        })
      } catch (err) {
        console.log(`✗ Rules test failed: ${err?.message || err}`)
      }
    }
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err?.message || err)
  process.exit(1)
})

