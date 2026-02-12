'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement, useElement } from 'platejs/react';
import { getSectionIdFromHeading } from '@/lib/content-parser';
import {
  EDITOR_H1_CLASS,
  EDITOR_H1_STYLE,
  EDITOR_H1_MARGIN_TOP,
  EDITOR_H1_MARGIN_BOTTOM,
  EDITOR_H2_CLASS,
  EDITOR_H2_STYLE,
  EDITOR_H2_MARGIN_TOP,
  EDITOR_H2_MARGIN_BOTTOM,
  EDITOR_H2_BAR_CLASS,
  EDITOR_H3_CLASS,
  EDITOR_H3_STYLE,
  EDITOR_H3_MARGIN_TOP,
  EDITOR_H3_MARGIN_BOTTOM,
  EDITOR_H4_CLASS,
  EDITOR_H4_MARGIN_TOP,
  EDITOR_H4_MARGIN_BOTTOM,
} from '@/lib/guide-styles';
import { cn } from '@/lib/utils';

/** Recursively extract plain text from Slate element children */
function getTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) return n.children.map(getTextFromNode).join('')
  return ''
}

// Legacy cva for H4-H6 (not yet migrated to tokens, but keeping for now)
const headingVariants = cva('relative', {
  variants: {
    variant: {
      h4: cn(EDITOR_H4_CLASS, EDITOR_H4_MARGIN_TOP, EDITOR_H4_MARGIN_BOTTOM),
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
      className={cn(EDITOR_H1_CLASS, EDITOR_H1_MARGIN_TOP, EDITOR_H1_MARGIN_BOTTOM, "pb-4")}
      style={EDITOR_H1_STYLE}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H2Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h2"
      className={cn(EDITOR_H2_CLASS, EDITOR_H2_MARGIN_TOP, EDITOR_H2_MARGIN_BOTTOM, "pb-2")}
      style={EDITOR_H2_STYLE}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
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
          className={cn(EDITOR_H2_CLASS, EDITOR_H2_MARGIN_TOP, EDITOR_H2_MARGIN_BOTTOM, "pb-2")}
          style={EDITOR_H2_STYLE}
          {...props}
        >
          {props.children}
        </PlateElement>
      </div>
      {/* Decorative bar under section headings — matches cover aesthetic */}
      <div className={cn(EDITOR_H2_BAR_CLASS, EDITOR_H2_MARGIN_BOTTOM, "-mt-4")} />
    </>
  )
}

export function H3Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h3"
      className={cn(EDITOR_H3_CLASS, EDITOR_H3_MARGIN_TOP, EDITOR_H3_MARGIN_BOTTOM)}
      style={EDITOR_H3_STYLE}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
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
