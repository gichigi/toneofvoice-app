'use client';

import type { ExtendConfig, Path } from 'platejs';

import {
  type BaseSuggestionConfig,
  BaseSuggestionPlugin,
} from '@platejs/suggestion';
import { isSlateEditor, isSlateString } from 'platejs';
import { toTPlatePlugin } from 'platejs/react';

import {
  SuggestionLeafAI,
  SuggestionLineBreakAI,
} from '@/components/ui/suggestion-node-ai';

/** Plate-style SuggestionKit for AI: SuggestionLeaf with hover/active, no DiscussionKit. */
export type SuggestionAIConfig = ExtendConfig<
  BaseSuggestionConfig,
  {
    activeId: string | null;
    hoverId: string | null;
    uniquePathMap: Map<string, Path>;
  }
>;

export const suggestionAIPlugin = toTPlatePlugin<SuggestionAIConfig>(
  BaseSuggestionPlugin,
  () => ({
    options: {
      activeId: null,
      currentUserId: 'ai-user',
      hoverId: null,
      uniquePathMap: new Map(),
    },
  })
).configure({
  handlers: {
    onClick: ({ api, event, setOption, type }) => {
      let leaf = event.target as HTMLElement;
      let isSet = false;

      const isBlockLeaf = leaf.dataset.blockSuggestion === 'true';

      const unsetActiveSuggestion = () => {
        setOption('activeId', null);
        isSet = true;
      };

      if (!isSlateString(leaf) && !isBlockLeaf) {
        unsetActiveSuggestion();
      }

      while (leaf.parentElement && !isSlateEditor(leaf.parentElement)) {
        const isBlockSuggestion = leaf.dataset.blockSuggestion === 'true';

        if (leaf.classList.contains(`slate-${type}`) || isBlockSuggestion) {
          const suggestionEntry = api.suggestion!.node({
            isText: !isBlockSuggestion,
          });

          if (!suggestionEntry) {
            unsetActiveSuggestion();
            break;
          }

          const id = api.suggestion!.nodeId(suggestionEntry[0]);
          setOption('activeId', id ?? null);
          isSet = true;
          break;
        }

        leaf = leaf.parentElement;
      }

      if (!isSet) unsetActiveSuggestion();
    },
  },
  render: {
    belowNodes: SuggestionLineBreakAI as any,
    node: SuggestionLeafAI,
  },
});

export const SuggestionAIKit = [suggestionAIPlugin];
