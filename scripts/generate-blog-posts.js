#!/usr/bin/env node

/**
 * Blog Post Generation Script
 * Reads CSV topics and generates blog posts using OpenAI API
 * Usage: node scripts/generate-blog-posts.js [--dry-run] [--limit=5]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
// Allow override with --csv flag, otherwise use default path
const csvArg = process.argv.find(arg => arg.startsWith('--csv='))
const DEFAULT_CSV_PATH = '/Users/tahi/Downloads/AIStyleGuide_HighLevel_Topics_and_Keywords.csv'
const TEMPLATE_CSV_PATH = path.join(__dirname, 'blog-topics-template.csv')
const CSV_PATH = csvArg ? csvArg.split('=')[1] : DEFAULT_CSV_PATH
const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '5')

// Standalone generateWithOpenAI function (matches lib/openai.ts logic)
async function generateWithOpenAI(prompt, systemPrompt, responseFormat = 'json', max_tokens = 2000, model = 'gpt-4o-mini') {
  const maxAttempts = 3
  
  // Initialize OpenAI client (lazy initialization)
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

      // Log token usage
      if (response.usage) {
        console.log('='.repeat(50))
        console.log('🔢 TOKEN USAGE SUMMARY')
        console.log('='.repeat(50))
        console.log(`Model: ${response.model}`)
        console.log(`Prompt tokens: ${response.usage.prompt_tokens}`)
        console.log(`Completion tokens: ${response.usage.completion_tokens}`)
        console.log(`Total tokens: ${response.usage.total_tokens}`)
        console.log(`Max tokens requested: ${max_tokens}`)
        console.log('='.repeat(50))
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

// System prompt with brand voice beliefs (matches API endpoint)
const SYSTEM_PROMPT = `You are a brand voice and content style guide expert specializing in copywriting and content marketing. The current year is 2025. You believe that:

1. Brand voice is the moat — it's what makes every brand unique.
2. Content is what you say; brand voice is how you say it.
3. Brand voice comes from what you do, why you do it, and who you do it for.
4. Brand voice and tone of voice mean the same thing — voice doesn't change based on circumstance, it just flexes as you lean into different voice traits.
5. A good brand voice is made up of 3 traits that are single word adjectives and supported by spelling, grammar, punctuation and formatting rules that reinforce the voice.
6. Strong visuals exist to strengthen the voice.
7. A strong voice makes even simple ideas memorable.
8. Voice is the bridge between brand and emotion.
9. When voice is right, you don't need to shout.
10. People don't remember what you wrote; they remember how it felt.

Always return strict JSON only.`

// User prompt template (matches API endpoint)
const USER_PROMPT_TEMPLATE = `Write a comprehensive, SEO-optimized blog post about the given topic. The post should be:

1. **Informative and actionable** - Provide practical insights readers can implement
2. **SEO-friendly** - Naturally incorporate the target keywords
3. **Well-structured** - Use clear headings, subheadings, and bullet points
4. **Engaging** - Write in a conversational, professional tone
5. **Comprehensive** - Cover the topic thoroughly (800-1200 words)
6. **Voice-driven** - Reflect your brand voice beliefs throughout

Format the response as JSON with these fields:
- title: The blog post title (60 characters or less)
- content: The full blog post content in markdown format. Start with "# {title}" then include well-structured sections with H2 headings
- excerpt: A compelling 140-160 character summary
- keywords: Array of 5-8 relevant SEO keywords from the target keywords provided or close variants

Topic: {title}
Target Keywords: {keywords}

Write for marketing professionals, content creators, and business owners who want to improve their brand communication.`

/**
 * Parse CSV file
 * Expected format:
 * - Column 1: title (required)
 * - Column 2: keywords (required, comma-separated)
 * - Column 3: category (optional, defaults to Brand Strategy)
 * 
 * Example:
 * title,keywords,category
 * Brand Voice Guide,brand voice,marketing,Brand Strategy
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim())
    
    // Validate required fields
    if (!values[0] || values[0].trim() === '') {
      throw new Error(`Row ${index + 2}: Missing required field 'title'`)
    }
    
    return {
      title: values[0],
      keywords: values[1] || '',
      category: values[2] // Optional category column
    }
  })
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
}

// Available categories (matches API endpoint)
const AVAILABLE_CATEGORIES = [
  'Brand Strategy',
  'Content Creation',
  'Marketing',
  'AI Tools',
  'Case Studies'
]

// Category generation function (matches API endpoint logic)
async function generateCategory(topic, keywords) {
  const keywordsText = keywords.length > 0 ? keywords.join(', ') : 'none provided'
  
  const prompt = `Analyze this blog topic and determine the most appropriate category from these options:
${AVAILABLE_CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

Topic: ${topic}
Keywords: ${keywordsText}

Return ONLY the category name that best fits this topic. No explanation, just the category name.`

  const result = await generateWithOpenAI(
    prompt,
    'You are a content categorization expert. Return only the category name.',
    'markdown',
    50,
    'gpt-4o-mini'
  )

  if (result.success && result.content) {
    let category = result.content.trim()
    category = category.replace(/^`+|`+$/g, '') // Remove markdown code block markers
    category = category.trim()
    
    if (AVAILABLE_CATEGORIES.includes(category)) {
      return category
    }
  }

  return 'Brand Strategy' // Fallback
}

// Note: Gradient generation is handled on the frontend (BlogCard component)
// The same slug-based hash logic ensures consistent gradients across listing and post pages

function calculateReadingTime(content) {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

async function generateBlogPost(topic) {
  console.log(`🤖 Generating blog post for: "${topic.title}"`)
  
  try {
    // Validate topic input
    if (!topic || !topic.title || typeof topic.title !== 'string' || topic.title.trim() === '') {
      throw new Error('Invalid topic: title is required')
    }

    // Parse keywords (handle comma-separated string)
    const keywords = topic.keywords ? topic.keywords.split(',').map(k => k.trim()).filter(k => k) : []
    
    // Determine category
    let category = topic.category
    if (!category || !AVAILABLE_CATEGORIES.includes(category)) {
      console.log(`   📂 Generating category for "${topic.title}"...`)
      category = await generateCategory(topic.title, keywords)
    }
    if (!AVAILABLE_CATEGORIES.includes(category)) {
      category = 'Brand Strategy' // Fallback
    }
    console.log(`   📂 Category: ${category}`)

    // Build user prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{title}', topic.title)
      .replace('{keywords}', keywords.join(', ') || 'none provided')

    // Generate content using generateWithOpenAI helper
    console.log(`   ✍️  Generating content...`)
    const result = await generateWithOpenAI(
      userPrompt,
      SYSTEM_PROMPT,
      'json',
      3000,
      'gpt-4o'
    )

    if (!result.success || !result.content) {
      console.error(`❌ Content generation failed for "${topic.title}":`, result.error)
      return null
    }

    // Parse generated content
    let blogPost
    try {
      blogPost = JSON.parse(result.content)
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON for "${topic.title}":`, parseError.message)
      console.error(`   Raw response preview: ${result.content.substring(0, 200)}...`)
      return null
    }

    // Validate required fields
    if (!blogPost.title || typeof blogPost.title !== 'string') {
      throw new Error('Missing or invalid title in generated content')
    }
    if (!blogPost.content || typeof blogPost.content !== 'string') {
      throw new Error('Missing or invalid content in generated content')
    }
    if (!blogPost.excerpt || typeof blogPost.excerpt !== 'string') {
      throw new Error('Missing or invalid excerpt in generated content')
    }

    // Validate keywords
    if (!Array.isArray(blogPost.keywords)) {
      if (blogPost.keywords && typeof blogPost.keywords === 'string') {
        blogPost.keywords = [blogPost.keywords]
      } else {
        blogPost.keywords = keywords.length > 0 ? keywords : []
      }
    }

    // Calculate additional fields
    const wordCount = blogPost.content.split(/\s+/).length
    const readingTime = calculateReadingTime(blogPost.content)
    const slug = createSlug(blogPost.title)
    const keywordsArray = Array.isArray(blogPost.keywords) ? blogPost.keywords : keywords

    console.log(`   ✅ Generated: ${wordCount} words, ${readingTime} min read`)

    return {
      title: blogPost.title,
      slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      keywords: keywordsArray,
      category,
      author_name: 'Tahi Gichigi',
      author_image: '/logos/profile_orange_clean.png',
      word_count: wordCount,
      reading_time: readingTime,
      is_published: true,
      published_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`❌ Error generating blog post for "${topic.title}":`, error.message)
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`)
    }
    return null
  }
}

async function saveBlogPost(blogPost) {
  // Lazy initialization of Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (DRY_RUN) {
    console.log('📝 [DRY RUN] Would save blog post:', {
      title: blogPost.title,
      slug: blogPost.slug,
      word_count: blogPost.word_count,
      reading_time: blogPost.reading_time
    })
    return { success: true }
  }

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPost])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`⚠️  Blog post with slug "${blogPost.slug}" already exists, skipping...`)
        return { success: false, reason: 'duplicate' }
      }
      throw error
    }

    console.log(`✅ Saved blog post: "${blogPost.title}" (${blogPost.word_count} words)`)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ Error saving blog post "${blogPost.title}":`, error.message)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Starting blog post generation...')
  console.log(`📊 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`📝 Limit: ${LIMIT} posts`)
  console.log(`📄 CSV Path: ${CSV_PATH}`)
  console.log('')

  // Validate environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required')
    process.exit(1)
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    process.exit(1)
  }

  // Read and parse CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`)
    console.error(`   💡 Tip: Update CSV_PATH in the script or create a CSV file at this location`)
    console.error(`   📄 Template available at: scripts/blog-topics-template.csv`)
    process.exit(1)
  }

  let topics
  try {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
    topics = parseCSV(csvContent)
  } catch (error) {
    console.error(`❌ Error parsing CSV file: ${error.message}`)
    process.exit(1)
  }
  
  console.log(`📋 Found ${topics.length} topics in CSV`)
  
  // Process topics (limited by LIMIT)
  const topicsToProcess = topics.slice(0, LIMIT)
  console.log(`🎯 Processing ${topicsToProcess.length} topics`)
  console.log('')

  let successful = 0
  let failed = 0
  let skipped = 0

  for (const [index, topic] of topicsToProcess.entries()) {
    console.log(`\n[${index + 1}/${topicsToProcess.length}]`)
    
    // Generate blog post
    const blogPost = await generateBlogPost(topic)
    if (!blogPost) {
      failed++
      continue
    }

    // Save blog post
    const result = await saveBlogPost(blogPost)
    if (result.success) {
      successful++
    } else if (result.reason === 'duplicate') {
      skipped++
    } else {
      failed++
    }

    // Rate limiting - wait 2 seconds between requests
    if (index < topicsToProcess.length - 1) {
      console.log('⏳ Waiting 2 seconds...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('\n🎉 Generation complete!')
  console.log(`✅ Successful: ${successful}`)
  console.log(`⚠️  Skipped (duplicates): ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total processed: ${successful + skipped + failed}`)
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
