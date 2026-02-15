'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function AIToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        // Open AI chat menu using the plugin API
        try {
          editor.getApi(AIChatPlugin).aiChat.show();
        } catch {
          // Fallback: simulate Cmd+J
          const event = new KeyboardEvent('keydown', {
            key: 'j',
            code: 'KeyJ',
            metaKey: true,
            ctrlKey: false,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    />
  );
}
