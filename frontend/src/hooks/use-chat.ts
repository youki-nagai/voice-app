import { useCallback, useRef, useState } from 'react';
import type { ChatMessageType, ToolAction, TimelineItem } from '../types/messages';

let idCounter = 0;
function nextId(): string {
  return `msg-${++idCounter}`;
}

export function useChat() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const isStreamingRef = useRef(false);

  const addMessage = useCallback((text: string, type: ChatMessageType) => {
    setTimeline((prev) => {
      const filtered = prev.filter((item) => item.kind !== 'processing');
      return [...filtered, { kind: 'message', data: { id: nextId(), type, text } }];
    });
  }, []);

  const setProcessingText = useCallback((text: string | null) => {
    setTimeline((prev) => {
      const filtered = prev.filter((item) => item.kind !== 'processing');
      if (text === null) return filtered;
      return [...filtered, { kind: 'processing', id: 'processing', text }];
    });
  }, []);

  const appendAiChunk = useCallback((chunk: string) => {
    setTimeline((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === 'message' && last.data.type === 'ai' && isStreamingRef.current) {
        return [
          ...prev.slice(0, -1),
          { kind: 'message' as const, data: { ...last.data, text: last.data.text + chunk } },
        ];
      }
      isStreamingRef.current = true;
      return [...prev, { kind: 'message' as const, data: { id: nextId(), type: 'ai' as const, text: chunk } }];
    });
  }, []);

  const finalizeAiMessage = useCallback(() => {
    isStreamingRef.current = false;
  }, []);

  const addToolAction = useCallback((tool: string, text: string) => {
    setTimeline((prev) => {
      const filtered = prev.filter((item) => item.kind !== 'processing');
      const last = filtered[filtered.length - 1];

      if (last && last.kind === 'action-log' && last.data.status === 'running') {
        const updatedActions: ToolAction[] = last.data.actions.map((a) =>
          a.status === 'running' ? { ...a, status: 'done' as const } : a
        );
        updatedActions.push({ tool, text, status: 'running' });
        return [
          ...filtered.slice(0, -1),
          { kind: 'action-log' as const, data: { ...last.data, actions: updatedActions } },
        ];
      }
      return [
        ...filtered,
        {
          kind: 'action-log' as const,
          data: { id: nextId(), status: 'running' as const, actions: [{ tool, text, status: 'running' }] },
        },
      ];
    });
  }, []);

  const finalizeActionLog = useCallback(() => {
    setTimeline((prev) =>
      prev.map((item) => {
        if (item.kind === 'action-log' && item.data.status === 'running') {
          const updatedActions = item.data.actions.map((a) => ({ ...a, status: 'done' as const }));
          return { ...item, data: { ...item.data, status: 'done' as const, actions: updatedActions } };
        }
        return item;
      })
    );
  }, []);

  return {
    timeline,
    addMessage,
    appendAiChunk,
    finalizeAiMessage,
    setProcessingText,
    addToolAction,
    finalizeActionLog,
  };
}
