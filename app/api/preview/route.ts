import { NextResponse } from "next/server"
import { renderPreviewStyleGuide, renderStyleGuideTemplate } from "@/lib/template-processor"
import { createServerClient } from "@/lib/supabase-server"

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
    
    console.log('[Preview API] Generating content with AI...')
    const startTime = Date.now()

    // Include selectedTraits in brandDetails for processing
    const enhancedBrandDetails = {
      ...brandDetails,
      traits: selectedTraits || brandDetails.traits || []
    }

    // Check user's subscription tier to determine what to generate
    let subscriptionTier = 'starter'
    try {
      const supabase = createServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: tierData } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()

        if (tierData?.subscription_tier && tierData.subscription_tier !== 'free') {
          subscriptionTier = tierData.subscription_tier
        }
      }
    } catch (error) {
      console.warn('[Preview API] Could not fetch subscription tier, defaulting to starter:', error)
    }

    console.log(`[Preview API] User tier: ${subscriptionTier}`)

    // Generate full content for paid users, preview for free users
    const preview = subscriptionTier === 'starter'
      ? await renderPreviewStyleGuide({ brandDetails: enhancedBrandDetails })
      : await renderStyleGuideTemplate({ brandDetails: enhancedBrandDetails, useAIContent: true, isPreview: false })

    const duration = Date.now() - startTime
    console.log(`[Preview API] Content generated successfully in ${duration}ms (tier: ${subscriptionTier})`)
    
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