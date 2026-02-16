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

async function main() {
  const baseUrl = getArgValue("--baseUrl") || process.env.BASE_URL || "http://localhost:3000"
  const urls = getArgValues("--url")
  const descs = getArgValues("--desc")

  const cases = []

  for (const u of urls) cases.push({ kind: "url", value: u })
  for (const d of descs) cases.push({ kind: "desc", value: d })

  if (cases.length === 0) {
    cases.push(
      { kind: "url", value: "https://www.tesco.com" },
      { kind: "url", value: "https://stripe.com" },
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
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err?.message || err)
  process.exit(1)
})

