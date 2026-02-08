// Design system: see DESIGN_SYSTEM.md for typography/spacing decisions

import ReactMarkdown from "react-markdown"
import { SECTION_H2_BAR_CLASS, SECTION_H2_CLASS, SECTION_H2_STYLE } from "@/lib/style-guide-styles"
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  selectedTraits?: string[]
}

export function MarkdownRenderer({ content, className, selectedTraits = [] }: MarkdownRendererProps) {
  // Fix orphaned punctuation patterns
  const fixedContent = content
    .replace(/\s*\n\s*\)/g, ')') // Fix orphaned closing parentheses on new lines
    .replace(/\(\s*\n\s*/g, '(') // Fix orphaned opening parentheses
    .replace(/\.\s*\n\s*"\s*/g, '." ') // Fix orphaned quotes after periods
    .replace(/"\s*\n\s*\(/g, '" (') // Fix quotes before parentheses

  return (
    <div className={cn("max-w-3xl space-y-6 style-guide-document", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
        // Custom heading styles
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          const childrenText = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children))
          const isTraitHeading = childrenText.toLowerCase().includes('brand voice')
          return (
            <>
              <h2 className={`${SECTION_H2_CLASS} mb-8 mt-20 first:mt-0`} style={SECTION_H2_STYLE}>
                {children}
              </h2>
              <div className={`${SECTION_H2_BAR_CLASS} mb-8 -mt-4`} />
              {isTraitHeading && selectedTraits.length > 0 && (
                <div className="flex flex-wrap gap-3 md:gap-4 mb-8 mt-2">
                  {selectedTraits.map((trait: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </>
          )
        },
        h3: ({ children }) => (
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 mt-12" style={{ fontFamily: 'var(--font-display), serif', hyphens: 'none', wordBreak: 'keep-all', letterSpacing: '-0.02em' }}>
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-medium text-gray-700 mb-2 mt-4">
            {children}
          </h4>
        ),
        
        // Custom paragraph styles — generous line height for readability
        p: ({ children }) => (
          <p className="text-gray-600 mb-5 leading-relaxed text-base md:text-lg" style={{ orphans: 2, widows: 2 }}>
            {children}
          </p>
        ),
        
        // Custom list styles — open, airy  
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 text-gray-600 mb-6 space-y-2 text-base md:text-lg leading-relaxed">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 text-gray-600 mb-6 space-y-2 text-base md:text-lg leading-relaxed">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="mb-1 leading-relaxed">{children}</li>
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
          <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 my-4">
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
          <hr className="border-gray-200 my-12" />
        ),
        
        // Custom table styles (from remark-gfm) - open, airy layout
        table: ({ children }) => (
          <div className="overflow-x-auto" style={{ margin: '0' }}>
            <table className="min-w-full border-separate" style={{ borderSpacing: '0 1rem', tableLayout: 'fixed', width: '100%', margin: '0' }}>
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '50%' }} />
              </colgroup>
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