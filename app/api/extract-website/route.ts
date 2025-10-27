import { NextResponse } from "next/server"
import { generateWithOpenAI, generateAudienceSummary, extractDomainTermsAndLexicon, generateTraitSuggestions } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"
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
      model: "gpt-4o-mini",
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
      
      const prompt = `Based on this business description: "${body.description}"

Extract and expand brand details in this exact JSON format:
{
  "name": "business name (if mentioned, extract exactly; if not mentioned, create a creative, memorable name that fits the business)",
  "industry": "specific industry category",
  "description": "rich, detailed business description (300-450 characters) that expands on the original input with specific details about what they do, their approach, and what makes them special",
  "targetAudience": "detailed description of their ideal customers, including demographics, needs, and characteristics"
}

Important: Make the description rich and detailed (300-450 chars) while staying true to the original business concept.`

      try {
        const result = await generateWithOpenAI(prompt, "You are a brand analysis expert.", "json", 800, "gpt-4o-mini")
        
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
          //   extractDomainTermsAndLexicon({ 
          //     name: brandDetails.name, 
          //     description: brandDetails.description 
          //   }).catch(err => ({ success: false, error: err.message }))
          // ])
          
          // Only run keywords extraction for testing
          const keywordsResult = await extractDomainTermsAndLexicon({ 
            name: brandDetails.name, 
            description: brandDetails.description 
          }).catch(err => ({ success: false, error: err.message }))
          
          const audienceResult = { success: false, error: "Disabled for testing" }
          
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
          
          // Process keywords with error handling
          let keywords = ''
          let domainTerms: string[] | undefined
          let lexicon: any | undefined
          if (keywordsResult?.success && keywordsResult?.content) {
            const parsed = JSON.parse(keywordsResult.content)
            domainTerms = Array.isArray(parsed.domainTerms) ? parsed.domainTerms : []
            lexicon = parsed.lexicon || {}
            const preferred = Array.isArray(lexicon.preferred) ? lexicon.preferred : []
            const combined = [...new Set([...(domainTerms || []), ...preferred])]
            keywords = combined.join('\n')
          }

          // Generate trait suggestions
          Logger.info("About to generate trait suggestions...")
          let suggestedTraits: string[] = []
          try {
            Logger.info("Generating trait suggestions for:", { brandName: brandDetails.name, audience: audienceStr })
            const traitsResult = await generateTraitSuggestions({
              name: brandDetails.name,
              description: brandDetails.description,
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

          Logger.info("Successfully generated brand details from description")
          
          return NextResponse.json({
            success: true,
            brandName: brandDetails.name,
            brandDetailsText: brandDetails.description,
            audience: audienceStr,
            keywords,
            suggestedTraits
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

    // Fetch the website HTML
    let siteResponse, html
    try {
      siteResponse = await fetch(urlValidation.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })
      html = await siteResponse.text()
    } catch (fetchError: any) {
      Logger.error("Failed to fetch website", fetchError)
      
      // Handle specific network errors
      if (fetchError.code === 'ECONNRESET' || fetchError.message?.includes('ECONNRESET')) {
        return NextResponse.json({
          success: false,
          message: "Connection was interrupted. Try again or add details manually.",
          error: "Connection reset by peer"
        }, { status: 400 })
      }
      
      if (fetchError.message?.includes('timeout')) {
        return NextResponse.json({
          success: false,
          message: "Site didn't respond. Try again or add details manually.",
          error: "Request timeout"
        }, { status: 400 })
      }
      
      // Generic network error
      return NextResponse.json({
        success: false,
        message: "Can't reach this site. Try again later.",
        error: fetchError.message || "Network error"
      }, { status: 400 })
    }
    
    // Debug: Log what we actually got
    Logger.debug("Fetched HTML preview", { 
      url: urlValidation.url,
      htmlPreview: html.slice(0, 500),
      contentLength: html.length 
    })

    // Use cheerio to extract key info from homepage
    const $ = cheerio.load(html)
    const title = $('title').text()
    const metaDesc = $('meta[name="description"]').attr('content') || ''
    const h1 = $('h1').first().text()
    const h2 = $('h2').first().text()
    // Try to get main content (simple: first <main>, fallback: body text)
    let mainContent = $('main').text() || $('body').text()
    mainContent = mainContent.replace(/\s+/g, ' ').trim().slice(0, 2000)

    // Debug: Log extracted content
    Logger.debug("Extracted content", { 
      title, 
      metaDesc, 
      h1, 
      h2, 
      mainContentPreview: mainContent.slice(0, 200) 
    })

    // Find links to About, Company, Team pages
    const subpageLinks: string[] = []
    $('a').each((_: unknown, el: any) => {
      const href = $(el).attr('href') || ''
      if (/about|company|team/i.test(href) && !href.startsWith('#') && !href.startsWith('mailto:')) {
        let url = href
        if (!/^https?:\/\//i.test(url)) {
          url = new URL(url, urlValidation.url).href
        }
        if (!subpageLinks.includes(url)) subpageLinks.push(url)
      }
    })
    // Limit to 1 subpage
    const subpagesToCrawl = subpageLinks.slice(0, 1)
    let subpageText = ''
    
    // Fetch subpages in parallel for better performance
    if (subpagesToCrawl.length > 0) {
      const subpagePromises = subpagesToCrawl.map(async (subUrl) => {
        try {
          const subRes = await fetch(subUrl, { 
            signal: AbortSignal.timeout(3000), // 3 second timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            }
          })
          const subHtml = await subRes.text()
          const $sub = cheerio.load(subHtml)
          const subTitle = $sub('title').text()
          const subMeta = $sub('meta[name="description"]').attr('content') || ''
          const subH1 = $sub('h1').first().text()
          const subH2 = $sub('h2').first().text()
          let subMain = $sub('main').text() || $sub('body').text()
          subMain = subMain.replace(/\s+/g, ' ').trim().slice(0, 1500)
          return `\n[Subpage: ${subUrl}]\n${subTitle}\n${subMeta}\n${subH1}\n${subH2}\n${subMain}`
        } catch (e) { 
          console.log(`Failed to fetch subpage ${subUrl}:`, e)
          return '' // Return empty string on error
        }
      })
      
      // Wait for all subpage fetches to complete
      const subpageResults = await Promise.all(subpagePromises)
      subpageText = subpageResults.join('')
    }

    // Combine all extracted text
    let summary = [title, metaDesc, h1, h2, mainContent, subpageText].filter(Boolean).join('\n')
    // Reduce to 7k chars for faster processing while maintaining quality
    summary = summary.slice(0, 7000)

    // Generate prompt for website extraction with improved guidance
    const prompt = `Analyze the following website content and extract the brand's core identity.

Write a single, cohesive paragraph (30-50 words) that follows this structure:
1. Start with the brand name followed by what they are/do
2. Include their main products/services
3. Specify their target audience
4. Mention what makes them unique (if identifiable)

Your paragraph should be:
- Professional, clear and easy to read 
- Factual, not promotional
- Written in third person
- Focused on their current offerings, not history
- Use short sentences and simple punctuation

Examples: 
'Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment.'

'OpenAI is a technology company specializing in artificial intelligence research and development. OpenAI offers cutting-edge AI products and services to businesses and developers worldwide. Their target audience includes organizations looking to leverage advanced AI solutions.'

Website Content:
${summary}
`

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert brand analyst with experience writing clear, readable brand summaries. Use simple language and short sentences. Avoid complex words, marketing jargon, and run-on sentences. Make your description easily scannable and accessible to all readers.",
      "json", // Use json format for faster processing
      500 // Reduce max tokens since we only need a short paragraph
    )

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information")
    }

    // Process the paragraph response
    const brandDetailsText = result.content.trim()
    Logger.debug("Generated brand details text", { brandDetailsText })

    // Extract brand name from the description using simple pattern
    const brandNameMatch = brandDetailsText.match(/^([^.]+?)\s+is\s+/i)
    const brandName = brandNameMatch ? brandNameMatch[1].trim() : ""

    // Generate audience and keywords in parallel
    // TODO: Consider consolidating into single AI call for 20-25% performance improvement
    // (eliminates network overhead, reduces token usage, better context sharing)
    
    // TEMPORARILY DISABLED: Audience generation for performance testing
    // const [audienceResult, keywordsResult] = await Promise.all([
    //   generateAudienceSummary({ 
    //     name: brandName || 'Brand', 
    //     description: brandDetailsText 
    //   }).catch(err => ({ success: false, error: err.message })),
    //   
    //   extractDomainTermsAndLexicon({
    
    // Generate both audience and keywords for trait suggestions
    const [audienceResult, keywordsResult] = await Promise.all([
      generateAudienceSummary({ 
        name: brandName || 'Brand', 
        description: brandDetailsText 
      }).catch(err => ({ success: false, error: err.message })),
      
      extractDomainTermsAndLexicon({ 
        name: brandName || 'Brand', 
        description: brandDetailsText 
      }).catch(err => ({ success: false, error: err.message }))
    ])

    // Process audience with error handling
    let audience = ''
    if (audienceResult?.success && audienceResult?.content) {
      audience = audienceResult.content.trim()
    }

    // Process keywords with error handling
    let keywords = ''
    let domainTerms: string[] | undefined
    let lexicon: any | undefined
    if (keywordsResult?.success && keywordsResult?.content) {
      const parsed = JSON.parse(keywordsResult.content)
      domainTerms = Array.isArray(parsed.domainTerms) ? parsed.domainTerms : []
      lexicon = parsed.lexicon || {}
      const preferred = Array.isArray(lexicon.preferred) ? lexicon.preferred : []
      const combined = [...new Set([...(domainTerms || []), ...preferred])]
      keywords = combined.join('\n')
    }

    // Generate trait suggestions
    Logger.info("About to generate trait suggestions...")
    let suggestedTraits: string[] = []
    try {
      Logger.info("Generating trait suggestions for:", { brandName, audience })
      const traitsResult = await generateTraitSuggestions({
        name: brandName,
        description: brandDetailsText,
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
      brandDetailsText,
      brandName,
      audience,
      keywords,
      suggestedTraits
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
