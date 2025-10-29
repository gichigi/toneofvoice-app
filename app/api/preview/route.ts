import { NextResponse } from "next/server"
import { renderPreviewStyleGuide } from "@/lib/template-processor"

// Simplified validation function
function validateBrandDetails(details: any) {
  const errors: string[] = []
  
  // Required fields
  if (!details.name || details.name.trim().length === 0) {
    errors.push("Brand name is required")
  }
  
  if (!details.brandDetailsDescription || details.brandDetailsDescription.trim().length === 0) {
    errors.push("Brand description is required")
  }
  
  return errors
}

export async function POST(request: Request) {
  try {
    console.log('[Preview API] Request received')
    
    const { brandDetails, selectedTraits } = await request.json()
    
    if (!brandDetails) {
      console.error('[Preview API] No brand details provided')
      return NextResponse.json(
        { error: 'Brand details are required' },
        { status: 400 }
      )
    }
    
    console.log('[Preview API] Validating brand details...')
    const validationErrors = validateBrandDetails(brandDetails)
    if (validationErrors.length > 0) {
      console.error('[Preview API] Validation errors:', validationErrors)
      return NextResponse.json(
        { error: 'Invalid brand details', details: validationErrors },
        { status: 400 }
      )
    }
    
    console.log('[Preview API] Generating preview with AI content...')
    const startTime = Date.now()
    
    // Include selectedTraits in brandDetails for processing
    const enhancedBrandDetails = {
      ...brandDetails,
      traits: selectedTraits || brandDetails.traits || []
    }
    
    // Generate preview with AI content using new preview-specific function
    const preview = await renderPreviewStyleGuide({
      brandDetails: enhancedBrandDetails
    })
    
    const duration = Date.now() - startTime
    console.log(`[Preview API] Preview generated successfully in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      preview,
      duration: `${duration}ms`
    })
    
  } catch (error) {
    console.error('[Preview API] Error generating preview:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 