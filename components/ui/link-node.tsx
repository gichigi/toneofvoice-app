// Design system: see DESIGN_SYSTEM.md — link styling for editor
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function LinkElement({ children, ...props }: PlateElementProps) {
  // Read URL from the slate element
  const element = useElement<{ url?: string }>();

  return (
    <PlateElement asChild {...props}>
      <a
        href={element.url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'font-medium text-primary underline decoration-primary underline-offset-4 cursor-pointer'
        )}
      >
        {children}
      </a>
    </PlateElement>
  );
}
