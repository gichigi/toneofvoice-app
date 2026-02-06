"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Plate, usePlateEditor } from "platejs/react";
import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  BlockquotePlugin,
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from "@platejs/basic-nodes/react";
import { MarkdownPlugin } from "@platejs/markdown";
import remarkGfm from "remark-gfm";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY_PREFIX = "style-guide-edits-";

interface StyleGuideEditorProps {
  /** Initial markdown content */
  markdown: string;
  /** Callback when content changes (debounced) */
  onChange?: (markdown: string) => void;
  /** Storage key for auto-save (e.g. brand name) */
  storageKey?: string;
  /** Optional class name */
  className?: string;
}

export function StyleGuideEditor({
  markdown,
  onChange,
  storageKey,
  className,
}: StyleGuideEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [showTip, setShowTip] = useState(true);

  const editor = usePlateEditor({
    id: "style-guide-editor",
    plugins: [
      MarkdownPlugin.configure({
        options: { remarkPlugins: [remarkGfm] },
      }),
      BasicBlocksPlugin,
      BasicMarksPlugin,
      BlockquotePlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
    ],
    value: (ed) => {
      try {
        const api = ed.getApi(MarkdownPlugin);
        return api?.markdown?.deserialize?.(markdown || "# Style Guide\n\nEdit your content here.", { remarkPlugins: [remarkGfm] }) ?? [{ type: "p", children: [{ text: markdown || "Empty" }] }];
      } catch {
        return [{ type: "p", children: [{ text: markdown || "Empty" }] }];
      }
    },
    dependencies: [markdown],
  });

  const handleValueChange = useCallback(
    ({ value }: { value: any[] }) => {
      if (!editor) return;
      try {
        const serialized = editor.api.markdown?.serialize?.() ?? "";
        if (serialized && onChangeRef.current) {
          onChangeRef.current(serialized);
        }
        if (storageKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, serialized);
          } catch {}
        }
      } catch (e) {
        console.warn("[StyleGuideEditor] Serialize error:", e);
      }
    },
    [editor, storageKey]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {showTip && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
          <span>
            This guide is fully editable. Click anywhere to make changes, or use AI Assist to refine sections.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-blue-600 hover:text-blue-800 dark:text-blue-300"
            onClick={() => setShowTip(false)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-white dark:bg-gray-950">
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-bold"
            onClick={() => editor?.tf?.h1?.toggle?.()}
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-semibold"
            onClick={() => editor?.tf?.h2?.toggle?.()}
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => editor?.tf?.h3?.toggle?.()}
          >
            H3
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-bold"
            onClick={() => editor?.tf?.bold?.toggle?.()}
          >
            B
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 italic"
            onClick={() => editor?.tf?.italic?.toggle?.()}
          >
            I
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 underline"
            onClick={() => editor?.tf?.underline?.toggle?.()}
          >
            U
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => editor?.tf?.blockquote?.toggle?.()}
          >
            Quote
          </Button>
        </div>

        <Plate editor={editor} onChange={handleValueChange}>
          <EditorContainer className="min-h-[400px]">
            <Editor
              variant="default"
              placeholder="Type your style guide content..."
              className="prose prose-slate dark:prose-invert max-w-none style-guide-content px-6 py-4"
            />
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}
