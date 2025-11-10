/**
 * Shared blog post generation prompts
 * Used by both the bulk generation script and the API endpoint
 * Prompts are loaded from markdown files in lib/prompts/ for easier editing
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load prompts from markdown files
const promptsDir = path.join(__dirname, 'prompts')

function loadPromptFile(filename) {
  try {
    const filePath = path.join(promptsDir, filename)
    let content = fs.readFileSync(filePath, 'utf-8').trim()
    // Remove markdown header (# Title) if present
    content = content.replace(/^#\s+.*\n/, '')
    return content.trim()
  } catch (error) {
    console.error(`Error loading prompt file ${filename}:`, error)
    throw error
  }
}

// Load system prompt
export const BLOG_SYSTEM_PROMPT = loadPromptFile('system-prompt.md')

// Load instruction templates (headers already removed by loadPromptFile)
const outlineInstructions = loadPromptFile('outline-instructions.md')
const articleInstructions = loadPromptFile('article-instructions.md')

/**
 * Format keywords array or string into a readable text format
 * @param {string[]|string} keywords - Keywords array or string
 * @returns {string} Formatted keywords text
 */
function formatKeywords(keywords) {
  return Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (typeof keywords === 'string' ? keywords : 'none provided')
}


/**
 * Generate outline prompt for blog post (Step 1: Outline generation)
 * @param {string} topic - The blog post topic
 * @param {string[]} keywords - Array of target keywords
 * @param {object|null} researchNotes - Optional research notes from Firecrawl search
 * @param {string} [researchNotes.summary] - Summary of search results
 * @param {string[]} [researchNotes.urls] - URLs of sources
 * @param {*} [researchNotes.markdown] - Markdown content (string or array)
 * @returns {string} The outline generation prompt
 */
export function getBlogOutlinePrompt(topic, keywords = [], researchNotes = null) {
  const keywordsText = formatKeywords(keywords)
  
  // Check if topic or keywords mention template (for SEO title guidance)
  const hasTemplateKeyword = topic.toLowerCase().includes('template') || 
                             (Array.isArray(keywords) && keywords.some(k => k.toLowerCase().includes('template')))
  
  // Build research notes section if available
  let researchSection = ''
  if (researchNotes && researchNotes.urls && researchNotes.urls.length > 0) {
    researchSection = `\n## Research Sources\n\nYou have access to recent research from these sources:\n${researchNotes.urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n\n`
    
    // Include full markdown content if available
    if (researchNotes.markdown && Array.isArray(researchNotes.markdown) && researchNotes.markdown.length > 0) {
      researchSection += `### Full Article Content\n\n`
      researchNotes.markdown.forEach((source, i) => {
        researchSection += `**Source ${i + 1}: ${source.title || researchNotes.urls[i]}**\n\n`
        // Include up to 3000 chars per source for analysis
        const markdownPreview = source.markdown.substring(0, 3000)
        researchSection += `${markdownPreview}${source.markdown.length > 3000 ? '\n\n... (content continues)\n' : ''}\n\n---\n\n`
      })
      researchSection += `\n**YOUR TASK:** Analyze this research content and extract the most valuable excerpts for the article writer:

• Identify specific brand examples with details (what they did, results achieved, voice traits used)
• Extract relevant statistics, quotes, or data points
• Note unique frameworks, methods, or perspectives
• Find actionable tactics or step-by-step guidance

For each excerpt you want to include in the article, note:
• Which source it's from (by number)
• The specific text or insight
• Which section of your outline it should support

You'll return these excerpts in the JSON response so the writer can cite them accurately.\n`
    } else if (researchNotes.summary) {
      researchSection += `Summary:\n${researchNotes.summary}\n\nUse these insights to inform your outline. Note any specific examples or data you want referenced.\n`
    }
  }
  
  // Add template SEO guidance if template keyword detected
  const templateGuidance = hasTemplateKeyword 
    ? `\n**Important:** The topic or keywords mention "template". User intent is to find a template solution but instead of offering a template, include a section comparing manual templates vs automated solutions. Include "template" in the title for SEO purposes.\n`
    : ''
  
  return `Generate a rich, detailed outline for a blog post about: ${topic}

Target Keywords: ${keywordsText || 'none provided'}${researchSection}${templateGuidance}

${outlineInstructions}`
}

/**
 * Get format-specific writing instructions
 * @param {string} format - The article format
 * @returns {string} Format-specific guidance
 */
function getFormatGuidance(format) {
  const guidance = {
    'Guide': 'Structure as step-by-step instructions with clear, actionable guidance.',
    'List': 'Use a mix of paragraphs and lists. Even for list-format articles, expand each item with context and explanation rather than bare bullet points.',
    'Comparison': 'Clearly compare and contrast options, highlighting key differences and similarities.',
    'Question-based': 'Answer the key question thoroughly with supporting evidence and examples.',
    'Case Study': 'Analyze real examples with specific details, outcomes, and lessons learned.',
    'Explainer': 'Define concepts clearly and build understanding progressively from basics to advanced.',
    'Anatomy of x': 'Analyze the anatomy of x, breaking down the components and how they work together.'
  }
  
  return guidance[format] || 'Write in a clear, engaging format appropriate for the topic.'
}

/**
 * Generate article prompt from outline (Step 2: Article generation)
 * @param {object} outline - The generated outline
 * @param {string[]} keywords - Array of target keywords
 * @param {object} [linkInstructions] - Optional linking instructions
 * @param {Array} [linkInstructions.internal] - Array of {title, slug} for internal links
 * @param {Array} [linkInstructions.external] - Array of {title, url} for external links
 * @returns {string} The article generation prompt
 */
export function getBlogArticlePromptFromOutline(outline, keywords = [], linkInstructions = undefined) {
  const keywordsText = formatKeywords(keywords)
  
  // Build research citation instructions from outline's curated excerpts
  let citationInstructions = ''
  if (outline.research_excerpts && Array.isArray(outline.research_excerpts) && outline.research_excerpts.length > 0) {
    citationInstructions = `\n## Research Excerpts for Citation\n\nThe outline agent has identified these relevant excerpts from recent research. Use the most relevant ones to enrich your article:\n\n`
    
    // Helper function to add UTM parameters to URLs
    const addUTMParams = (url) => {
      if (!url) return url
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}utm_source=aistyleguide&utm_medium=blog&utm_campaign=reference`
    }
    
    // Helper function to extract source name from URL
    const getSourceName = (url) => {
      if (!url) return 'Source'
      try {
        const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
        const parts = domain.split('.')
        // Get the main domain name (e.g., "sproutsocial" from "sproutsocial.com")
        const mainDomain = parts[0]
        // Capitalize first letter and handle common cases
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1).replace(/-/g, ' ')
      } catch {
        return 'Source'
      }
    }
    
    outline.research_excerpts.forEach((excerpt, i) => {
      const trackedUrl = addUTMParams(excerpt.source_url)
      const sourceName = getSourceName(excerpt.source_url)
      citationInstructions += `${i + 1}. **${excerpt.context}**\n   Source Name: ${sourceName}\n   Source URL: ${trackedUrl}\n   Excerpt: "${excerpt.excerpt}"\n\n`
    })
    
    const firstSourceName = getSourceName(outline.research_excerpts[0].source_url)
    const firstTrackedUrl = addUTMParams(outline.research_excerpts[0].source_url)
    
    citationInstructions += `\n**Citation Requirements:**
- Use the most relevant excerpts from above to support your content (you don't need to use all of them)
- When you reference information from these excerpts, ALWAYS include a clickable hyperlink using the Source Name provided above
- Use markdown link format: [Source Name](url) - these render as clickable links on the blog
- Use the exact Source Names and URLs provided above (URLs include tracking parameters)
- Format examples:
  * "According to [${firstSourceName}](${firstTrackedUrl}), brand voice is..."
  * "As [${firstSourceName}](${firstTrackedUrl}) notes, a consistent voice..."
  * "Research from [${firstSourceName}](${firstTrackedUrl}) shows that..."
- NEVER use generic terms like "source" or "research" - always use the actual Source Name provided
- Cite each excerpt you use in its relevant section (see context notes)
- For direct quotes: use quotation marks AND include the source link with Source Name
- For paraphrased content: still include the source link with Source Name
- Make citations natural and contextual
`
  }
  
  // Build linking instructions
  let linkingInstructions = ''
  if (linkInstructions) {
    const internalLinks = linkInstructions.internal || []
    const externalLinks = linkInstructions.external || []
    
    if (internalLinks.length > 0 || externalLinks.length > 0) {
      linkingInstructions = '\n## Linking Requirements\n\n'
      
      if (internalLinks.length > 0) {
        linkingInstructions += `Include internal links to these related posts naturally within the content:\n${internalLinks.map(link => `- [${link.title}](/blog/${link.slug})`).join('\n')}\n\n`
      }
      
      if (externalLinks.length > 0) {
        linkingInstructions += `Include authoritative external links to these sources where relevant:\n${externalLinks.map(link => `- [${link.title}](${link.url})`).join('\n')}\n\n`
      }
      
      linkingInstructions += 'Integrate these links naturally within the relevant sections - do not create a separate "Related Links" section.'
    }
  }
  
  return `Write a rich, comprehensive article following the outline. Expand each section substantially with real examples, detailed explanations, and actionable insights. ${getFormatGuidance(outline.format)}:

Title: ${outline.title}
Format: ${outline.format}

Sections:
${outline.sections.map((s, i) => {
  let sectionText = `${i + 1}. ${s.heading}\n   Topics to cover: ${(s.topics || s.key_points || []).join(', ')}`
  
  // Add expansion guidance if available
  if (s.expansion_guidance) {
    const eg = s.expansion_guidance
    sectionText += `\n   Expansion guidance:`
    if (eg.key_questions && eg.key_questions.length > 0) {
      sectionText += `\n   - Questions to explore: ${eg.key_questions.join('; ')}`
    }
    if (eg.angle) {
      sectionText += `\n   - Angle: ${eg.angle}`
    }
    if (eg.reader_context) {
      sectionText += `\n   - Reader context: ${eg.reader_context}`
    }
  }
  
  return sectionText
}).join('\n\n')}

Target Keywords: ${keywordsText || 'none provided'}${citationInstructions}${linkingInstructions}

${articleInstructions}

Return as JSON with: title, content (in markdown format, start with "# {title}"), excerpt (140-160 characters), keywords array (5-8 relevant SEO keywords).`
}

