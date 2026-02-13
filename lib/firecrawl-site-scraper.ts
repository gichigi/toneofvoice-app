/**
 * Smart site scraping via Firecrawl API.
 * - Scrapes homepage first
 * - If homepage content is thin, maps URLs and scrapes 2-3 key subpages (about, company, product)
 * - Returns combined markdown capped for extraction prompt
 */

import Firecrawl from "@mendable/firecrawl-js"

const MIN_HOMEPAGE_CHARS = 2500
const MAX_COMBINED_CHARS = 7500
const MAX_SUBPAGES = 3

// Keywords to prefer when picking subpages
const SUBPAGE_KEYWORDS = /about|company|team|product|features|who-we-are|our-story/i

// JSON extraction schema for brand details (Firecrawl LLM extraction)
const BRAND_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Brand or company name" },
    description: {
      type: "string",
      description:
        "Brand description: 2-3 short paragraphs (3-4 sentences each, 80-120 words total). First person plural (we/our). Paragraph 1: What they do and the space they operate in. Paragraph 2: Who they serve and why that matters. Paragraph 3: What makes them unique or interesting. Sound confident but not corporate. NO marketing fluff, NO filler adjectives (unparalleled, diverse, array, ensuring, empowering, facilitating, leveraging, enabling), NO buzzwords. Every sentence carries real information. Use plain, specific language. Avoid single-sentence paragraphs. Don't start multiple sentences the same way. Make them sound good without overselling. No em dashes.",
    },
    audience: { type: "string", description: "Target audience summary" },
    keywords: {
      type: "array",
      items: { type: "string" },
      maxItems: 25,
      description: "Up to 25 keywords for content marketing and brand voice",
    },
    suggestedTraits: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
      description: "3 brand voice traits",
    },
    productsServices: {
      type: "array",
      items: { type: "string" },
      description:
        "What they offer. Flexible by business model: products, services, programs, campaigns, events, memberships, etc. For charities/nonprofits: programs, initiatives, impact areas.",
    },
  },
  required: ["name", "description", "audience", "keywords", "suggestedTraits"],
}

const BRAND_EXTRACTION_PROMPT = `Extract brand identity from this website.
- name: Brand/company name (1-3 words)
- description: Write 2-3 short paragraphs (3-4 sentences each, 80-120 words total). First person plural (we/our). Cover: (1) What they do and the space they operate in. (2) Who they serve and why that matters. (3) What makes them unique or interesting. Sound confident but not corporate. NO marketing fluff, NO filler adjectives (unparalleled, diverse, array, ensuring, empowering, facilitating, leveraging, enabling, fast-paced, cutting-edge), NO buzzwords, NO vague "solutions". Every sentence must carry real information. Use plain, specific language. Say what they actually do. Avoid single-sentence paragraphs. Don't start multiple sentences the same way. Make them sound good without overselling. The reader should think "yeah, that's us" not "this sounds like a press release". No em dashes.
- audience: Who they serve (demographics, context)
- keywords: Up to 25 high-value keywords for content (products, services, values, industry terms)
- suggestedTraits: Exactly 3 brand voice traits (e.g. warm, professional, bold)
- productsServices: What they offer. Flexible by business model: products, services, programs, campaigns, events, memberships. For charities/nonprofits: programs, initiatives, impact areas.`

export interface ScrapeResult {
  success: boolean
  markdown: string
  pagesScraped: number
  error?: string
}

export interface BrandExtractionResult {
  success: boolean
  name: string
  description: string
  audience: string
  keywords: string[]
  suggestedTraits: string[]
  productsServices: string[]
  pagesScraped: number
  error?: string
}

// Merge extracted data from multiple pages (prefer richer, then union keywords)
function mergeExtractions(
  primary: Record<string, unknown>,
  secondary?: Record<string, unknown>
): Record<string, unknown> {
  if (!secondary) return primary
  const merged = { ...primary }
  // Prefer longer description
  const priDesc = String(merged.description || "").trim()
  const secDesc = String(secondary.description || "").trim()
  if (secDesc.length > priDesc.length) merged.description = secDesc
  // Union keywords, dedupe, cap at 25
  const allKw = [
    ...(Array.isArray(merged.keywords) ? merged.keywords : []),
    ...(Array.isArray(secondary.keywords) ? secondary.keywords : []),
  ].filter((k): k is string => typeof k === "string")
  const seen = new Set<string>()
  merged.keywords = allKw.filter((k) => {
    const lower = k.toLowerCase().trim()
    if (!lower || seen.has(lower)) return false
    seen.add(lower)
    return true
  }).slice(0, 25)
  // Union productsServices, dedupe
  const allPs = [
    ...(Array.isArray(merged.productsServices) ? merged.productsServices : []),
    ...(Array.isArray(secondary.productsServices) ? secondary.productsServices : []),
  ].filter((p): p is string => typeof p === "string")
  const seenPs = new Set<string>()
  merged.productsServices = allPs.filter((p) => {
    const lower = p.toLowerCase().trim()
    if (!lower || seenPs.has(lower)) return false
    seenPs.add(lower)
    return true
  })
  return merged
}

/**
 * Scrape site and extract brand details via Firecrawl JSON extraction.
 * Uses LLM extraction with schema instead of markdown + OpenAI.
 */
export async function scrapeSiteWithJsonExtraction(url: string): Promise<BrandExtractionResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return {
      success: false,
      name: "",
      description: "",
      audience: "",
      keywords: [],
      suggestedTraits: [],
      productsServices: [],
      pagesScraped: 0,
      error: "FIRECRAWL_API_KEY not set",
    }
  }

  const firecrawl = new Firecrawl({ apiKey })

  const scrapeOpts = {
    formats: [
      "markdown",
      {
        type: "json" as const,
        prompt: BRAND_EXTRACTION_PROMPT,
        schema: BRAND_EXTRACTION_SCHEMA,
      },
    ],
    onlyMainContent: true,
  }

  try {
    // 1. Scrape homepage with JSON extraction
    const doc = await firecrawl.scrape(url, scrapeOpts)
    const homepageMd = (doc as { markdown?: string }).markdown ?? ""
    const homepageJson = (doc as { json?: Record<string, unknown> }).json

    let merged = homepageJson && typeof homepageJson === "object" ? { ...homepageJson } : null
    let pagesScraped = 1

    // 2. If homepage is thin, scrape key subpages with JSON extraction and merge
    if (homepageMd.length < MIN_HOMEPAGE_CHARS) {
      try {
        const mapRes = await firecrawl.map(url, { limit: 25 })
        const links = mapRes?.links ?? []
        const base = new URL(url).origin
        const subpages = links
          .map((l) => (typeof l === "string" ? l : (l as { url?: string }).url))
          .filter((u): u is string => !!u && SUBPAGE_KEYWORDS.test(u))
          .slice(0, MAX_SUBPAGES)
          .map((u) => (u.startsWith("http") ? u : new URL(u, base).href))

        for (const subUrl of subpages) {
          try {
            const subDoc = await firecrawl.scrape(subUrl, scrapeOpts)
            const subJson = (subDoc as { json?: Record<string, unknown> }).json
            if (subJson && typeof subJson === "object") {
              merged = mergeExtractions(merged || subJson, subJson)
              pagesScraped++
            }
          } catch {
            // Skip failed subpage
          }
        }
      } catch {
        // Map failed - proceed with homepage only
      }
    }

    if (!merged) {
      return {
        success: false,
        name: "",
        description: "",
        audience: "",
        keywords: [],
        suggestedTraits: [],
        productsServices: [],
        pagesScraped,
        error: "No JSON extraction result from Firecrawl",
      }
    }

    const name = String(merged.name ?? "").trim()
    const description = String(merged.description ?? "").trim()
    const audience = String(merged.audience ?? "").trim()
    const keywords = Array.isArray(merged.keywords)
      ? (merged.keywords as string[]).filter((k) => typeof k === "string").slice(0, 25)
      : []
    const suggestedTraits = Array.isArray(merged.suggestedTraits)
      ? (merged.suggestedTraits as string[]).filter((t) => typeof t === "string").slice(0, 3)
      : []
    const productsServices = Array.isArray(merged.productsServices)
      ? (merged.productsServices as string[]).filter((p) => typeof p === "string")
      : []

    return {
      success: true,
      name: name || "Brand",
      description: description || "",
      audience: audience || "",
      keywords,
      suggestedTraits,
      productsServices,
      pagesScraped,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firecrawl JSON extraction failed"
    console.error("[firecrawl-site-scraper]", msg)
    return {
      success: false,
      name: "",
      description: "",
      audience: "",
      keywords: [],
      suggestedTraits: [],
      productsServices: [],
      pagesScraped: 0,
      error: msg,
    }
  }
}

export async function scrapeSiteForExtraction(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return { success: false, markdown: "", pagesScraped: 0, error: "FIRECRAWL_API_KEY not set" }
  }

  const firecrawl = new Firecrawl({ apiKey })

  try {
    // 1. Scrape homepage (v2 scrape returns Document with .markdown)
    const doc = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    })

    const homepageMd = (doc as { markdown?: string }).markdown ?? ""
    if (!homepageMd || typeof homepageMd !== "string") {
      return { success: false, markdown: "", pagesScraped: 0, error: "No markdown from homepage" }
    }

    let combined = homepageMd.trim()
    let pagesScraped = 1

    // 2. If homepage is thin, discover and scrape key subpages
    if (combined.length < MIN_HOMEPAGE_CHARS) {
      try {
        const mapRes = await firecrawl.map(url, { limit: 25 })
        const links = mapRes?.links ?? []
        const base = new URL(url).origin
        const subpages = links
          .map((l) => (typeof l === "string" ? l : (l as { url?: string }).url))
          .filter((u): u is string => !!u && SUBPAGE_KEYWORDS.test(u))
          .slice(0, MAX_SUBPAGES)
          .map((u) => (u.startsWith("http") ? u : new URL(u, base).href))

        for (const subUrl of subpages) {
          if (combined.length >= MAX_COMBINED_CHARS) break
          try {
            const subDoc = await firecrawl.scrape(subUrl, {
              formats: ["markdown"],
              onlyMainContent: true,
            })
            const subMd = (subDoc as { markdown?: string }).markdown ?? ""
            if (subMd && typeof subMd === "string") {
              combined += `\n\n---\n[Page: ${subUrl}]\n${subMd.trim()}`
              pagesScraped++
            }
          } catch {
            // Skip failed subpage
          }
        }
      } catch {
        // Map failed - proceed with homepage only
      }
    }

    combined = combined.slice(0, MAX_COMBINED_CHARS)
    return { success: true, markdown: combined, pagesScraped }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firecrawl scrape failed"
    console.error("[firecrawl-site-scraper]", msg)
    return { success: false, markdown: "", pagesScraped: 0, error: msg }
  }
}
