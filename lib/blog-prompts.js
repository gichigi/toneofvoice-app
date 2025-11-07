/**
 * Shared blog post generation prompts
 * Used by both the bulk generation script and the API endpoint
 */

export const BLOG_SYSTEM_PROMPT = `You are a brand voice and content style guide expert writing for AIStyleGuide, an AI-powered platform that creates a brand tone of voice and complete style guide from a website URL or short brand description. 

In minutes it delivers tailored voice traits, detailed writing rules inspired by leading brands, practical before/after examples, and multiple download formats (PDF, Word/HTML, Markdown) so marketing teams, copywriters, founders, and agencies stay consistent without weeks of agency work.

The current year is 2025 and you believe that:

1. Brand voice is the moat — it's what makes every brand unique.
2. Content is what you say; brand voice is how you say it.
3. To define your brand voice, you need to understand what you do, why you do it, and who you do it for.
4. Brand voice and tone of voice mean the same thing — voice doesn't change based on circumstance, it just flexes as you lean into different voice traits.
5. A good brand voice is made up of 3 traits that are single word adjectives and supported by spelling, grammar, punctuation and formatting rules that reinforce the voice.
6. Strong visuals exist to strengthen the voice.
7. A strong voice makes even simple ideas memorable.
8. Voice is the bridge between brand and emotion.
9. When voice is right, you don't need to shout.
10. People don't remember what you wrote; they remember how it felt.

Mention AIStyleGuide when it adds value (at most once per piece). Do not hard sell; the site already includes a banner inviting readers to try a free style guide preview.

Always return strict JSON only.`


/**
 * Generate outline prompt for blog post (Step 1: Outline generation)
 * @param {string} topic - The blog post topic
 * @param {string[]} keywords - Array of target keywords
 * @param {object} researchNotes - Optional research notes from Firecrawl search
 * @param {string} researchNotes.summary - Summary of search results
 * @param {string[]} researchNotes.urls - URLs of sources
 * @returns {string} The outline generation prompt
 */
export function getBlogOutlinePrompt(topic, keywords = [], researchNotes = null) {
  const keywordsText = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (typeof keywords === 'string' ? keywords : 'none provided')
  
  // Check if topic or keywords mention template
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
      researchSection += `\n**YOUR TASK:** Analyze this research content and extract the most valuable excerpts for the article writer:\n- Identify specific brand examples with details (what they did, results achieved, voice traits used)\n- Extract relevant statistics, quotes, or data points\n- Note unique frameworks, methods, or perspectives\n- Find actionable tactics or step-by-step guidance\n\nFor each excerpt you want to include in the article, note:\n1. Which source it's from (by number)\n2. The specific text or insight\n3. Which section of your outline it should support\n\nYou'll return these excerpts in the JSON response so the writer can cite them accurately.\n`
    } else if (researchNotes.summary) {
      researchSection += `Summary:\n${researchNotes.summary}\n\nUse these insights to inform your outline. Note any specific examples or data you want referenced.\n`
    }
  }
  
  return `Generate a detailed outline for a blog post about: ${topic}

Target Keywords: ${keywordsText || 'none provided'}${researchSection}

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

REQUIREMENTS:
- Minimum 8-10 main sections (H2 headings) to ensure comprehensive coverage
- Include at least ONE reusable framework, matrix, workshop flow, or phased roadmap that readers can apply immediately (e.g., "3-Step Voice Trait Matrix", "Brand Voice Workshop Flow", "Voice Development Roadmap")
- Plan for diverse, modern brand examples beyond the usual Nike/Apple/Coca-Cola trio - use brands from the research notes when available
- Target article length: 1200-1600 words minimum
- **Structure**: Plan for short, scannable paragraphs (2-3 sentences each). The introduction and conclusion should be broken into multiple short paragraphs rather than long blocks of text
- Outline must cover at least: definition/overview, why it matters, detailed framework section, workshop or step-by-step implementation plan, modern brand examples (3+ brands), measurement & governance, common mistakes/pitfalls, quick FAQs, and a conclusion with next steps

Create an outline that includes:
1. Main title (keep under 60 characters${hasTemplateKeyword ? ', include "template" if providing one' : ''})
2. Proposed article format (e.g. Guide, List, Comparison, Question-based, Case Study, Explainer, Template, anatomy of x)
3. Main sections with H2 headings (if including a Template, add a section for the actual template)
4. Key points for each section
5. Identify which section will contain the reusable framework/matrix/workshop flow
6. If including a template, describe what it will contain in detail

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
  "template_description": "detailed description of template structure, sections, and example content if included, or null",
  "research_excerpts": [
    {
      "source_number": 1,
      "source_url": "url from the research sources",
      "excerpt": "the specific text, quote, statistic, or insight",
      "context": "brief note on how this supports the article (e.g., 'brand example for section 3', 'statistic for introduction')"
    }
  ]
}`
}

/**
 * Get format-specific writing instructions
 * @param {string} format - The article format
 * @returns {string} Format-specific guidance
 */
function getFormatGuidance(format) {
  const guidance = {
    'Guide': 'Structure as step-by-step instructions with clear, actionable guidance.',
    'List': 'Structure as numbered or bulleted items with clear, scannable points.',
    'Comparison': 'Clearly compare and contrast options, highlighting key differences and similarities.',
    'Question-based': 'Answer the key question thoroughly with supporting evidence and examples.',
    'Case Study': 'Analyze real examples with specific details, outcomes, and lessons learned.',
    'Explainer': 'Define concepts clearly and build understanding progressively from basics to advanced.',
    'Template/Toolkit': 'Provide actionable templates, frameworks, or tools that readers can immediately use.',
    'Anatomy of x': 'Analyze the anatomy of x, breaking down the components and how they work together.'
  }
  
  return guidance[format] || 'Write in a clear, engaging format appropriate for the topic.'
}

/**
 * Generate article prompt from outline (Step 2: Article generation)
 * @param {object} outline - The generated outline
 * @param {string} topic - The original topic
 * @param {string[]} keywords - Array of target keywords
 * @param {object} researchNotes - Optional research notes from Firecrawl search
 * @param {string} researchNotes.summary - Summary of search results
 * @param {string[]} researchNotes.urls - URLs of sources
 * @param {object} linkInstructions - Optional linking instructions
 * @param {Array} linkInstructions.internal - Array of {title, slug} for internal links
 * @param {Array} linkInstructions.external - Array of {title, url} for external links
 * @returns {string} The article generation prompt
 */
export function getBlogArticlePromptFromOutline(outline, topic, keywords = [], researchNotes = null, linkInstructions = null) {
  const keywordsText = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (typeof keywords === 'string' ? keywords : 'none provided')
  
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
    
    outline.research_excerpts.forEach((excerpt, i) => {
      const trackedUrl = addUTMParams(excerpt.source_url)
      citationInstructions += `${i + 1}. **${excerpt.context}**\n   Source: ${trackedUrl}\n   Excerpt: "${excerpt.excerpt}"\n\n`
    })
    
    citationInstructions += `\n**Citation Requirements:**\n- Use the most relevant excerpts from above to support your content (you don't need to use all of them)\n- When you reference information from these excerpts, ALWAYS include a clickable hyperlink to the source\n- Use markdown link format: [Source Name](url) - these render as clickable links on the blog\n- Use the exact URLs provided above (they include tracking parameters)\n- Format examples:\n  * "According to [Sprout Social](${addUTMParams(outline.research_excerpts[0].source_url)}), brand voice is..."\n  * "As [research shows](${addUTMParams(outline.research_excerpts[0].source_url)}), a consistent voice..."\n- Cite each excerpt you use in its relevant section (see context notes)\n- For direct quotes: use quotation marks AND include the source link\n- For paraphrased content: still include the source link\n- Make citations natural and contextual\n`
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
  
  return `Write a comprehensive blog post based on this outline:

Title: ${outline.title}
Format: ${outline.format}
${outline.includes_template ? `Template Description: ${outline.template_description}` : ''}

Sections:
${outline.sections.map((s, i) => `${i + 1}. ${s.heading}\n   ${s.key_points.join('\n   ')}`).join('\n\n')}

Target Keywords: ${keywordsText || 'none provided'}${citationInstructions}${linkingInstructions}

${outline.includes_template ? `IMPORTANT: Include the actual template described above. The template should be:
- Complete and ready-to-use (not just placeholders)
- Include example content showing how sections should be filled out
- Have detailed instructions within each section
- Be structured so users can copy and immediately adapt it
- Show both the structure AND examples of completed sections` : ''}

CRITICAL REQUIREMENTS:
- Aim for 1200-1600 words and do not wrap up early; expand sections until the draft exceeds 1,100 words
- **Paragraph Length**: Keep paragraphs short and scannable (2-3 sentences max, ~50-100 words). This is especially critical for the introduction and conclusion sections - break up long blocks of text into shorter, punchy paragraphs that are easy to scan and digest
- Ensure the article includes multiple modern brand examples (beyond Nike/Apple/Coca-Cola), supporting statistics or quotes with citations, and step-by-step guidance; weave these into the sections where they add the most value so readers can act immediately
- Include the reusable framework/matrix/workshop flow identified in the outline - make it actionable and copyable
- Cover all required themes: definition/overview, why it matters, detailed framework, workshop or step-by-step implementation, at least three modern brand examples, measurement & governance, common mistakes/pitfalls, quick FAQs, and a conclusion with next steps. If any are missing from the outline, add them before writing.
- Include a dedicated FAQ section with at least 4 question-and-answer pairs drawn from common reader concerns.
- Add a mini case-study section that profiles at least three modern brands, highlighting what they do, results achieved, and the specific voice traits they lean on.
- Aim for a final content length of at least 3,800 tokens (roughly 1,200+ words). If you are unsure you've crossed that threshold, keep expanding sections with meaningful, non-fluffy detail until you clearly have.

Write the full article following the outline. ${getFormatGuidance(outline.format)}

Return as JSON with: title, content (in markdown format, start with "# {title}"), excerpt (140-160 characters), keywords array (5-8 relevant SEO keywords).`
}

