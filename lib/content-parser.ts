import { 
  LayoutTemplate, 
  Info, 
  HelpCircle, 
  FileText, 
  Megaphone, 
  ScrollText, 
  ArrowLeftRight,
  type LucideIcon
} from "lucide-react"

export type Tier = 'free' | 'pro' | 'team'

export interface SectionConfig {
  id: string
  label: string
  icon: LucideIcon
  minTier: Tier
  matchHeading: RegExp
}

export const STYLE_GUIDE_SECTIONS: SectionConfig[] = [
  {
    id: 'cover',
    label: 'Cover Page',
    icon: LayoutTemplate,
    minTier: 'free',
    matchHeading: /^Cover/i // Special case, usually won't match content
  },
  {
    id: 'about',
    label: 'About Brand',
    icon: Info,
    minTier: 'free',
    matchHeading: /^About/i
  },
  {
    id: 'how-to-use',
    label: 'How to Use',
    icon: HelpCircle,
    minTier: 'free',
    matchHeading: /^How to Use/i
  },
  {
    id: 'general-guidelines',
    label: 'General Guidelines',
    icon: FileText,
    minTier: 'free',
    matchHeading: /^General Guidelines/i
  },
  {
    id: 'brand-voice',
    label: 'Brand Voice',
    icon: Megaphone,
    minTier: 'free',
    matchHeading: /^Brand Voice/i
  },
  {
    id: 'style-rules',
    label: 'Style Rules',
    icon: ScrollText,
    minTier: 'pro',
    matchHeading: /^(?:25 )?(?:Core|Style) Rules/i
  },
  {
    id: 'examples',
    label: 'Before / After',
    icon: ArrowLeftRight,
    minTier: 'pro',
    matchHeading: /^Before.*After/i
  }
]

export interface StyleGuideSection {
  id: string
  title: string
  content: string
  level: number
  isMainSection: boolean
  // New fields for sidebar
  configId?: string
  icon?: LucideIcon
  minTier?: Tier
}

/**
 * Parse markdown content into sections for sidebar display.
 * Splits on ## (H2) headings, keeping content as raw markdown
 * so it can be fed directly into the editor.
 */
export function parseStyleGuideContent(markdown: string): StyleGuideSection[] {
  if (!markdown) return []

  const sections: StyleGuideSection[] = []

  // Split on ## headings (H2). Capture the heading text.
  // Regex: match lines starting with # or ## (not ###) 
  const headingRegex = /^(#{1,2})\s+(.+)$/gm
  const matches: { level: number; title: string; index: number }[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    matches.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index
    })
  }

  if (matches.length === 0) {
    // No headings found -- return all content as one section
    return [{
      id: 'content',
      title: 'Style Guide',
      content: markdown.trim(),
      level: 2,
      isMainSection: true,
      minTier: 'free'
    }]
  }

  matches.forEach((heading, i) => {
    // Content runs from end of this heading line to start of next heading (or end of string)
    const headingLineEnd = markdown.indexOf('\n', heading.index)
    const contentStart = headingLineEnd === -1 ? markdown.length : headingLineEnd + 1
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : markdown.length
    const content = markdown.slice(contentStart, contentEnd).trim()

    // Match to a known section config; ensure id is never empty (breaks getElementById / keys)
    const config = STYLE_GUIDE_SECTIONS.find(c => c.matchHeading.test(heading.title))
    let id = config ? config.id : generateSectionId(heading.title)
    if (!id) id = `section-${i}`

    sections.push({
      id,
      title: heading.title,
      content,
      level: heading.level,
      isMainSection: heading.level <= 2,
      configId: config?.id,
      icon: config?.icon,
      minTier: config?.minTier || 'free'
    })
  })

  return sections
}

/**
 * Get section id from heading text (for H2 section IDs in editor).
 * Matches STYLE_GUIDE_SECTIONS or falls back to slug.
 */
export function getSectionIdFromHeading(title: string): string {
  const config = STYLE_GUIDE_SECTIONS.find((c) => c.matchHeading.test(title))
  if (config) return config.id
  const slug = generateSectionId(title)
  return slug || "section"
}

/**
 * Generate a URL-safe ID from section title
 */
function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Get section content (heading + body) from full markdown by section id.
 * Uses parseStyleGuideContent to find section boundaries.
 * Returns empty string if section not found.
 */
export function getSectionContentFromMarkdown(markdown: string, sectionId: string): string {
  if (!markdown || !sectionId) return ""
  const sections = parseStyleGuideContent(markdown)
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return ""
  return `## ${section.title}\n\n${section.content}`.trim()
}

/**
 * Replace a section's content in full markdown.
 * Finds section by id, replaces from ## Heading to next ## or end with newContent.
 * newContent should be the full section markdown (heading + body).
 * Returns original markdown if section not found.
 */
export function replaceSectionInMarkdown(
  markdown: string,
  sectionId: string,
  newContent: string
): string {
  if (!markdown || !sectionId) return markdown
  const sections = parseStyleGuideContent(markdown)
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return markdown

  const headingRegex = /^(#{1,2})\s+(.+)$/gm
  const matches: { level: number; title: string; index: number }[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(markdown)) !== null) {
    matches.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index,
    })
  }

  const sectionIndex = sections.findIndex((s) => s.id === sectionId)
  if (sectionIndex === -1) return markdown

  // No headings: single "content" section
  if (matches.length === 0) {
    return sectionIndex === 0 ? newContent.trim() : markdown
  }

  const start = matches[sectionIndex].index
  const end =
    sectionIndex + 1 < matches.length ? matches[sectionIndex + 1].index : markdown.length
  const before = markdown.slice(0, start)
  const after = markdown.slice(end)
  return before + newContent.trim() + (after ? "\n\n" + after : "")
}

/**
 * Merge editable markdown (from single editor) back into full markdown.
 * Replaces content of unlocked sections with corresponding sections from editableMarkdown.
 */
export function mergeEditableIntoFullMarkdown(
  fullMarkdown: string,
  editableMarkdown: string,
  unlockedSectionIds: string[]
): string {
  if (!fullMarkdown || !editableMarkdown) return fullMarkdown
  const editableSections = parseStyleGuideContent(editableMarkdown)
  let result = fullMarkdown
  for (let i = 0; i < unlockedSectionIds.length && i < editableSections.length; i++) {
    const sec = editableSections[i]
    const newContent = `## ${sec.title}\n\n${sec.content}`.trim()
    result = replaceSectionInMarkdown(result, unlockedSectionIds[i], newContent)
  }
  return result
}

/**
 * Build editable markdown from sections (free tiers only, no cover).
 */
export function buildEditableMarkdown(sections: StyleGuideSection[], isUnlocked: (minTier?: Tier) => boolean): string {
  const editable = sections.filter((s) => s.id !== "cover" && isUnlocked(s.minTier))
  return editable.map((s) => `## ${s.title}\n\n${s.content}`.trim()).join("\n\n")
}

/**
 * Get default open sections based on content type
 */
export function getDefaultOpenSections(sections: StyleGuideSection[]): string[] {
  const defaults: string[] = []
  
  // Always open the first section
  if (sections.length > 0) {
    defaults.push(sections[0].id)
  }
  
  // Open "Brand Voice" section if it exists
  const brandVoiceSection = sections.find(section => 
    section.title.toLowerCase().includes('brand voice') ||
    section.title.toLowerCase().includes('voice')
  )
  if (brandVoiceSection) {
    defaults.push(brandVoiceSection.id)
  }
  
  return defaults
}
