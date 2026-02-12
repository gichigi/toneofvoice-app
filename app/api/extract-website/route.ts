import { NextResponse } from "next/server"
import { generateWithOpenAI, generateAudienceSummary, generateKeywords, generateTraitSuggestions } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"
import { scrapeSiteForExtraction, scrapeSiteWithJsonExtraction } from "@/lib/firecrawl-site-scraper"
import * as cheerio from "cheerio"
import OpenAI from "openai"

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

// Test OpenAI connection inline
async function testOpenAIConnection() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OpenAI API key not found")
    }

    const openai = new OpenAI({ apiKey })
    
    // Simple test call with faster model
    const response = await openai.chat.completions.create({
      model: "gpt-5.2-mini",
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 5,
    })

    if (!response.choices?.[0]?.message) {
      throw new Error("Invalid OpenAI response")
    }

    return { success: true }
  } catch (error) {
    console.error("OpenAI test failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "OpenAI connection failed" 
    }
  }
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
      
      const prompt = `Extract and expand brand details from this business description: "${body.description}"

- Brand
  - Input: ${body.description}
  - Task: Create comprehensive brand profile

- Brand Name Requirements (CRITICAL)
  - Create a memorable name that fits the business
  - Must be phonetic and easy to pronounce
  - 1-3 words maximum, ideally 2 words
  - Avoid generic words like "Solutions", "Services", "Group"
  - Avoid overly obvious or literal names
  - Consider phonetics, alliteration, rhythm or distinctive sounds
  - Be creative and distinctive rather than descriptive

- Guidelines
  - Description: Write 2-3 cohesive, flowing paragraphs that read naturally. Each paragraph should be 3-5 sentences that connect smoothly. Avoid bullet-like or choppy sentences.
  - First paragraph: What they do and who they serve
  - Second paragraph: Their approach and what makes them unique
  - Optional third paragraph: Their impact or value proposition
  - Use clear, professional language. First person plural (we/our)
  - Focus on current offerings, not history. Create a narrative flow, not a list.
  - IMPORTANT: Never use em dashes (—) in your output. Use hyphens (-), commas, or rewrite sentences instead.

- Output format
  - Return clean JSON: {"name": "memorable brand name", "industry": "category", "description": "full brand description", "targetAudience": "audience details", "productsServices": ["product/service 1", "product/service 2"]}
  - productsServices: What they offer. Flexible by business model: products, services, programs, campaigns, etc. For charities: programs, initiatives.`

      try {
        const result = await generateWithOpenAI(prompt, "You are a brand naming expert who specializes in crafting memorable names that fit businesses. You excel at creating phonetic, distinctive names that match each brand's unique personality and industry context. Never use em dashes in your output.", "json", 1500, "gpt-5.2", "medium")
        
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
          
          // Generate audience first for keyword context
          const audienceResult = await generateAudienceSummary({ 
            name: brandDetails.name, 
            brandDetailsDescription: brandDetails.description 
          }).catch(err => ({ success: false, error: err.message }))
          
          // Process audience with error handling
          let audienceStr = ''
          if (audienceResult?.success && audienceResult?.content) {
            audienceStr = audienceResult.content.trim()
          } else {
            // Fallback to original targetAudience from brand details
            try {
              if (typeof brandDetails.targetAudience === 'string') {
                audienceStr = brandDetails.targetAudience
              } else if (brandDetails.targetAudience) {
                audienceStr = flattenTargetAudience(brandDetails.targetAudience)
              }
            } catch {}
          }

          // Generate keywords with audience context
          const keywordsResult = await generateKeywords({ 
            name: brandDetails.name, 
            brandDetailsDescription: brandDetails.description,
            audience: audienceStr || 'general audience'
          }).catch(err => ({ success: false, error: err.message }))
          
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

    // Test OpenAI connection inline
    const testResult = await testOpenAIConnection()
    if (!testResult.success) {
      throw new Error(testResult.error || "API key validation failed")
    }

    let summary: string

    // Prefer Firecrawl JSON extraction when API key is set (single call, richer description, up to 25 keywords)
    if (process.env.FIRECRAWL_API_KEY) {
      Logger.info("Using Firecrawl JSON extraction for site")
      const fcResult = await scrapeSiteWithJsonExtraction(urlValidation.url)
      if (fcResult.success && fcResult.description) {
        Logger.debug("Firecrawl JSON extraction completed", {
          pagesScraped: fcResult.pagesScraped,
          keywordsCount: fcResult.keywords.length,
        })
        return NextResponse.json({
          success: true,
          brandDetailsDescription: fcResult.description,
          brandName: fcResult.name,
          audience: fcResult.audience,
          keywords: fcResult.keywords,
          suggestedTraits: fcResult.suggestedTraits,
          productsServices: fcResult.productsServices,
          ...(urlValidation?.url && { url: urlValidation.url }),
        })
      }
      Logger.warn("Firecrawl JSON extraction failed, falling back to markdown + OpenAI", {
        error: fcResult.error,
      })
      // Fall through to markdown + OpenAI flow
      const fcMdResult = await scrapeSiteForExtraction(urlValidation.url)
      if (fcMdResult.success && fcMdResult.markdown) {
        summary = fcMdResult.markdown.slice(0, 7000)
      } else {
        summary = await fetchAndExtractWithCheerio(urlValidation.url)
      }
    } else {
      summary = await fetchAndExtractWithCheerio(urlValidation.url)
    }

    // Fallback: Generate prompt for website extraction (markdown + OpenAI)
    const prompt = `Analyze this website content and extract the brand's core identity.

- Brand
  - Website content provided below
  - Task: Create comprehensive brand profile

- Brand Name Requirements
  - Extract the existing brand name if clearly mentioned
  - If no clear name exists, create a compelling name that fits the business
  - 1-3 words maximum
  - Be creative and descriptive

- Guidelines
  - Description: 3-6 paragraphs. Accurate, concise but full. Suitable for About section.
  - Start with brand name followed by what they are/do
  - Include main products/services, target audience, what makes them unique
  - Use professional, clear language. First person plural (we/our)
  - Focus on current offerings, not history. Not short one-liners.

- Output format
  - Return clean JSON: {"name": "memorable brand name", "description": "full brand description", "productsServices": ["product/service 1", "product/service 2"]}
  - productsServices: What they offer. Flexible by business model: products, services, programs, campaigns, etc. For charities: programs, initiatives.

Website Content:
${summary}`

    const result = await generateWithOpenAI(
      prompt,
      "You are a brand naming expert who specializes in crafting memorable names that fit businesses. You excel at creating phonetic, distinctive names that match each brand's unique personality and industry context. You also write clear, readable brand summaries using simple language and short sentences.",
      "json",
      1500, // Allow longer descriptions for About section
      "gpt-5.2",
      "medium"
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
    
    // Generate audience first, then keywords with audience context
    const audienceResult = await generateAudienceSummary({ 
      name: brandName || 'Brand', 
      brandDetailsDescription: brandDetailsDescription 
    }).catch(err => ({ success: false, error: err.message }))

    // Process audience with error handling
    let audience = ''
    if (audienceResult?.success && audienceResult?.content) {
      audience = audienceResult.content.trim()
    }

    // Generate keywords with audience context
    const keywordsResult = await generateKeywords({ 
      name: brandName || 'Brand', 
      brandDetailsDescription: brandDetailsDescription,
      audience: audience || 'general audience'
    }).catch(err => ({ success: false, error: err.message }))

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
