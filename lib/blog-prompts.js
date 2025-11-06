/**
 * Shared blog post generation prompts
 * Used by both the bulk generation script and the API endpoint
 */

export const BLOG_SYSTEM_PROMPT = `You are a brand voice and content style guide expert specializing in copywriting and content marketing. The current year is 2025. You believe that:

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


/**
 * Generate outline prompt for blog post (Step 1: Outline generation)
 * @param {string} topic - The blog post topic
 * @param {string[]} keywords - Array of target keywords
 * @returns {string} The outline generation prompt
 */
export function getBlogOutlinePrompt(topic, keywords = []) {
  const keywordsText = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (typeof keywords === 'string' ? keywords : 'none provided')
  
  // Check if topic or keywords mention template
  const hasTemplateKeyword = topic.toLowerCase().includes('template') || 
                             (Array.isArray(keywords) && keywords.some(k => k.toLowerCase().includes('template')))
  
  return `Generate a detailed outline for a blog post about: ${topic}

Target Keywords: ${keywordsText || 'none provided'}

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
2. Proposed article format (e.g. Guide, List, Comparison, Question-based, Case Study, Explainer, Template, anatomy of x)
3. Main sections with H2 headings (if including a Template, add a section for the actual template)
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
 * @returns {string} The article generation prompt
 */
export function getBlogArticlePromptFromOutline(outline, topic, keywords = []) {
  const keywordsText = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : (typeof keywords === 'string' ? keywords : 'none provided')
  
  return `Write a comprehensive blog post based on this outline:

Title: ${outline.title}
Format: ${outline.format}
${outline.includes_template ? `Template Description: ${outline.template_description}` : ''}

Sections:
${outline.sections.map((s, i) => `${i + 1}. ${s.heading}\n   ${s.key_points.join('\n   ')}`).join('\n\n')}

Target Keywords: ${keywordsText || 'none provided'}

${outline.includes_template ? `IMPORTANT: Include the actual template described above. The template should be:
- Complete and ready-to-use (not just placeholders)
- Include example content showing how sections should be filled out
- Have detailed instructions within each section
- Be structured so users can copy and immediately adapt it
- Show both the structure AND examples of completed sections` : ''}

Write the full article following the outline. ${getFormatGuidance(outline.format)}

Write comprehensively and thoroughly - explore each section in depth, provide detailed explanations, examples, and actionable insights. Naturally incorporate the target keywords throughout the content. Use H2 headings for each section from the outline.

Return as JSON with: title, content (in markdown format, start with "# {title}"), excerpt (140-160 characters), keywords array (5-8 relevant SEO keywords).`
}

