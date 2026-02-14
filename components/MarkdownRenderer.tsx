// Design system: see DESIGN_SYSTEM.md for typography/spacing decisions

import React from "react"
import ReactMarkdown from "react-markdown"
import { playfairDisplay } from "@/lib/fonts"
import {
  PREVIEW_H1_CLASS,
  PREVIEW_H1_STYLE,
  PREVIEW_H2_CLASS,
  PREVIEW_H2_STYLE,
  PREVIEW_H2_BAR_CLASS,
  PREVIEW_H2_MARGIN_TOP,
  PREVIEW_H2_MARGIN_BOTTOM,
  PREVIEW_H3_CLASS,
  PREVIEW_H3_STYLE,
  PREVIEW_H3_MARGIN_TOP,
  PREVIEW_H3_MARGIN_BOTTOM,
  PREVIEW_H4_CLASS,
  PREVIEW_EYEBROW_CLASS,
  PREVIEW_BODY_CLASS,
  PREVIEW_BODY_STYLE,
  PREVIEW_LIST_CLASS,
  PREVIEW_LIST_ITEM_CLASS,
  PREVIEW_LIST_MARGIN_BOTTOM,
  PREVIEW_BLOCKQUOTE_CLASS,
  PREVIEW_HR_CLASS,
  PREVIEW_HR_MARGIN,
  PREVIEW_SECTION_DESCRIPTION_CLASS,
  PREVIEW_P_MARGIN_BOTTOM,
  getSectionDescription,
  getSectionEyebrow,
} from "@/lib/guide-styles"
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  selectedTraits?: string[]
  /** Section id (e.g. examples, word-list) for section-specific rendering */
  sectionId?: string
}

/** Extract plain text from React children for pattern matching */
function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(getTextFromChildren).join("")
  if (children && typeof children === "object" && "props" in children) {
    return getTextFromChildren((children as React.ReactElement).props.children)
  }
  return String(children ?? "")
}

export function MarkdownRenderer({ content, className, selectedTraits = [], sectionId }: MarkdownRendererProps) {
  // Fix orphaned punctuation patterns
  const fixedContent = content
    .replace(/\s*\n\s*\)/g, ')') // Fix orphaned closing parentheses on new lines
    .replace(/\(\s*\n\s*/g, '(') // Fix orphaned opening parentheses
    .replace(/\.\s*\n\s*"\s*/g, '." ') // Fix orphaned quotes after periods
    .replace(/"\s*\n\s*\(/g, '" (') // Fix quotes before parentheses

  return (
    <div className={cn(playfairDisplay.variable, "max-w-3xl space-y-6 style-guide-document", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
        // Custom heading styles - using preview tokens for premium look
        h1: ({ children }) => (
          <h1 className={cn(PREVIEW_H1_CLASS, "mb-6 border-b border-gray-200 pb-4")} style={PREVIEW_H1_STYLE}>
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          const childrenText = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children))
          const sectionDescription = getSectionDescription(childrenText)
          const eyebrowLabel = getSectionEyebrow(childrenText)
          return (
            <>
              {eyebrowLabel && (
                <p className={cn(PREVIEW_EYEBROW_CLASS, "mb-2")}>
                  {eyebrowLabel}
                </p>
              )}
              <h2 className={cn(PREVIEW_H2_CLASS, PREVIEW_H2_MARGIN_TOP, PREVIEW_H2_MARGIN_BOTTOM, "first:mt-0")} style={PREVIEW_H2_STYLE}>
                {children}
              </h2>
              <div className={cn(PREVIEW_H2_BAR_CLASS, PREVIEW_H2_MARGIN_BOTTOM, "-mt-4")} />
              {sectionDescription && (
                <p className={cn(PREVIEW_SECTION_DESCRIPTION_CLASS, PREVIEW_H2_MARGIN_BOTTOM, "-mt-2")}>
                  {sectionDescription}
                </p>
              )}
            </>
          )
        },
        h3: ({ children }) => {
          const text = getTextFromChildren(children).trim()
          // Before/After section: content-type label as pill
          if (sectionId === "examples") {
            return (
              <span
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700",
                  PREVIEW_H3_MARGIN_TOP,
                  PREVIEW_H3_MARGIN_BOTTOM
                )}
              >
                {children}
              </span>
            )
          }
          // Word List: subtle category header
          if (sectionId === "word-list" || /^(Preferred Terms|Avoid Terms|Spelling and Usage)$/i.test(text)) {
            return (
              <h3 className={cn("text-sm font-medium uppercase tracking-wide text-gray-500 mt-6 mb-3 first:mt-0")}>
                {children}
              </h3>
            )
          }
          return (
            <h3 className={cn(PREVIEW_H3_CLASS, PREVIEW_H3_MARGIN_TOP, PREVIEW_H3_MARGIN_BOTTOM)} style={PREVIEW_H3_STYLE}>
              {children}
            </h3>
          )
        },
        h4: ({ children }) => (
          <h4 className={cn(PREVIEW_H4_CLASS, "mb-2 mt-4")}>
            {children}
          </h4>
        ),
        
        // Custom paragraph styles — generous line height for readability
        // Before/After: grey for Before, green accent for After
        p: ({ children }) => {
          const text = getTextFromChildren(children).trim()
          if (text.startsWith("Before:")) {
            return (
              <p className={cn(PREVIEW_BODY_CLASS, PREVIEW_P_MARGIN_BOTTOM, "border-l-2 border-gray-300 pl-4 text-gray-600")} style={PREVIEW_BODY_STYLE}>
                {children}
              </p>
            )
          }
          if (text.startsWith("After:")) {
            return (
              <p className={cn(PREVIEW_BODY_CLASS, PREVIEW_P_MARGIN_BOTTOM, "border-l-2 border-green-500 pl-4 text-gray-800")} style={PREVIEW_BODY_STYLE}>
                {children}
              </p>
            )
          }
          return (
            <p className={cn(PREVIEW_BODY_CLASS, PREVIEW_P_MARGIN_BOTTOM)} style={PREVIEW_BODY_STYLE}>
              {children}
            </p>
          )
        },
        
        // Custom list styles — open, airy  
        ul: ({ children }) => (
          <ul className={cn("list-disc list-outside ml-5", PREVIEW_LIST_CLASS, PREVIEW_LIST_MARGIN_BOTTOM, "space-y-2")}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className={cn("list-decimal list-outside ml-5", PREVIEW_LIST_CLASS, PREVIEW_LIST_MARGIN_BOTTOM, "space-y-2")}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className={cn(PREVIEW_LIST_ITEM_CLASS, "mb-1")}>{children}</li>
        ),
        
        // Custom code styles
        code: ({ children, ...props }) => {
          const isInline = !('data-language' in props)
          return isInline ? (
            <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-100 text-gray-800 p-3 rounded text-sm font-mono whitespace-pre-wrap mb-4">
              {children}
            </code>
          )
        },
        
        // Simpler blockquote styling (no paywall look)
        blockquote: ({ children }) => (
          <blockquote className={cn(PREVIEW_BLOCKQUOTE_CLASS, "my-4")}>
            {children}
          </blockquote>
        ),
        
        // Custom strong/bold styles
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        
        // Custom emphasis/italic styles
        em: ({ children }) => (
          <em className="italic text-gray-700">{children}</em>
        ),
        
        // Custom horizontal rule - elegant section divider
        hr: () => (
          <hr className={cn(PREVIEW_HR_CLASS, PREVIEW_HR_MARGIN, "border-t")} />
        ),
        
        // Custom table styles (from remark-gfm) - open, airy layout
        // Single-col (Avoid) and two-col (Preferred Terms, Spelling) tables share same row styling
        table: ({ children }) => (
          <div className="overflow-x-auto" style={{ margin: '0' }}>
            <table className="min-w-full border-separate" style={{ borderSpacing: '0 1rem', tableLayout: 'auto', width: '100%', margin: '0' }}>
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-transparent px-6 py-3 text-left font-semibold text-gray-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="bg-white px-6 py-6 align-top shadow-sm" style={{ border: 'none' }}>
            {children}
          </td>
        ),
        }}
      >
        {fixedContent}
      </ReactMarkdown>
    </div>
  )
} 