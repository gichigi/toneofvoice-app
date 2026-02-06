// Design system: see DESIGN_SYSTEM.md for typography/spacing decisions

"use client";

import * as React from "react";
import { useCallback, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Plate, usePlateEditor } from "platejs/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
  HorizontalRulePlugin,
} from "@platejs/basic-nodes/react";
import {
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  ListItemPlugin,
  ListItemContentPlugin,
} from "@platejs/list-classic/react";
import { LinkPlugin } from "@platejs/link/react";
import { MarkdownPlugin } from "@platejs/markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
} from "lucide-react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { ToolbarButton, ToolbarGroup } from "@/components/ui/toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// UI node components — see DESIGN_SYSTEM.md
import { H1Element, H2Element, H3Element } from "@/components/ui/heading-node";
import { BlockquoteElement } from "@/components/ui/blockquote-node";
import { HrElement } from "@/components/ui/hr-node";
import { ParagraphElement } from "@/components/ui/paragraph-node";
import { CodeLeaf } from "@/components/ui/code-node";
import {
  BulletedListElement,
  NumberedListElement,
  ListItemElement,
} from "@/components/ui/list-classic-node";
import { LinkElement } from "@/components/ui/link-node";

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
  /** Read-only mode (preview mode) */
  readOnly?: boolean;
}

/** Ref handle exposed to parent components */
export interface StyleGuideEditorRef {
  getMarkdown: () => string;
}

export const StyleGuideEditor = forwardRef<StyleGuideEditorRef, StyleGuideEditorProps>(function StyleGuideEditor({
  markdown,
  onChange,
  storageKey,
  className,
  readOnly = false,
}, ref) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [showTip, setShowTip] = useState(true);

  const editor = usePlateEditor({
    id: "style-guide-editor",
    plugins: [
      // Markdown serialisation (must come first for deserialize/serialize)
      MarkdownPlugin.configure({
        options: { remarkPlugins: [remarkGfm] },
      }),

      // Block elements with custom components
      H1Plugin.configure({
        node: { component: H1Element },
        shortcuts: { toggle: { keys: "mod+alt+1" } },
      }),
      H2Plugin.configure({
        node: { component: H2Element },
        shortcuts: { toggle: { keys: "mod+alt+2" } },
      }),
      H3Plugin.configure({
        node: { component: H3Element },
        shortcuts: { toggle: { keys: "mod+alt+3" } },
      }),
      BlockquotePlugin.configure({
        node: { component: BlockquoteElement },
      }),
      HorizontalRulePlugin.withComponent(HrElement),

      // Lists
      ListPlugin,
      ListItemPlugin.withComponent(ListItemElement),
      ListItemContentPlugin,
      BulletedListPlugin.configure({
        node: { component: BulletedListElement },
      }),
      NumberedListPlugin.configure({
        node: { component: NumberedListElement },
      }),

      // Links
      LinkPlugin.configure({
        render: { node: LinkElement },
      }),

      // Inline marks
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin.configure({
        node: { component: CodeLeaf },
      }),
    ],
    value: (ed) => {
      try {
        const api = ed.getApi(MarkdownPlugin);
        return (
          api?.markdown?.deserialize?.(
            markdown || "# Style Guide\n\nEdit your content here.",
            { remarkPlugins: [remarkGfm] }
          ) ?? [{ type: "p", children: [{ text: markdown || "Empty" }] }]
        );
      } catch {
        return [{ type: "p", children: [{ text: markdown || "Empty" }] }];
      }
    },
  });

  // Expose getMarkdown to parent via ref
  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      try {
        return editor.api.markdown?.serialize?.() ?? "";
      } catch {
        return "";
      }
    },
  }), [editor]);

  const handleValueChange = useCallback(
    ({ value }: { value: any[] }) => {
      if (!editor) return;
      try {
        const serialized = editor.api.markdown?.serialize?.() ?? "";
        if (serialized && onChangeRef.current) {
          onChangeRef.current(serialized);
        }
        // Auto-save to localStorage if key provided
        if (storageKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, serialized);
          } catch {
            // Ignore storage errors
          }
        }
      } catch (e) {
        console.warn("[StyleGuideEditor] Serialize error:", e);
      }
    },
    [editor, storageKey]
  );

  /** Insert a link at current selection via prompt */
  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    // Use Slate transforms to wrap selection in a link
    editor.tf.insertNodes(
      { type: "a", url, children: [{ text: url }] },
      { select: true }
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dismissable tip banner */}
      {showTip && !readOnly && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
          <span>
            This guide is fully editable. Click anywhere to make changes, or use
            AI Assist to refine sections.
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
        <Plate editor={editor} onChange={handleValueChange}>
          {/* Toolbar — only visible when editing */}
          {!readOnly && (
            <TooltipProvider delayDuration={200}>
              <FixedToolbar className="flex items-center gap-0.5 px-1.5 py-1">
              {/* Headings */}
              <ToolbarGroup>
                <ToolbarButton
                  tooltip="Heading 1 (⌘+⌥+1)"
                  onClick={() => editor.tf.h1.toggle()}
                >
                  <Heading1 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Heading 2 (⌘+⌥+2)"
                  onClick={() => editor.tf.h2.toggle()}
                >
                  <Heading2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Heading 3 (⌘+⌥+3)"
                  onClick={() => editor.tf.h3.toggle()}
                >
                  <Heading3 className="size-4" />
                </ToolbarButton>
              </ToolbarGroup>

              {/* Text formatting */}
              <ToolbarGroup>
                <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
                  <Bold className="size-4" />
                </MarkToolbarButton>
                <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
                  <Italic className="size-4" />
                </MarkToolbarButton>
                <MarkToolbarButton
                  nodeType="underline"
                  tooltip="Underline (⌘+U)"
                >
                  <Underline className="size-4" />
                </MarkToolbarButton>
                <MarkToolbarButton
                  nodeType="strikethrough"
                  tooltip="Strikethrough (⌘+⇧+X)"
                >
                  <Strikethrough className="size-4" />
                </MarkToolbarButton>
                <MarkToolbarButton nodeType="code" tooltip="Inline code (⌘+E)">
                  <Code className="size-4" />
                </MarkToolbarButton>
              </ToolbarGroup>

              {/* Lists */}
              <ToolbarGroup>
                <ToolbarButton
                  tooltip="Bullet list"
                  onClick={() => editor.tf.bulleted_list.toggle()}
                >
                  <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Numbered list"
                  onClick={() => editor.tf.numbered_list.toggle()}
                >
                  <ListOrdered className="size-4" />
                </ToolbarButton>
              </ToolbarGroup>

              {/* Block elements */}
              <ToolbarGroup>
                <ToolbarButton
                  tooltip="Blockquote"
                  onClick={() => editor.tf.blockquote.toggle()}
                >
                  <Quote className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  tooltip="Horizontal rule"
                  onClick={() => {
                    editor.tf.insertNodes(
                      { type: "hr", children: [{ text: "" }] },
                      { select: true }
                    );
                  }}
                >
                  <Minus className="size-4" />
                </ToolbarButton>
                <ToolbarButton tooltip="Insert link" onClick={insertLink}>
                  <LinkIcon className="size-4" />
                </ToolbarButton>
              </ToolbarGroup>
              </FixedToolbar>
            </TooltipProvider>
          )}

          <EditorContainer className="min-h-[400px]">
            <Editor
              variant="default"
              placeholder="Type your style guide content..."
              readOnly={readOnly}
              className="prose prose-slate dark:prose-invert max-w-none style-guide-content style-guide-document px-6 py-4"
            />
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
});
