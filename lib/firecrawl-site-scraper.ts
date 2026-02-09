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

export interface ScrapeResult {
  success: boolean
  markdown: string
  pagesScraped: number
  error?: string
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
