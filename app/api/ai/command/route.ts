import type { NextRequest } from 'next/server';

import {
  createOpenAI,
  type LanguageModel,
} from '@ai-sdk/openai';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  Output,
  streamText,
  tool,
} from 'ai';
import { createSlateEditor } from 'platejs';
import { nanoid } from 'platejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { BaseEditorKit } from '@/components/editor/editor-base-kit';
import type { ChatMessage } from '@/components/editor/use-chat';
import { createClient } from '@/lib/supabase-server';

import {
  buildEditTableMultiCellPrompt,
  getChooseToolPrompt,
  getCommentPrompt,
  getEditPrompt,
  getGeneratePrompt,
} from './prompt';

export type ToolName = 'comment' | 'edit' | 'generate';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      messages: messagesRaw,
      ctx,
      model,
    } = body as {
      messages?: ChatMessage[];
      ctx?: { children: unknown[]; selection: unknown; toolName?: ToolName };
      model?: string;
    };

    const children = ctx?.children;
    const value = Array.isArray(children) && children.length > 0
      ? children
      : [{ type: 'p', children: [{ text: '' }] }];

    const editor = createSlateEditor({
      plugins: BaseEditorKit,
      selection: ctx?.selection ?? undefined,
      value,
    });

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const isSelecting = editor.api.isExpanded();
    const modelId = model || 'gpt-4o-mini';
    const defaultModel = openai(modelId) as LanguageModel;

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        let toolName = ctx?.toolName;

        if (!toolName) {
          const prompt = getChooseToolPrompt({
            isSelecting,
            messages: messagesRaw ?? [],
          });

          const enumOptions = isSelecting
            ? (['generate', 'edit', 'comment'] as const)
            : (['generate', 'comment'] as const);

          const { output: chosenTool } = await generateText({
            model: defaultModel,
            output: Output.choice({ options: enumOptions }),
            prompt,
          });

          writer.write({
            data: chosenTool as ToolName,
            type: 'data-toolName',
          });
          toolName = chosenTool as ToolName;
        } else {
          writer.write({ data: toolName, type: 'data-toolName' });
        }

        const stream = streamText({
          model: defaultModel,
          prompt: '',
          tools: {
            comment: getCommentTool(editor, {
              messagesRaw: messagesRaw ?? [],
              model: defaultModel,
              writer,
            }),
            table: getTableTool(editor, {
              messagesRaw: messagesRaw ?? [],
              model: defaultModel,
              writer,
            }),
          },
          prepareStep: async (step) => {
            if (toolName === 'comment') {
              return {
                ...step,
                toolChoice: { toolName: 'comment', type: 'tool' },
              };
            }

            if (toolName === 'edit' && isSelecting) {
              try {
                const [editPrompt, editType] = getEditPrompt(editor, {
                  isSelecting,
                  messages: messagesRaw ?? [],
                });

                if (editType === 'table') {
                  return {
                    ...step,
                    toolChoice: { toolName: 'table', type: 'tool' },
                  };
                }

                return {
                  ...step,
                  activeTools: [],
                  messages: [{ content: editPrompt, role: 'user' }],
                  model: defaultModel,
                };
              } catch {
                // Fallback to generate if edit prompt fails (e.g. invalid selection)
              }
            }

            const generatePrompt = getGeneratePrompt(editor, {
              isSelecting,
              messages: messagesRaw ?? [],
            });

            return {
              ...step,
              activeTools: [],
              messages: [{ content: generatePrompt, role: 'user' }],
              model: defaultModel,
            };
          },
        });

        writer.merge(stream.toUIMessageStream({ sendFinish: false }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('[ai/command] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

function getCommentTool(
  editor: ReturnType<typeof createSlateEditor>,
  {
    messagesRaw,
    model,
    writer,
  }: {
    messagesRaw: ChatMessage[];
    model: LanguageModel;
    writer: { write: (part: { data: unknown; type: string }) => void };
  }
) {
  return tool({
    description: 'Comment on the content',
    inputSchema: z.object({}),
    strict: true,
    execute: async () => {
      const commentSchema = z.object({
        blockId: z.string().describe('The id of the starting block.'),
        comment: z.string().describe('A brief comment for this fragment.'),
        content: z
          .string()
          .describe(
            'The original document fragment. If spanning multiple blocks, separate with \\n\\n.'
          ),
      });

      const { partialOutputStream } = streamText({
        model,
        output: Output.array({ element: commentSchema }),
        prompt: getCommentPrompt(editor, { messages: messagesRaw }),
      });

      let lastLength = 0;
      for await (const partialArray of partialOutputStream) {
        for (let i = lastLength; i < partialArray.length; i++) {
          const comment = partialArray[i];
          writer.write({
            id: nanoid(),
            data: { comment, status: 'streaming' },
            type: 'data-comment',
          });
        }
        lastLength = partialArray.length;
      }

      writer.write({
        id: nanoid(),
        data: { comment: null, status: 'finished' },
        type: 'data-comment',
      });
    },
  });
}

function getTableTool(
  editor: ReturnType<typeof createSlateEditor>,
  {
    messagesRaw,
    model,
    writer,
  }: {
    messagesRaw: ChatMessage[];
    model: LanguageModel;
    writer: { write: (part: { data: unknown; type: string }) => void };
  }
) {
  return tool({
    description: 'Edit table cells',
    inputSchema: z.object({}),
    strict: true,
    execute: async () => {
      const cellUpdateSchema = z.object({
        content: z.string().describe('The new content for the cell.'),
        id: z.string().describe('The id of the table cell to update.'),
      });

      const { partialOutputStream } = streamText({
        model,
        output: Output.array({ element: cellUpdateSchema }),
        prompt: buildEditTableMultiCellPrompt(editor, messagesRaw),
      });

      let lastLength = 0;
      for await (const partialArray of partialOutputStream) {
        for (let i = lastLength; i < partialArray.length; i++) {
          writer.write({
            id: nanoid(),
            data: { cellUpdate: partialArray[i], status: 'streaming' },
            type: 'data-table',
          });
        }
        lastLength = partialArray.length;
      }

      writer.write({
        id: nanoid(),
        data: { cellUpdate: null, status: 'finished' },
        type: 'data-table',
      });
    },
  });
}
