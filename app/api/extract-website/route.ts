import { NextResponse } from "next/server"
import { generateWithOpenAI, generateAudienceSummary, generateKeywords, generateTraitSuggestions } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"
import { scrapeSiteForExtraction, scrapeSiteWithJsonExtraction } from "@/lib/firecrawl-site-scraper"
import * as cheerio from "cheerio"

// Define interfaces for brand details
interface TargetAudienceDetail {
  demographic: {
    age: string
    occupation: string
    location: string
  }
  interestsValues: string[]
  context: string
  needsPainPoints: string
}

interface BrandDetails {
  name: string
  industry: string
  description: string
  targetAudience: TargetAudienceDetail | string
}

interface ProcessedBrandDetails extends Omit<BrandDetails, 'targetAudience'> {
  targetAudience: string
  _rawTargetAudience?: TargetAudienceDetail
}

const REQUIRED_FIELDS = [
  "name",
  "industry", 
  "description",
  "targetAudience"
] as const

// Fallback: fetch HTML and extract text via Cheerio (no Firecrawl)
async function fetchAndExtractWithCheerio(url: string): Promise<string> {
  const siteResponse = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
  })
  const html = await siteResponse.text()
  const $ = cheerio.load(html)
  const title = $("title").text()
  const metaDesc = $('meta[name="description"]').attr("content") || ""
  const h1 = $("h1").first().text()
  const h2 = $("h2").first().text()
  let mainContent = $("main").text() || $("body").text()
  mainContent = mainContent.replace(/\s+/g, " ").trim().slice(0, 2000)

  const subpageLinks: string[] = []
  $("a").each((_: unknown, el: unknown) => {
    const href = $(el as cheerio.Element).attr("href") || ""
    if (/about|company|team/i.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
      let u = href
      if (!/^https?:\/\//i.test(u)) u = new URL(u, url).href
      if (!subpageLinks.includes(u)) subpageLinks.push(u)
    }
  })
  const subpagesToCrawl = subpageLinks.slice(0, 1)
  let subpageText = ""
  if (subpagesToCrawl.length > 0) {
    const results = await Promise.all(
      subpagesToCrawl.map(async (subUrl) => {
        try {
          const subRes = await fetch(subUrl, {
            signal: AbortSignal.timeout(3000),
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
          })
          const subHtml = await subRes.text()
          const $sub = cheerio.load(subHtml)
          const subTitle = $sub("title").text()
          const subMeta = $sub('meta[name="description"]').attr("content") || ""
          const subH1 = $sub("h1").first().text()
          const subH2 = $sub("h2").first().text()
          let subMain = $sub("main").text() || $sub("body").text()
          subMain = subMain.replace(/\s+/g, " ").trim().slice(0, 1500)
          return `\n[Subpage: ${subUrl}]\n${subTitle}\n${subMeta}\n${subH1}\n${subH2}\n${subMain}`
        } catch {
          return ""
        }
      })
    )
    subpageText = results.join("")
  }
  const parts = [title, metaDesc, h1, h2, mainContent, subpageText].filter(Boolean)
  return parts.join("\n").slice(0, 7000)
}

// Function to flatten target audience object into a string
function flattenTargetAudience(audience: TargetAudienceDetail): string {
  const parts = []
  
  // Add demographic info
  if (audience.demographic) {
    const demo = []
    if (audience.demographic.occupation) demo.push(audience.demographic.occupation)
    if (audience.demographic.age) demo.push(`aged ${audience.demographic.age}`)
    if (audience.demographic.location) demo.push(`in ${audience.demographic.location}`)
    if (demo.length) parts.push(demo.join(" "))
  }

  // Add interests and values
  if (audience.interestsValues?.length) {
    parts.push(`interested in ${audience.interestsValues.join(", ")}`)
  }

  // Add context if available
  if (audience.context) {
    parts.push(audience.context)
  }

  return parts.join(" who are ")
}

export async function POST(request: Request) {
  Logger.info("Received extract website request")

  try {
    // Parse request body
    const body = await request.json()
    Logger.debug("Request body", { body })

    // Check if we have either URL or description
    if (!body.url && !body.description) {
      Logger.error("Missing URL or description in request")
      return NextResponse.json(
        {
          success: false,
          message: "URL or description is required",
          error: "Missing required field: url or description",
        },
        { status: 400 }
      )
    }

    // If description provided, generate brand details directly from description
    if (body.description && !body.url) {
      Logger.info("Processing description input", { descriptionLength: body.description.length })
      
      const prompt = `Create a brand profile from this description: "${body.description}"

- Brand Name: Memorable, phonetic, easy to pronounce. 1-2 words ideally. No generic words like "Solutions" or "Services".

- Description: 2-3 paragraphs, 80-150 words. First person (we/our).
  - What they do and why it matters.
  - Who they do it for.
  - Write like employees would be proud of it, not a product spec or press release.

- Output: JSON with {"name", "industry", "description", "targetAudience", "productsServices": [...]}`

      try {
        const result = await generateWithOpenAI(prompt, `You write compelling brand descriptions that open tone of voice guidelines. For well-known brands, use your knowledge to capture what they're actually known for. For less-known brands, use what you're given and frame it with confidence. Write from the brand's perspective (we/our) in a way employees would be proud of.`, "json", 1500, "gpt-5.2", "none")
        
        if (result.success && result.content) {
          const brandDetails = JSON.parse(result.content)
          
          
          // Run audience generation and domain terms extraction in parallel
          // TODO: Consider consolidating into single AI call for 20-25% performance improvement
          // (eliminates network overhead, reduces token usage, better context sharing)
          
          // TEMPORARILY DISABLED: Audience generation for performance testing
          // const [audienceResult, keywordsResult] = await Promise.all([
          //   generateAudienceSummary({ 
          //     name: brandDetails.name, 
          //     description: brandDetails.description 
          //   }).catch(err => ({ success: false, error: err.message })),
          //   
          //   generateKeywords({ 
          //     name: brandDetails.name, 
          //     description: brandDetails.description,
          //     audience: audienceStr 
          //   }).catch(err => ({ success: false, error: err.message }))
          // ])

          // Get fallback audience from brand details
          let fallbackAudience = 'general audience'
          try {
            if (typeof brandDetails.targetAudience === 'string') {
              fallbackAudience = brandDetails.targetAudience
            } else if (brandDetails.targetAudience) {
              fallbackAudience = flattenTargetAudience(brandDetails.targetAudience)
            }
          } catch {}

          // Generate audience and keywords in parallel
          const [audienceResult, keywordsResult] = await Promise.all([
            generateAudienceSummary({
              name: brandDetails.name,
              brandDetailsDescription: brandDetails.description
            }).catch(err => ({ success: false, error: err.message })),
            generateKeywords({
              name: brandDetails.name,
              brandDetailsDescription: brandDetails.description,
              audience: fallbackAudience
            }).catch(err => ({ success: false, error: err.message }))
          ])

          // Process audience with error handling
          let audienceStr = ''
          if (audienceResult?.success && audienceResult?.content) {
            audienceStr = audienceResult.content.trim()
          } else {
            audienceStr = fallbackAudience
          }
          
          // Process keywords with error handling (return array for consistency)
          let keywords: string[] = []
          if (keywordsResult?.success && keywordsResult?.content) {
            const parsed = JSON.parse(keywordsResult.content)
            keywords = Array.isArray(parsed.keywords) ? parsed.keywords : []
          }

          // Generate trait suggestions
          Logger.info("About to generate trait suggestions...")
          let suggestedTraits: string[] = []
          try {
            Logger.info("Generating trait suggestions for:", { brandName: brandDetails.name, audience: audienceStr })
            const traitsResult = await generateTraitSuggestions({
              name: brandDetails.name,
              brandDetailsDescription: brandDetails.description || brandDetails.brandDetailsDescription,
              audience: audienceStr
            })
            
            Logger.info("Trait suggestions result:", { success: traitsResult.success, content: traitsResult.content })
            
            if (traitsResult.success && traitsResult.content) {
              const parsed = JSON.parse(traitsResult.content)
              suggestedTraits = Array.isArray(parsed) ? parsed : []
              Logger.info("Parsed suggested traits:", suggestedTraits)
            }
          } catch (error) {
            Logger.error("Failed to generate trait suggestions:", error)
          }

          const productsServices = Array.isArray(brandDetails.productsServices)
            ? (brandDetails.productsServices as string[]).filter((p) => typeof p === "string")
            : []

          Logger.info("Successfully generated brand details from description")
          
          return NextResponse.json({
            success: true,
            brandName: brandDetails.name,
            brandDetailsDescription: brandDetails.description,
            audience: audienceStr,
            keywords,
            suggestedTraits,
            productsServices,
          })
        } else {
          throw new Error("Failed to generate brand details")
        }
      } catch (error) {
        Logger.error("Error processing description", error)
        return NextResponse.json({
          success: false,
          message: "Could not process description. Try again or add details manually.",
          error: "Description processing failed"
        }, { status: 500 })
      }
    }

    // Sanitize and validate the URL
    let cleanUrl = body.url.trim().replace(/^['"\s]+|['"\s]+$/g, "")
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl
    }
    // Validate again after cleaning
    const urlValidation = validateUrl(cleanUrl)
    if (!urlValidation.isValid) {
      Logger.error("Invalid URL provided after cleaning", new Error(urlValidation.error))
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL provided. Please check for typos or extra punctuation.",
          error: urlValidation.error,
        },
        { status: 400 }
      )
    }

    // Extract domain/brand name from URL
    let domain = ""
    try {
      const urlObj = new URL(urlValidation.url)
      domain = urlObj.hostname.replace('www.', '').split('.')[0]
    } catch {
      domain = urlValidation.url
    }

    Logger.info("Extracting brand information", { domain })

    // Try to scrape homepage for context
    let homepageContext = ""
    try {
      const homepage = await fetchAndExtractWithCheerio(urlValidation.url)
      if (homepage && homepage.length > 100) {
        homepageContext = `\n\nWebsite homepage:\n${homepage.slice(0, 1500)}`
        Logger.debug("Homepage context retrieved", { length: homepageContext.length })
      }
    } catch (e) {
      Logger.warn("Could not scrape homepage, will rely on model knowledge", {
        error: e instanceof Error ? e.message : String(e)
      })
    }

    // Simple prompt that leverages the model's knowledge of the brand + optional homepage context
    const prompt = `Write a brand description for ${domain} (${urlValidation.url})${homepageContext}

Use your knowledge of this brand to write an authentic, compelling description that opens their tone of voice guidelines. If homepage content is provided, use it to ground your answer.

- Brand Name: 1-3 words

- Description: 2-3 paragraphs, 80-150 words. First person (we/our).
  - What they do and why it matters.
  - Who they do it for.
  - Write like employees would be proud of it, not a product spec or press release.

- Output: JSON with {"name", "industry", "description", "targetAudience", "productsServices": [...]}`

    const result = await generateWithOpenAI(
      prompt,
      `You write compelling brand descriptions that open tone of voice guidelines. For well-known brands, use your knowledge to capture what they're actually known for. For less-known brands, use what you're given and frame it with confidence. Write from the brand's perspective (we/our) in a way employees would be proud of.`,
      "json",
      1500,
      "gpt-5.2",
      "none"
    )

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information")
    }

    // Parse the JSON response
    const parsed = JSON.parse(result.content)
    const brandName = parsed.name || ""
    const brandDetailsDescription = parsed.description || ""
    const productsServices = Array.isArray(parsed.productsServices)
      ? (parsed.productsServices as string[]).filter((p) => typeof p === "string")
      : []

    Logger.debug("Generated brand details", { brandName, brandDetailsDescription })

    // Generate audience and keywords in parallel
    // TODO: Consider consolidating into single AI call for 20-25% performance improvement
    // (eliminates network overhead, reduces token usage, better context sharing)
    
    // TEMPORARILY DISABLED: Audience generation for performance testing
    // const [audienceResult, keywordsResult] = await Promise.all([
    //   generateAudienceSummary({ 
    //     name: brandName || 'Brand', 
    //     description: brandDetailsDescription 
    //   }).catch(err => ({ success: false, error: err.message })),
    //   
    //   generateKeywords({

    // Generate audience and keywords in parallel
    const [audienceResult, keywordsResult] = await Promise.all([
      generateAudienceSummary({
        name: brandName || 'Brand',
        brandDetailsDescription: brandDetailsDescription
      }).catch(err => ({ success: false, error: err.message })),
      generateKeywords({
        name: brandName || 'Brand',
        brandDetailsDescription: brandDetailsDescription,
        audience: 'general audience'
      }).catch(err => ({ success: false, error: err.message }))
    ])

    // Process audience with error handling
    let audience = ''
    if (audienceResult?.success && audienceResult?.content) {
      audience = audienceResult.content.trim()
    }

    // Process keywords with error handling (return array for consistency)
    let keywords: string[] = []
    if (keywordsResult?.success && keywordsResult?.content) {
      const parsed = JSON.parse(keywordsResult.content)
      keywords = Array.isArray(parsed.keywords) ? parsed.keywords : []
    }

    // Generate trait suggestions
    Logger.info("About to generate trait suggestions...")
    let suggestedTraits: string[] = []
    try {
      Logger.info("Generating trait suggestions for:", { brandName, audience })
      const traitsResult = await generateTraitSuggestions({
        name: brandName,
        brandDetailsDescription: brandDetailsDescription,
        audience: audience
      })
      
      Logger.info("Trait suggestions result:", { success: traitsResult.success, content: traitsResult.content })
      
      if (traitsResult.success && traitsResult.content) {
        const parsed = JSON.parse(traitsResult.content)
        suggestedTraits = Array.isArray(parsed) ? parsed : []
        Logger.info("Parsed suggested traits:", suggestedTraits)
      }
    } catch (error) {
      Logger.error("Failed to generate trait suggestions:", error)
    }

    Logger.info("Successfully extracted brand information")
    return NextResponse.json({
      success: true,
      brandDetailsDescription,
      brandName,
      audience,
      keywords,
      suggestedTraits,
      productsServices,
      ...(urlValidation?.url && { url: urlValidation.url }),
    })
  } catch (error) {
    Logger.error(
      "Error in extract-website API",
      error instanceof Error ? error : new Error("Unknown error")
    )

    return NextResponse.json(
      {
        success: false,
        message: "Failed to extract brand information",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    )
  }
}
