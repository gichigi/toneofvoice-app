/**
 * Integration test: Verify cache invalidation with real API calls
 * Tests the full flow: change keywords/description → generate preview → verify content
 */

import { POST as previewPOST } from '../app/api/preview/route.js'
import { POST as extractPOST } from '../app/api/extract-website/route.js'

const testAPICacheBehavior = async () => {
  console.log('🧪 API Integration Test: Cache Invalidation\n')
  console.log('='.repeat(60))
  
  // Test 1: Generate preview with fashion keywords
  console.log('\n📝 TEST 1: Generate preview with fashion keywords')
  console.log('-'.repeat(60))
  
  const brandDetails1 = {
    name: "AIStyleGuide",
    brandDetailsDescription: "AIStyleGuide creates AI-powered brand tone of voice guides.",
    audience: "Marketing teams and brand managers",
    keywords: ["AI fashion guide", "smart wardrobe", "AI outfit planner"],
    traits: ["Conversational", "Playful", "Plain spoken"]
  }
  
  const request1 = new Request('http://localhost/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      brandDetails: brandDetails1,
      selectedTraits: brandDetails1.traits
    })
  })
  
  try {
    const response1 = await previewPOST(request1)
    const data1 = await response1.json()
    
    if (data1.success && data1.preview) {
      const hasFashion = data1.preview.toLowerCase().includes('fashion') || 
                        data1.preview.toLowerCase().includes('wardrobe') ||
                        data1.preview.toLowerCase().includes('outfit')
      
      console.log('✅ Preview generated')
      console.log(`   Contains fashion references: ${hasFashion ? 'YES' : 'NO'}`)
      console.log(`   Preview length: ${data1.preview.length} chars`)
      
      if (hasFashion) {
        console.log('   ⚠️  Preview contains fashion references (expected for this test)')
      }
    } else {
      console.log('❌ Failed to generate preview:', data1.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  // Test 2: Generate preview with corrected keywords
  console.log('\n📝 TEST 2: Generate preview with corrected keywords')
  console.log('-'.repeat(60))
  
  const brandDetails2 = {
    ...brandDetails1,
    keywords: ["brand voice", "content style guide", "tone of voice", "messaging guidelines"]
  }
  
  const request2 = new Request('http://localhost/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      brandDetails: brandDetails2,
      selectedTraits: brandDetails2.traits
    })
  })
  
  try {
    const response2 = await previewPOST(request2)
    const data2 = await response2.json()
    
    if (data2.success && data2.preview) {
      const hasFashion = data2.preview.toLowerCase().includes('fashion') || 
                        data2.preview.toLowerCase().includes('wardrobe') ||
                        data2.preview.toLowerCase().includes('outfit')
      const hasBrandTerms = data2.preview.toLowerCase().includes('brand') ||
                           data2.preview.toLowerCase().includes('messaging') ||
                           data2.preview.toLowerCase().includes('marketing')
      
      console.log('✅ Preview generated with new keywords')
      console.log(`   Contains fashion references: ${hasFashion ? 'YES ❌' : 'NO ✅'}`)
      console.log(`   Contains brand/messaging terms: ${hasBrandTerms ? 'YES ✅' : 'NO ❌'}`)
      console.log(`   Preview length: ${data2.preview.length} chars`)
      
      if (hasFashion) {
        console.log('   ❌ ERROR: Preview still contains fashion references!')
      } else {
        console.log('   ✅ SUCCESS: Preview no longer contains fashion references')
      }
    } else {
      console.log('❌ Failed to generate preview:', data2.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  // Test 3: Change description and regenerate
  console.log('\n📝 TEST 3: Change description and regenerate')
  console.log('-'.repeat(60))
  
  const brandDetails3 = {
    ...brandDetails2,
    brandDetailsDescription: "AIStyleGuide helps businesses create comprehensive brand voice and style guides using AI technology."
  }
  
  const request3 = new Request('http://localhost/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      brandDetails: brandDetails3,
      selectedTraits: brandDetails3.traits
    })
  })
  
  try {
    const response3 = await previewPOST(request3)
    const data3 = await response3.json()
    
    if (data3.success && data3.preview) {
      const hasFashion = data3.preview.toLowerCase().includes('fashion') || 
                        data3.preview.toLowerCase().includes('wardrobe') ||
                        data3.preview.toLowerCase().includes('outfit')
      const hasBusinessTerms = data3.preview.toLowerCase().includes('business') ||
                              data3.preview.toLowerCase().includes('brand') ||
                              data3.preview.toLowerCase().includes('messaging')
      
      console.log('✅ Preview generated with new description')
      console.log(`   Contains fashion references: ${hasFashion ? 'YES ❌' : 'NO ✅'}`)
      console.log(`   Contains business/brand terms: ${hasBusinessTerms ? 'YES ✅' : 'NO ❌'}`)
      console.log(`   Preview length: ${data3.preview.length} chars`)
      
      if (hasFashion) {
        console.log('   ❌ ERROR: Preview still contains fashion references!')
      } else {
        console.log('   ✅ SUCCESS: Preview reflects new description without fashion references')
      }
    } else {
      console.log('❌ Failed to generate preview:', data3.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ API integration tests completed!')
  console.log('='.repeat(60))
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPICacheBehavior().catch(console.error)
}

export { testAPICacheBehavior }

