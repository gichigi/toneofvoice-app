'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement, useElement } from 'platejs/react';
import { getSectionIdFromHeading } from '@/lib/content-parser';

/** Recursively extract plain text from Slate element children */
function getTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) return n.children.map(getTextFromNode).join('')
  return ''
}

const headingVariants = cva('relative', {
  variants: {
    variant: {
      // H1 = Title / Cover styling — large serif, prominent
      h1: 'mt-8 mb-4 pb-4 font-bold text-5xl md:text-6xl tracking-tight leading-[0.95] text-gray-900 border-b border-gray-200',
      // H2 = Section headers — styled like cover subheadings
      h2: 'mt-16 mb-6 pb-2 font-bold text-3xl md:text-4xl tracking-tight leading-[1.1] text-gray-900',
      // H3 = Subsection headers
      h3: 'mt-10 mb-4 font-bold text-xl md:text-2xl tracking-tight text-gray-900',
      h4: 'mt-6 mb-2 font-semibold text-lg tracking-tight text-gray-800',
      h5: 'mt-4 mb-2 font-semibold text-base tracking-tight text-gray-800',
      h6: 'mt-4 mb-2 font-medium text-base tracking-tight text-gray-700',
    },
  },
});

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h1"
      className={headingVariants({ variant: 'h1' })}
      style={{ fontFamily: 'var(--font-display), serif' }}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

/** H2 with section id for sidebar jump and IntersectionObserver */
export function H2SectionElement(props: PlateElementProps) {
  const element = useElement()
  const text = getTextFromNode(element)
  const sectionId = text ? getSectionIdFromHeading(text) : undefined
  return (
    <>
      {/* Wrapper div provides id for sidebar jump / IntersectionObserver */}
      <div id={sectionId} data-section-id={sectionId}>
        <PlateElement
          as="h2"
          className={headingVariants({ variant: 'h2' })}
          style={{ fontFamily: 'var(--font-display), serif', letterSpacing: '-0.02em' }}
          {...props}
        >
          {props.children}
        </PlateElement>
      </div>
      {/* Decorative bar under section headings — matches cover aesthetic */}
      <div className="h-1 w-16 bg-gray-900 rounded-full mb-6 -mt-4" />
    </>
  )
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
