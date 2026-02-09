import { NextResponse } from "next/server"
import { renderStyleGuideTemplate, renderFullGuideFromPreview } from "@/lib/template-processor"
import OpenAI from "openai"

// Simplified validation function - only new format
function validateBrandDetails(details: any) {
  const errors: string[] = []
  
  // Required fields
  if (!details.name || details.name.trim().length === 0) {
    errors.push("Brand name is required")
  }
  
  if (!details.brandDetailsDescription || details.brandDetailsDescription.trim().length === 0) {
    errors.push("Brand description is required")
  }
  
  // Audience is optional since it's always set to "general audience"
  // No validation needed
  
  // Tone is optional - voice is now defined by selected traits
  
  return errors
}

// Test OpenAI connection inline
async function testOpenAIConnection() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OpenAI API key not found")
    }

    const openai = new OpenAI({ apiKey })
    
    // Simple test call
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
  let brandDetails: any = {}
  let requestBody: any = {}

  try {
    console.log("Received request to generate-styleguide API")

    // Test OpenAI connection inline
    const testResult = await testOpenAIConnection()
    if (!testResult.success) {
      throw new Error(testResult.error || "API key validation failed")
    }

    // Get the request body and handle potential parsing errors
    try {
      requestBody = await request.json()
      console.log("Request body:", requestBody)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: parseError instanceof Error ? parseError.message : "JSON parse error",
        },
        { status: 400 },
      )
    }

    // Extract brandDetails, optional userEmail, and optional previewContent (preserve user's preview when upgrading)
    brandDetails = requestBody?.brandDetails || {}
    const userEmail = requestBody?.userEmail ?? null
    const previewContent = requestBody?.previewContent ?? null
    console.log("Extracted brand details:", brandDetails)
    console.log("Brand details structure:", {
      hasName: !!brandDetails.name,
      hasDescription: !!brandDetails.description,
      hasAudience: !!brandDetails.audience,
      hasBrandDetailsDescription: !!brandDetails.brandDetailsDescription,
      keys: Object.keys(brandDetails)
    })

    // Validate brand details
    const validationErrors = validateBrandDetails(brandDetails)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand details",
          error: validationErrors.join(", "),
        },
        { status: 400 },
      )
    }

    try {
      // If user has preview content, merge: preserve their preview and only generate locked sections
      const hasPreview = previewContent && typeof previewContent === "string" && previewContent.length > 500

      const styleGuide = hasPreview
        ? await renderFullGuideFromPreview({ previewContent, brandDetails, userEmail })
        : await renderStyleGuideTemplate({
            brandDetails,
            useAIContent: true,
            isPreview: false,
            userEmail,
          })

      console.log("Style guide generated:", hasPreview ? "merged from preview" : "full generation")

      if (!styleGuide || styleGuide.trim() === "") {
        throw new Error("Generated style guide is empty")
      }

      console.log("Style guide generated successfully, length:", styleGuide.length)

      return NextResponse.json({
        success: true,
        message: "Style guide generated successfully",
        styleGuide,
      })
    } catch (templateError) {
      console.error(
        "Error processing template:",
        templateError,
        templateError instanceof Error ? templateError.stack : "No stack trace",
      )

      // Return error response
      return NextResponse.json(
        {
          success: false,
          message: "Error generating style guide",
          error: templateError instanceof Error ? templateError.message : "Unknown template processing error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in generate-styleguide API:", error, error instanceof Error ? error.stack : "No stack trace")

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process request",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
