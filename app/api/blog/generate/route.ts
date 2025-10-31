import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWithOpenAI } from '@/lib/openai'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Available categories for blog posts
const AVAILABLE_CATEGORIES = [
  'Brand Strategy',
  'Content Creation',
  'Marketing',
  'AI Tools',
  'Case Studies'
]

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
}

async function generateCategory(topic: string, keywords: string[]): Promise<string> {
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
    // Clean up the category - strip markdown code blocks if present
    let category = result.content.trim()
    category = category.replace(/^`+|`+$/g, '') // Remove markdown code block markers
    category = category.trim()
    
    // Validate it's one of our categories
    if (AVAILABLE_CATEGORIES.includes(category)) {
      return category
    }
  }

  // Fallback to default
  return 'Brand Strategy'
}

export async function POST(req: NextRequest) {
  try {
    // Authentication - check session cookie
    const cookieStore = await cookies()
    const session = cookieStore.get('admin-blog-session')
    
    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Parse and validate input
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const topic: string = body?.topic
    const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords : []
    const categoryOverride: string | undefined = body?.category
    const publish: boolean = body?.publish !== false

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: topic' }, { status: 400 })
    }

    // Generate category if not provided
    let category = categoryOverride
    if (!category) {
      category = await generateCategory(topic, keywords)
    }

    // Validate category is in allowed list
    if (!AVAILABLE_CATEGORIES.includes(category)) {
      category = 'Brand Strategy' // Fallback
    }

    // System prompt with brand voice beliefs
    const systemPrompt = `You are a brand voice and content style guide expert specializing in copywriting and content marketing. The current year is 2025. You believe that:

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
    
    const userPrompt = `Write a comprehensive, SEO-optimized blog post about the given topic. The post should be:

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

Topic: ${topic}
Target Keywords: ${keywords.join(', ') || 'none provided'}

Write for marketing professionals, content creators, and business owners who want to improve their brand communication.`

    // Generate content
    const result = await generateWithOpenAI(
      userPrompt,
      systemPrompt,
      'json',
      3000,
      'gpt-4o'
    )

    if (!result.success || !result.content) {
      console.error('Content generation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Content generation failed' },
        { status: 502 }
      )
    }

    // Parse generated content
    let generated
    try {
      generated = JSON.parse(result.content)
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON response from content generation' },
        { status: 502 }
      )
    }

    // Validate required fields
    const title: string = generated.title
    const content: string = generated.content
    const excerpt: string = generated.excerpt
    const kws: string[] = Array.isArray(generated.keywords) ? generated.keywords : keywords

    if (!title || !content || !excerpt) {
      return NextResponse.json(
        { error: 'Incomplete generation: missing title, content, or excerpt' },
        { status: 502 }
      )
    }

    // Generate slug and calculate metrics
    const slug = slugify(title)
    const word_count = content.split(/\s+/).length
    const reading_time = Math.ceil(word_count / 200)

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Prepare blog post data
    const blogPost = {
      title,
      slug,
      content,
      excerpt,
      keywords: kws,
      category,
      author_name: 'Tahi Gichigi',
      author_image: '/logos/profile_orange_clean.png',
      word_count,
      reading_time,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null
    }

    // Insert into database
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPost])
      .select()
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        // Unique constraint violation (duplicate slug)
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        )
      }
      console.error('Database insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, post: data },
      { status: 201 }
    )
  } catch (err) {
    console.error('Generate endpoint error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

