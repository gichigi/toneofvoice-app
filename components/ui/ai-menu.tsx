'use client';

import * as React from 'react';

import {
  AIChatPlugin,
  AIPlugin,
  rejectAISuggestions,
  useEditorChat,
  useLastAssistantMessage,
} from '@platejs/ai/react';
import { BlockSelectionPlugin, useIsSelecting } from '@platejs/selection/react';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Check,
  CornerUpLeft,
  FeatherIcon,
  ListEnd,
  ListMinus,
  ListPlus,
  Loader2Icon,
  PauseIcon,
  PenLine,
  Wand,
  X,
} from 'lucide-react';
import {
  type SlateEditor,
  isHotkey,
  NodeApi,
} from 'platejs';
import {
  useEditorPlugin,
  useFocusedLast,
  useHotkeys,
  usePluginOption,
} from 'platejs/react';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function AIMenu() {
  const { api, editor } = useEditorPlugin(AIChatPlugin);
  const mode = usePluginOption(AIChatPlugin, 'mode');
  const toolName = usePluginOption(AIChatPlugin, 'toolName');
  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const isSelecting = useIsSelecting();
  const isFocusedLast = useFocusedLast();
  const open = usePluginOption(AIChatPlugin, 'open') && isFocusedLast;
  const [value, setValue] = React.useState('');
  const [input, setInput] = React.useState('');
  const chat = usePluginOption(AIChatPlugin, 'chat');
  const { messages, status } = chat;
  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);

  // Insert mode: aiChat node is anchor. Edit mode: refresh anchor when suggestions are ready
  // (block DOM may have changed after applyAISuggestions).
  React.useEffect(() => {
    if (streaming && mode === 'insert') {
      const anchor = api.aiChat.node({ anchor: true });
      if (anchor) {
        setTimeout(() => {
          const anchorDom = editor.api.toDOMNode(anchor[0]);
          if (anchorDom) setAnchorElement(anchorDom);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, mode]);

  // Edit mode: refresh anchor when streaming finishes so popover stays near suggested content
  const hasEditSuggestions =
    !(status === 'streaming' || status === 'submitted') &&
    toolName === 'edit' &&
    mode === 'chat' &&
    messages.length > 0;
  React.useEffect(() => {
    if (!hasEditSuggestions) return;
    const id = requestAnimationFrame(() => {
      const blocks = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
      const node = blocks.length > 0 ? blocks.at(-1)![0] : editor.api.blocks().at(-1)?.[0];
      if (node) {
        const dom = editor.api.toDOMNode(node);
        if (dom && document.contains(dom)) setAnchorElement(dom);
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEditSuggestions, messages.length]);

  const setOpen = (open: boolean) => {
    if (open) {
      api.aiChat.show();
    } else {
      api.aiChat.hide();
    }
  };

  const show = (anchorElement: HTMLElement) => {
    setAnchorElement(anchorElement);
    setOpen(true);
  };

  useEditorChat({
    onOpenBlockSelection: (blocks) => {
      show(editor.api.toDOMNode(blocks.at(-1)![0])!);
    },
    onOpenChange: (open) => {
      if (!open) {
        setAnchorElement(null);
        setInput('');
      }
    },
    onOpenCursor: () => {
      const [ancestor] = editor.api.block({ highest: true })!;

      if (!editor.api.isAt({ end: true }) && !editor.api.isEmpty(ancestor)) {
        editor
          .getApi(BlockSelectionPlugin)
          .blockSelection.set(ancestor.id as string);
      }

      show(editor.api.toDOMNode(ancestor)!);
    },
    onOpenSelection: () => {
      show(editor.api.toDOMNode(editor.api.blocks().at(-1)![0])!);
    },
  });

  useHotkeys('esc', () => {
    api.aiChat.stop();
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Insert mode: hide menu during streaming (aiChat node is anchor)
  if (isLoading && mode === 'insert') return null;
  // Edit mode: keep menu mounted so Accept/Reject popover appears when done

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor virtualRef={{ current: anchorElement! }} />

      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        style={{
          width: anchorElement?.offsetWidth,
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          api.aiChat.hide();
        }}
        align="center"
        side={hasEditSuggestions ? 'top' : 'bottom'}
      >
        <Command
          className="w-full rounded-lg border shadow-md"
          value={value}
          onValueChange={setValue}
        >
          {isLoading ? (
            <div className="flex grow select-none items-center gap-2 p-2 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              {messages.length > 1 ? 'Editing...' : 'Thinking...'}
            </div>
          ) : (
            <CommandPrimitive.Input
              className={cn(
                'flex h-9 w-full min-w-0 border-input bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground md:text-sm',
                'border-b focus-visible:ring-transparent'
              )}
              value={input}
              onKeyDown={(e) => {
                if (isHotkey('backspace')(e) && input.length === 0) {
                  e.preventDefault();
                  api.aiChat.hide();
                }
                if (isHotkey('enter')(e) && !e.shiftKey && !value) {
                  e.preventDefault();
                  void api.aiChat.submit(input);
                  setInput('');
                }
              }}
              onValueChange={setInput}
              placeholder="Ask AI anything..."
              data-plate-focus
              autoFocus
            />
          )}

          {!isLoading && (
            <CommandList>
              <AIMenuItems
                input={input}
                setInput={setInput}
                setValue={setValue}
              />
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type EditorChatState =
  | 'cursorCommand'
  | 'cursorSuggestion'
  | 'selectionCommand'
  | 'selectionSuggestion';

const aiChatItems = {
  accept: {
    icon: <Check />,
    label: 'Accept',
    value: 'accept',
    onSelect: ({ editor }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      editor.getTransforms(AIChatPlugin).aiChat.accept();
    },
  },
  discard: {
    icon: <X />,
    label: 'Discard',
    shortcut: 'Escape',
    value: 'discard',
    onSelect: ({ editor }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      const mode = editor.getOption(AIChatPlugin, 'mode');
      if (mode === 'chat') {
        rejectAISuggestions(editor);
      } else {
        editor.getTransforms(AIPlugin).ai.undo();
      }
      editor.getApi(AIChatPlugin).aiChat.hide();
    },
  },
  tryAgain: {
    icon: <CornerUpLeft />,
    label: 'Try again',
    value: 'tryAgain',
    onSelect: ({ editor }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.reload();
    },
  },
  insertBelow: {
    icon: <ListEnd />,
    label: 'Insert below',
    value: 'insertBelow',
    onSelect: ({ aiEditor, editor }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor
        .getTransforms(AIChatPlugin)
        .aiChat.insertBelow(aiEditor, { format: 'none' });
    },
  },
  continueWrite: {
    icon: <PenLine />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      const ancestorNode = editor.api.block({ highest: true });
      if (!ancestorNode) return;

      const isEmpty = NodeApi.string(ancestorNode[0]).trim().length === 0;

      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: isEmpty
          ? `<Document>\n{editor}\n</Document>\nStart writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
          : 'Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.',
        toolName: 'generate',
      });
    },
  },
  improveWriting: {
    icon: <Wand />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'chat',
        prompt: 'Rewrite the following with improved clarity and flow, without changing meaning. Return only the improved text:\n\n{blockSelection}',
        toolName: 'edit',
      });
    },
  },
  makeLonger: {
    icon: <ListPlus />,
    label: 'Expand',
    value: 'makeLonger',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'chat',
        prompt: 'Expand the following content by elaborating on existing ideas. Return only the expanded text:\n\n{blockSelection}',
        toolName: 'edit',
      });
    },
  },
  makeShorter: {
    icon: <ListMinus />,
    label: 'Shorten',
    value: 'makeShorter',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'chat',
        prompt: 'Shorten the following by reducing verbosity while keeping essential information. Return only the shortened text:\n\n{blockSelection}',
        toolName: 'edit',
      });
    },
  },
  fixSpelling: {
    icon: <Check />,
    label: 'Fix grammar',
    value: 'fixSpelling',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'chat',
        prompt: 'Fix spelling, grammar, and punctuation in the following. Return only the corrected text:\n\n{blockSelection}',
        toolName: 'edit',
      });
    },
  },
  simplifyLanguage: {
    icon: <FeatherIcon />,
    label: 'Simplify',
    value: 'simplifyLanguage',
    onSelect: ({ editor, input }: { editor: PlateEditor; aiEditor: SlateEditor; input: string }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'chat',
        prompt: 'Simplify the following using clearer, straightforward wording. Return only the simplified text:\n\n{blockSelection}',
        toolName: 'edit',
      });
    },
  },
};

const menuStateItems: Record<
  EditorChatState,
  {
    items: (typeof aiChatItems)[keyof typeof aiChatItems][];
    heading?: string;
  }[]
> = {
  cursorCommand: [
    {
      items: [
        aiChatItems.continueWrite,
        aiChatItems.improveWriting,
      ],
    },
  ],
  cursorSuggestion: [
    {
      items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.tryAgain],
    },
  ],
  selectionCommand: [
    {
      heading: 'Edit selection',
      items: [
        aiChatItems.improveWriting,
        aiChatItems.makeLonger,
        aiChatItems.makeShorter,
        aiChatItems.fixSpelling,
        aiChatItems.simplifyLanguage,
      ],
    },
  ],
  selectionSuggestion: [
    {
      items: [
        aiChatItems.accept,
        aiChatItems.discard,
        aiChatItems.tryAgain,
      ],
    },
  ],
};

export const AIMenuItems = ({
  input,
  setInput,
  setValue,
}: {
  input: string;
  setInput: (value: string) => void;
  setValue: (value: string) => void;
}) => {
  const editor = useEditorRef();
  const { messages } = usePluginOption(AIChatPlugin, 'chat');
  const aiEditor = usePluginOption(AIChatPlugin, 'aiEditor')!;
  const isSelecting = useIsSelecting();
  const subscriptionTier = usePluginOption(AIChatPlugin, 'subscriptionTier') || 'starter';
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);

  const menuState = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return isSelecting ? 'selectionSuggestion' : 'cursorSuggestion';
    }
    return isSelecting ? 'selectionCommand' : 'cursorCommand';
  }, [isSelecting, messages]);

  const menuGroups = React.useMemo(() => {
    return menuStateItems[menuState];
  }, [menuState]);

  React.useEffect(() => {
    if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
      setValue(menuGroups[0].items[0].value);
    }
  }, [menuGroups, setValue]);

  return (
    <>
      {menuGroups.map((group, index) => (
        <CommandGroup key={index} heading={group.heading}>
          {group.items.map((menuItem) => (
            <CommandItem
              key={menuItem.value}
              className="[&_svg]:text-muted-foreground"
              value={menuItem.value}
              onSelect={() => {
                // Gate AI features for free users (except accept/discard/tryAgain)
                const freeActions = ['accept', 'discard', 'tryAgain'];
                if (subscriptionTier === 'starter' && !freeActions.includes(menuItem.value)) {
                  setShowUpgradeDialog(true);
                  return;
                }
                
                menuItem.onSelect?.({
                  aiEditor,
                  editor,
                  input,
                });
                setInput('');
              }}
            >
              {menuItem.icon}
              <span>{menuItem.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ))}

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Upgrade to use AI features</DialogTitle>
            <DialogDescription>
              AI-powered editing is available on Pro and Agency plans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <Wand className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI-powered editing</p>
                <p className="text-sm text-muted-foreground">Improve, shorten, simplify, and fix your content instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PenLine className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Continue writing</p>
                <p className="text-sm text-muted-foreground">Let AI help you expand your tone of voice guidelines</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.location.href = '/dashboard/billing'}>
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const editBarClassName = cn(
  'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm shadow-md'
);

export function AILoadingBar() {
  const chat = usePluginOption(AIChatPlugin, 'chat');
  const mode = usePluginOption(AIChatPlugin, 'mode');
  const toolName = usePluginOption(AIChatPlugin, 'toolName');
  const { status, messages } = chat;
  const { api, editor } = useEditorPlugin(AIChatPlugin);

  const isLoading = status === 'streaming' || status === 'submitted';

  useHotkeys('esc', () => {
    api.aiChat.stop();
  });

  // Loading bar during insert or edit streaming
  if (
    isLoading &&
    (mode === 'insert' || (toolName === 'edit' && mode === 'chat'))
  ) {
    return (
      <div className={editBarClassName}>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span>{status === 'submitted' ? 'Thinking...' : 'Writing...'}</span>
        <Button
          size="sm"
          variant="ghost"
          className="flex items-center gap-1 text-xs"
          onClick={() => api.aiChat.stop()}
        >
          <PauseIcon className="h-4 w-4" />
          Stop
          <kbd className="ml-1 rounded bg-border px-1 font-mono text-[10px] text-muted-foreground shadow-sm">
            Esc
          </kbd>
        </Button>
      </div>
    );
  }

  return null;
}
