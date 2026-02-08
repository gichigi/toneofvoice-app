import { describe, it, expect } from "vitest"
import {
  parseStyleGuideContent,
  getDefaultOpenSections,
  getSectionContentFromMarkdown,
  replaceSectionInMarkdown,
  mergeEditableIntoFullMarkdown,
  buildEditableMarkdown,
  STYLE_GUIDE_SECTIONS,
  type StyleGuideSection,
} from "./content-parser"

describe("parseStyleGuideContent", () => {
  it("returns empty array for empty markdown", () => {
    expect(parseStyleGuideContent("")).toEqual([])
  })

  it("returns single section for whitespace-only when no headings", () => {
    const result = parseStyleGuideContent("   ")
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe("")
  })

  it("returns single section when no headings found", () => {
    const result = parseStyleGuideContent("Just some body text.")
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: "content",
      title: "Style Guide",
      content: "Just some body text.",
      level: 2,
      isMainSection: true,
      minTier: "free",
    })
  })

  it("splits on ## headings and keeps markdown content", () => {
    const md = `## About Brand

This is about the brand.

## Brand Voice

Voice traits here.`
    const result = parseStyleGuideContent(md)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: "about",
      title: "About Brand",
      content: "This is about the brand.",
      level: 2,
      minTier: "free",
    })
    expect(result[1]).toMatchObject({
      id: "brand-voice",
      title: "Brand Voice",
      content: "Voice traits here.",
      level: 2,
      minTier: "free",
    })
  })

  it("matches known section configs by heading", () => {
    const md = `## How to Use

Instructions.

## General Guidelines

Rules here.

## 25 Core Rules

More rules.`
    const result = parseStyleGuideContent(md)
    expect(result[0].id).toBe("how-to-use")
    expect(result[1].id).toBe("general-guidelines")
    expect(result[2].id).toBe("style-rules")
    expect(result[2].minTier).toBe("pro")
  })

  it("generates id for unknown headings", () => {
    const md = `## Custom Section

Content.`
    const result = parseStyleGuideContent(md)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("custom-section")
    expect(result[0].title).toBe("Custom Section")
  })

  it("never returns empty section id (fallback to section-N)", () => {
    // Heading that would slug to empty (special chars only)
    const md = `## ---

Content.`
    const result = parseStyleGuideContent(md)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBeTruthy()
    expect(result[0].id).toBe("section-0")
  })

  it("handles single # (H1) headings", () => {
    const md = `# Main Title

Intro.

## About Brand

About content.`
    const result = parseStyleGuideContent(md)
    expect(result).toHaveLength(2)
    expect(result[0].level).toBe(1)
    expect(result[1].level).toBe(2)
  })
})

describe("getDefaultOpenSections", () => {
  it("returns first section id when sections exist", () => {
    const sections: StyleGuideSection[] = [
      { id: "cover", title: "Cover", content: "", level: 1, isMainSection: true },
    ]
    expect(getDefaultOpenSections(sections)).toContain("cover")
  })

  it("includes brand voice section when present", () => {
    const sections: StyleGuideSection[] = [
      { id: "cover", title: "Cover", content: "", level: 1, isMainSection: true },
      { id: "brand-voice", title: "Brand Voice", content: "", level: 2, isMainSection: true },
    ]
    const result = getDefaultOpenSections(sections)
    expect(result).toContain("cover")
    expect(result).toContain("brand-voice")
  })

  it("returns empty array when no sections", () => {
    expect(getDefaultOpenSections([])).toEqual([])
  })
})

describe("getSectionContentFromMarkdown", () => {
  const md = `## About Brand

This is about the brand.

## Brand Voice

Voice traits here.

## 25 Style Rules

Locked rules content.`

  it("returns section content (heading + body) by id", () => {
    expect(getSectionContentFromMarkdown(md, "about")).toContain("## About Brand")
    expect(getSectionContentFromMarkdown(md, "about")).toContain("This is about the brand.")
    expect(getSectionContentFromMarkdown(md, "brand-voice")).toContain("## Brand Voice")
    expect(getSectionContentFromMarkdown(md, "brand-voice")).toContain("Voice traits here.")
    expect(getSectionContentFromMarkdown(md, "style-rules")).toContain("25 Style Rules")
  })

  it("returns empty string for unknown section id", () => {
    expect(getSectionContentFromMarkdown(md, "unknown")).toBe("")
  })

  it("returns empty string for empty markdown", () => {
    expect(getSectionContentFromMarkdown("", "about")).toBe("")
  })
})

describe("replaceSectionInMarkdown", () => {
  const md = `## About Brand

This is about the brand.

## Brand Voice

Voice traits here.`

  it("replaces section content by id", () => {
    const newContent = `## About Brand

Updated about content.`
    const result = replaceSectionInMarkdown(md, "about", newContent)
    expect(result).toContain("Updated about content.")
    expect(result).not.toContain("This is about the brand.")
    expect(result).toContain("Voice traits here.")
  })

  it("returns original markdown when section not found", () => {
    const result = replaceSectionInMarkdown(md, "unknown", "new")
    expect(result).toBe(md)
  })

  it("preserves structure when replacing middle section", () => {
    const newVoice = `## Brand Voice

New voice traits.`
    const result = replaceSectionInMarkdown(md, "brand-voice", newVoice)
    const parsed = parseStyleGuideContent(result)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe("about")
    expect(parsed[1].id).toBe("brand-voice")
    expect(parsed[1].content).toContain("New voice traits.")
  })
})

describe("buildEditableMarkdown", () => {
  const isUnlocked = (minTier?: string) => !minTier || minTier === "free"

  it("builds markdown from unlocked sections only", () => {
    const sections: StyleGuideSection[] = [
      { id: "about", title: "About Brand", content: "A", level: 2, isMainSection: true, minTier: "free" },
      { id: "style-rules", title: "Style Rules", content: "B", level: 2, isMainSection: true, minTier: "pro" },
    ]
    const result = buildEditableMarkdown(sections, isUnlocked as any)
    expect(result).toContain("## About Brand")
    expect(result).toContain("A")
    expect(result).not.toContain("Style Rules")
  })
})

describe("mergeEditableIntoFullMarkdown", () => {
  const full = `## About Brand

Old about.

## Style Rules

Locked.`
  const editable = `## About Brand

New about.`

  it("merges editable content into full markdown", () => {
    const result = mergeEditableIntoFullMarkdown(full, editable, ["about"])
    expect(result).toContain("New about.")
    expect(result).toContain("Locked.")
  })
})

describe("STYLE_GUIDE_SECTIONS", () => {
  it("has expected section ids", () => {
    const ids = STYLE_GUIDE_SECTIONS.map((s) => s.id)
    expect(ids).toContain("cover")
    expect(ids).toContain("about")
    expect(ids).toContain("how-to-use")
    expect(ids).toContain("general-guidelines")
    expect(ids).toContain("brand-voice")
    expect(ids).toContain("style-rules")
    expect(ids).toContain("examples")
  })

  it("has tier hierarchy for gating", () => {
    const freeSections = STYLE_GUIDE_SECTIONS.filter((s) => s.minTier === "free")
    const proSections = STYLE_GUIDE_SECTIONS.filter((s) => s.minTier === "pro")
    expect(freeSections.length).toBeGreaterThan(0)
    expect(proSections.length).toBeGreaterThan(0)
  })
})
