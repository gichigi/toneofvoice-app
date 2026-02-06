// Design system: see DESIGN_SYSTEM.md — list styling for editor
'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function BulletedListElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="ul"
      className={cn('my-1 ml-6 list-disc [&_ul]:list-[circle] [&_ul_ul]:list-[square]')}
      {...props}
    />
  );
}

export function NumberedListElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="ol"
      className={cn('my-1 ml-6 list-decimal')}
      {...props}
    />
  );
}

export function ListItemElement(props: PlateElementProps) {
  return (
    <PlateElement as="li" className={cn('pl-1')} {...props} />
  );
}

export function TaskListElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="ul"
      className={cn('my-1 ml-6 list-none')}
      {...props}
    />
  );
}
