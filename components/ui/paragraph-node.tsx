'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ParagraphElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className={cn('mx-0 mt-0 mb-5 px-0 py-0 leading-relaxed')}>
      {props.children}
    </PlateElement>
  );
}
