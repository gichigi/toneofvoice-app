"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useEditorRef } from "platejs/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AIAssistAction } from "@/app/api/ai-assist/route";

const ACTIONS: { key: AIAssistAction; label: string }[] = [
  { key: "rewrite", label: "Rewrite" },
  { key: "expand", label: "Expand" },
  { key: "shorten", label: "Shorten" },
  { key: "more_formal", label: "More Formal" },
  { key: "more_casual", label: "More Casual" },
  { key: "simplify", label: "Simplify" },
];

interface AIAssistToolbarProps {
  /** Optional: container ref for the editor (to detect selection inside) */
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function AIAssistToolbar({ editorContainerRef }: AIAssistToolbarProps) {
  const editor = useEditorRef();
  const { toast } = useToast();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const updateSelection = useCallback(() => {
    if (!editor?.selection || !editor.api) return;
    try {
      const sel = editor.selection;
      const text = (editor.api as { string?: (at?: unknown) => string }).string?.(sel) ?? "";
      if (text && text.trim().length > 0) {
        setSelectedText(text.trim());
        const domSel = window.getSelection();
        if (domSel && domSel.rangeCount > 0) {
          const rect = domSel.getRangeAt(0).getBoundingClientRect();
          setPosition({ top: rect.bottom + 8, left: rect.left }); // fixed positioning = viewport coords
        } else {
          setPosition(null);
        }
      } else {
        setSelectedText("");
        setPosition(null);
      }
    } catch {
      setSelectedText("");
      setPosition(null);
    }
  }, [editor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editor) return;
      const domSel = window.getSelection();
      if (!domSel || domSel.isCollapsed) {
        setPosition(null);
        setSelectedText("");
        return;
      }
      const container = editorContainerRef?.current;
      if (container && !container.contains(domSel.anchorNode)) return;
      updateSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [editor, editorContainerRef, updateSelection]);

  const handleAction = useCallback(
    async (action: AIAssistAction) => {
      if (!selectedText || !editor?.tf) return;
      setLoading(action);
      try {
        const res = await fetch("/api/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: selectedText,
            action,
            context: undefined,
          }),
        });
        if (!res.ok) throw new Error("AI assist failed");
        const { suggestion } = await res.json();
        if (!suggestion || typeof suggestion !== "string") throw new Error("Invalid response");

        const tf = editor.tf as {
          deleteFragment?: (opts?: { at?: unknown }) => void;
          insertText?: (text: string, opts?: { at?: unknown }) => void;
        };
        const sel = editor.selection;
        if (sel) {
          tf.deleteFragment?.({ at: sel });
          tf.insertText?.(suggestion, { at: editor.selection ?? sel });
        }
        setPosition(null);
        setSelectedText("");
        toast({ title: "Text updated", description: "AI suggestion applied." });
      } catch (e) {
        console.error("[AIAssistToolbar] Error:", e);
        toast({
          title: "AI assist failed",
          description: "Could not apply suggestion. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(null);
      }
    },
    [selectedText, editor, toast]
  );

  if (!editor || !position) return null;

  return (
    <div
      className="fixed z-[100] flex flex-wrap items-center gap-1 rounded-lg border bg-white px-2 py-1.5 shadow-lg dark:bg-gray-900"
      style={{ top: position.top, left: position.left }}
    >
      {ACTIONS.map(({ key, label }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={!!loading}
          onClick={() => handleAction(key)}
        >
          {loading === key ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
        </Button>
      ))}
      {selectedText && (
        <span className="ml-1 max-w-[120px] truncate text-xs text-muted-foreground" title={selectedText}>
          {selectedText.slice(0, 30)}…
        </span>
      )}
    </div>
  );
}
