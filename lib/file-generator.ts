// File generation utilities for style guide exports
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx"

export type FileFormat = "pdf" | "md" | "docx"

export interface FileGenerationOptions {
  websiteUrl?: string
  subscriptionTier?: "starter" | "pro" | "agency"
  generationDate?: string
}

/**
 * Generate a file in the specified format with the given content
 */
export async function generateFile(
  format: FileFormat,
  content: string,
  brandName: string,
  options: FileGenerationOptions = {}
): Promise<Blob> {
  try {
  switch (format) {
    case "md":
      return generateMarkdown(content, brandName, options)
    case "docx":
      return generateDOCX(content, brandName, options)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
  } catch (error) {
    console.error('[File Generator] File generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      format,
      brandName,
      contentLength: content.length
    })
    const formatName = format.toUpperCase()
    throw new Error(`Failed to generate ${formatName} file. Please try again or contact support.`)
  }
}

/**
 * Generate a properly formatted Markdown document with cover section
 */
function generateMarkdown(content: string, brandName: string, options: FileGenerationOptions): Promise<Blob> {
  try {
    const { websiteUrl, subscriptionTier = 'starter', generationDate } = options
    const formattedDate = generationDate || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Build cover section in markdown format
    let cover = `# ${brandName}\n\n`
    cover += `*Brand Voice & Content Guidelines*\n\n`
    cover += `---\n\n`
    cover += `**Generated on** ${formattedDate}\n\n`

    if (websiteUrl) {
      const displayUrl = websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
      cover += `**Website** ${displayUrl}\n\n`
    }

    // Add branding footer based on tier
    if (subscriptionTier === 'starter' || subscriptionTier === 'pro') {
      cover += `**Generated with** [Tone of Voice App](https://toneofvoice.app)\n\n`
    }

    cover += `---\n\n`

    const fullContent = cover + content
    return Promise.resolve(new Blob([fullContent], { type: "text/markdown" }))
  } catch (error) {
    console.error('[File Generator] Markdown generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contentLength: content.length
    })
    throw new Error('Failed to generate Markdown file. Please try again or contact support.')
  }
}

/**
 * Generate a properly formatted DOCX document using the docx library
 */
async function generateDOCX(content: string, brandName: string, options: FileGenerationOptions): Promise<Blob> {
  try {
    const paragraphs = parseMarkdownToDocxParagraphs(content, brandName, options)

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    return new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    })
  } catch (error) {
    console.error('[File Generator] DOCX generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      brandName,
      contentLength: content.length
    })
    throw new Error('Failed to generate DOCX file. Please try again or contact support.')
  }
}



/**
 * Parse markdown content into DOCX paragraphs
 */
function parseMarkdownToDocxParagraphs(content: string, brandName: string, options: FileGenerationOptions): Paragraph[] {
  const paragraphs: Paragraph[] = []

  const { websiteUrl, subscriptionTier = 'starter', generationDate } = options
  const formattedDate = generationDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Add eyebrow
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({
        text: 'BRAND VOICE & CONTENT GUIDELINES',
        size: 18,
        color: '666666',
        allCaps: true
      })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 }
    })
  )

  // Add title
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: brandName, bold: true, size: 56 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 }
    })
  )

  // Add separator line
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '', size: 20 })],
      spacing: { after: 240 },
      border: {
        bottom: {
          color: '000000',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12
        }
      }
    })
  )

  // Add generation date
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: `Generated on ${formattedDate}`, size: 20 })],
      spacing: { after: 120 }
    })
  )

  // Add website URL if available
  if (websiteUrl) {
    const displayUrl = websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: displayUrl, size: 20, bold: true })],
        spacing: { after: 240 }
      })
    )
  }

  // Add branding based on tier
  if (subscriptionTier === 'starter' || subscriptionTier === 'pro') {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({
          text: 'Generated with Tone of Voice App (toneofvoice.app)',
          size: 18,
          color: '999999',
          italics: true
        })],
        spacing: { before: websiteUrl ? 120 : 240, after: 600 }
      })
    )
  } else {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: '' })],
        spacing: { after: 600 }
      })
    )
  }
  
  const lines = content.split('\n')
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (!line) {
      i++
      continue
    }
    
    // Handle headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1
      const text = line.replace(/^#+\s*/, '')
      
      let headingLevel: typeof HeadingLevel[keyof typeof HeadingLevel]
      let fontSize = 24
      
      switch (level) {
        case 1: headingLevel = HeadingLevel.HEADING_1; fontSize = 24; break
        case 2: headingLevel = HeadingLevel.HEADING_2; fontSize = 20; break
        case 3: headingLevel = HeadingLevel.HEADING_3; fontSize = 16; break
        case 4: headingLevel = HeadingLevel.HEADING_4; fontSize = 14; break
        default: headingLevel = HeadingLevel.HEADING_5; fontSize = 12; break
      }
      
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: fontSize * 2 })],
          heading: headingLevel,
          spacing: { before: 240, after: 120 }
        })
      )
    }
    // Handle horizontal rules
    else if (line === '---') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 20 })],
          spacing: { before: 200, after: 200 },
          border: {
            bottom: {
              color: "auto",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        })
      )
    }
    // Handle bullet points
    else if (line.match(/^[-*+]\s+/)) {
      const text = line.replace(/^[-*+]\s+/, '')
      const textRuns = parseFormattedText(text)
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          bullet: { level: 0 },
          spacing: { after: 60 }
        })
      )
    }
    // Handle numbered lists
    else if (line.match(/^\d+\.\s+/)) {
      const text = line.replace(/^\d+\.\s+/, '')
      const textRuns = parseFormattedText(text)
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          numbering: { reference: "default-numbering", level: 0 },
          spacing: { after: 60 }
        })
      )
    }
    // Handle regular paragraphs with formatting
    else {
      const textRuns = parseFormattedText(line)
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: 120 }
        })
      )
    }
    
    i++
  }
  
  return paragraphs
}

/**
 * Parse formatted text (bold, italic, etc.) into TextRuns
 */
function parseFormattedText(text: string): TextRun[] {
  const runs: TextRun[] = []
  let currentText = text
  
  // Enhanced Unicode/emoji handling - preserve most emojis, convert problematic ones
  currentText = currentText
    // Keep common emojis that work well in Word
    .replace(/💪/g, '💪') // Keep muscle emoji
    .replace(/🏃/g, '🏃') // Keep runner emoji
    .replace(/⚡/g, '⚡') // Keep lightning
    .replace(/🎯/g, '🎯') // Keep target
    // Convert checkmarks and X marks to Word-compatible symbols
    .replace(/✅/g, '✓')
    .replace(/❌/g, '✗')
    // Convert arrows to Word-compatible symbols
    .replace(/→/g, '→')
    .replace(/←/g, '←')
    .replace(/↑/g, '↑')
    .replace(/↓/g, '↓')
  
  // Enhanced parsing for bold, italic, and inline code
  const parts = currentText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }))
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      // Italic text (but not bold)
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true }))
    } else if (part.startsWith('`') && part.endsWith('`')) {
      // Inline code
      runs.push(new TextRun({ 
        text: part.slice(1, -1), 
        font: { name: "Consolas" },
        shading: { fill: "F5F5F5" }
      }))
    } else if (part) {
      // Regular text
      runs.push(new TextRun({ text: part }))
    }
  }
  
  return runs.length > 0 ? runs : [new TextRun({ text })]
}

/**
 * Download a generated file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate a file in the specified format with proper MIME type
 */
export async function generateFileWithMimeType(
  format: FileFormat,
  content: string,
): Promise<{ blob: Blob; mimeType: string }> {
  console.log(`Generating ${format} file with content length: ${content.length}`)

  let mimeType = "text/plain"

  // Set the correct mime type based on format
  switch (format) {
    case "pdf":
      mimeType = "application/pdf"
      break
    case "md":
      mimeType = "text/markdown"
      break
    case "docx":
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      break
  }

  // Create a blob with the appropriate content and MIME type
  const blob = new Blob([content], { type: mimeType })

  return { blob, mimeType }
}
