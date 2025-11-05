/**
 * Test script for two-step blog generation:
 * 1. Generate outline first
 * 2. Generate article from outline
 * 
 * This allows us to verify outline includes templates when title promises one
 */

import dotenv from 'dotenv'
import OpenAI from 'openai'
import { BLOG_SYSTEM_PROMPT, getBlogOutlinePrompt, getBlogArticlePromptFromOutline } from '../lib/blog-prompts.js'

dotenv.config()

// Standalone generateWithOpenAI function (matches generate-blog-posts.js logic)
async function generateWithOpenAI(prompt, systemPrompt, responseFormat = 'json', max_tokens = 2000, model = 'gpt-4o-mini') {
  const maxAttempts = 3
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: max_tokens
      })

      const rawResponse = response.choices[0]?.message?.content
      if (!rawResponse) {
        throw new Error('Empty response from OpenAI')
      }

      // Clean response (remove markdown code blocks)
      let cleanedResponse = rawResponse.trim()
      cleanedResponse = cleanedResponse.replace(/```(json|markdown)\n?/g, '').replace(/```\n?/g, '')

      // For JSON, try to extract valid JSON
      if (responseFormat === 'json') {
        const jsonStart = Math.min(
          cleanedResponse.indexOf('[') >= 0 ? cleanedResponse.indexOf('[') : Infinity,
          cleanedResponse.indexOf('{') >= 0 ? cleanedResponse.indexOf('{') : Infinity
        )
        
        if (jsonStart < Infinity) {
          let jsonText = cleanedResponse.substring(jsonStart)
          // Try to find valid JSON by parsing progressively smaller substrings
          for (let i = jsonText.length; i > 0; i--) {
            try {
              const candidate = jsonText.substring(0, i)
              JSON.parse(candidate)
              cleanedResponse = candidate
              break
            } catch (e) {
              // Continue trying shorter substrings
            }
          }
        }
      }

      return {
        success: true,
        content: cleanedResponse.trim()
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate content'
        }
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  return {
    success: false,
    error: 'Unexpected error in generation'
  }
}

// Test topics with varied keywords to test different formats and scenarios
const testTopics = [
  {
    title: 'Brand guidelines template',
    keywords: ['brand guidelines template', 'brand', 'guidelines', 'template']
  },
  {
    title: '5 brand voice mistakes',
    keywords: ['brand voice mistakes', 'brand voice errors', 'brand voice tips']
  },
  {
    title: 'Brand voice vs tone',
    keywords: ['brand voice', 'tone of voice', 'brand voice vs tone', 'difference']
  },
  {
    title: 'How to create a style guide',
    keywords: ['how to create style guide', 'style guide creation', 'brand style guide']
  },
  {
    title: 'Brand voice examples',
    keywords: ['brand voice examples', 'brand voice inspiration', 'successful brand voices']
  },
  {
    title: 'Content style guide template',
    keywords: ['content style guide template', 'content guidelines', 'editorial style guide']
  }
]

/**
 * Generate outline for a blog post
 */
async function generateOutline(topic, keywords) {
  // Check if topic or keywords mention template
  const hasTemplateKeyword = topic.toLowerCase().includes('template') || 
                             keywords.some(k => k.toLowerCase().includes('template'))
  
  const outlinePrompt = `Generate a detailed outline for a blog post about: ${topic}

Target Keywords: ${keywords.join(', ') || 'none provided'}

${hasTemplateKeyword ? `CRITICAL: The topic or keywords mention "template". This indicates user intent to find an actual template. You MUST:
1. Use "Template/Toolkit" format
2. Include "template" in the title (users expect to find one)
3. Set includes_template to true
4. Provide a detailed description of what the template will contain
5. The template should be a complete, ready-to-use document with:
   - Detailed sections with clear instructions
   - Example content showing how to fill it out
   - Copyable structure that users can immediately adapt
   - Not just placeholders - include guidance and examples` : `If the topic mentions "template", you can either:
1. Include an actual usable template in the article (use Template/Toolkit format)
2. Use Guide format if not providing a template (avoid "template" in title)`}

Create an outline that includes:
1. Main title (keep under 60 characters${hasTemplateKeyword ? ', include "template" if providing one' : ''})
2. Proposed article format (Guide, List, Comparison, Question-based, Case Study, Explainer, or Template/Toolkit)
3. Main sections with H2 headings (if Template/Toolkit format, include a section for the actual template)
4. Key points for each section
5. If including a template, describe what it will contain in detail

Return as JSON with this structure:
{
  "title": "proposed title",
  "format": "format type",
  "sections": [
    {
      "heading": "H2 heading",
      "key_points": ["point 1", "point 2", ...]
    }
  ],
  "includes_template": true/false,
  "template_description": "detailed description of template structure, sections, and example content if included, or null"
}`

  console.log(`\n📝 Generating outline for: "${topic}"`)
  
  const result = await generateWithOpenAI(
    outlinePrompt,
    BLOG_SYSTEM_PROMPT,
    'json',
    2000,
    'gpt-4o'
  )

  if (!result.success || !result.content) {
    console.error(`❌ Outline generation failed:`, result.error)
    return null
  }

  try {
    const outline = JSON.parse(result.content)
    
    console.log(`\n📋 Outline Generated:`)
    console.log(`   Title: "${outline.title}"`)
    console.log(`   Format: ${outline.format}`)
    console.log(`   Includes Template: ${outline.includes_template || false}`)
    if (outline.template_description) {
      console.log(`   Template: ${outline.template_description}`)
    }
    console.log(`   Sections: ${outline.sections?.length || 0}`)
    
    // Check template keyword presence
    const topicHasTemplate = topic.toLowerCase().includes('template') || 
                             keywords.some(k => k.toLowerCase().includes('template'))
    const titleHasTemplate = outline.title.toLowerCase().includes('template')
    
    if (topicHasTemplate && !outline.includes_template) {
      console.log(`   ⚠️  WARNING: Topic/keywords mention template but outline doesn't include one!`)
      console.log(`   ⚠️  User intent expects a template - this may hurt SEO`)
    }
    
    if (topicHasTemplate && outline.includes_template) {
      console.log(`   ✅ Good: Topic mentions template and outline includes one`)
    }
    
    if (titleHasTemplate && !outline.includes_template) {
      console.log(`   ⚠️  WARNING: Title promises template but outline doesn't include one!`)
    }
    
    if (titleHasTemplate && outline.includes_template) {
      console.log(`   ✅ Good: Title promises template and outline includes one`)
    }
    
    return outline
  } catch (parseError) {
    console.error(`❌ Failed to parse outline JSON:`, parseError.message)
    console.error(`   Raw response: ${result.content.substring(0, 200)}...`)
    return null
  }
}

/**
 * Generate article from outline
 */
async function generateArticleFromOutline(outline, topic, keywords) {
  const articlePrompt = `Write a comprehensive blog post based on this outline:

Title: ${outline.title}
Format: ${outline.format}
${outline.includes_template ? `Template Description: ${outline.template_description}` : ''}

Sections:
${outline.sections.map((s, i) => `${i + 1}. ${s.heading}\n   ${s.key_points.join('\n   ')}`).join('\n\n')}

Target Keywords: ${keywords.join(', ') || 'none provided'}

${outline.includes_template ? `IMPORTANT: Include the actual template described above. The template should be:
- Complete and ready-to-use (not just placeholders)
- Include example content showing how sections should be filled out
- Have detailed instructions within each section
- Be structured so users can copy and immediately adapt it
- Show both the structure AND examples of completed sections` : ''}

Write the full article following the outline. Use the same format instructions from the blog post generation prompt.
Return as JSON with: title, content (in markdown), excerpt, keywords array.`

  console.log(`\n✍️  Generating article from outline...`)
  
  const result = await generateWithOpenAI(
    articlePrompt,
    BLOG_SYSTEM_PROMPT,
    'json',
    3000,
    'gpt-4o'
  )

  if (!result.success || !result.content) {
    console.error(`❌ Article generation failed:`, result.error)
    return null
  }

  try {
    const article = JSON.parse(result.content)
    
    // Check if article actually includes a template section
    const contentLower = article.content.toLowerCase()
    const hasTemplateSection = contentLower.includes('template') && (
      contentLower.includes('##') && contentLower.match(/##\s*.*template/i) ||
      contentLower.includes('downloadable') ||
      contentLower.includes('copy this') ||
      contentLower.includes('use this template')
    )
    
    console.log(`\n✅ Article Generated:`)
    console.log(`   Title: "${article.title}"`)
    console.log(`   Word Count: ${article.content.split(/\s+/).length}`)
    console.log(`   Has Template Section: ${hasTemplateSection ? 'Yes' : 'No'}`)
    
    if (outline.includes_template && !hasTemplateSection) {
      console.log(`   ⚠️  WARNING: Outline promised template but article doesn't include it!`)
    }
    
    // Show full content for template-related topics
    const topicHasTemplate = topic.toLowerCase().includes('template') || 
                             keywords.some(k => k.toLowerCase().includes('template'))
    if (topicHasTemplate) {
      console.log(`\n📄 FULL ARTICLE CONTENT:`)
      console.log(`─`.repeat(60))
      console.log(article.content)
      console.log(`─`.repeat(60))
      
      // Check if template section exists
      const templateSectionMatch = article.content.match(/##\s+.*[Tt]emplate.*/i)
      if (templateSectionMatch) {
        console.log(`\n✅ Found template section: ${templateSectionMatch[0]}`)
      } else {
        console.log(`\n⚠️  No template section found in content (checked for "## ... Template")`)
      }
    }
    
    return article
  } catch (parseError) {
    console.error(`❌ Failed to parse article JSON:`, parseError.message)
    return null
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing Two-Step Blog Generation (Outline → Article)')
  console.log('=' .repeat(60))
  
  for (const topic of testTopics) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: "${topic.title}"`)
    console.log('='.repeat(60))
    
    // Step 1: Generate outline
    const outline = await generateOutline(topic.title, topic.keywords)
    
    if (!outline) {
      console.log(`❌ Skipping article generation due to outline failure`)
      continue
    }
    
    // Step 2: Generate article from outline
    const article = await generateArticleFromOutline(outline, topic.title, topic.keywords)
    
    if (article) {
      console.log(`\n✅ Test complete for "${topic.title}"`)
    }
    
    // Wait between tests
    if (testTopics.indexOf(topic) < testTopics.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next test...`)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('🎉 All tests complete!')
}

main().catch(error => {
  console.error('❌ Test script error:', error)
  process.exit(1)
})

