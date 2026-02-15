'use client';

import * as React from 'react';

import { type UseChatHelpers, useChat as useBaseChat } from '@ai-sdk/react';
import { AIChatPlugin } from '@platejs/ai/react';
import { type UIMessage, DefaultChatTransport } from 'ai';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { aiChatPlugin } from '@/components/editor/plugins/ai-kit';

export type ToolName = 'comment' | 'edit' | 'generate';

export type MessageDataPart = {
  toolName?: ToolName;
};

export type Chat = UseChatHelpers<ChatMessage>;

export type ChatMessage = UIMessage<{}, MessageDataPart>;

export const useChat = () => {
  const editor = useEditorRef();
  const options = usePluginOption(aiChatPlugin, 'chatOptions');

  const baseChat = useBaseChat<ChatMessage>({
    id: 'editor',
    transport: new DefaultChatTransport({
      api: options.api || '/api/ai/command',
    }),
    ...options,
    onData(data: { type?: string; data?: ToolName }) {
      if (data?.type === 'data-toolName' && data?.data) {
        editor.setOption(AIChatPlugin, 'toolName', data.data);
      }
    },
  });

  const chat = { ...baseChat };

  React.useEffect(() => {
    editor.setOption(AIChatPlugin, 'chat', chat as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.status, chat.messages, chat.error]);

  return chat;
};
