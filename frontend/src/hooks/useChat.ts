import { useCallback, useState } from 'react';
import type { ChatMessage, ChatMessageType, ActionLog, ToolAction } from '../types/messages';

let idCounter = 0;
function nextId(): string {
  return `msg-${++idCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processingText, setProcessingText] = useState<string | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const addMessage = useCallback((text: string, type: ChatMessageType) => {
    setMessages((prev) => [...prev, { id: nextId(), type, text }]);
  }, []);

  const appendAiChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === 'ai' && isStreamingRef.current) {
        return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
      }
      isStreamingRef.current = true;
      return [...prev, { id: nextId(), type: 'ai', text: chunk }];
    });
  }, []);

  // Use a ref to track streaming state without causing re-renders
  const isStreamingRef = { current: false };

  const finalizeAiMessage = useCallback(() => {
    isStreamingRef.current = false;
  }, []);

  const addToolAction = useCallback((tool: string, text: string) => {
    setActionLogs((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.status === 'running') {
        const updatedActions: ToolAction[] = last.actions.map((a) =>
          a.status === 'running' ? { ...a, status: 'done' as const } : a
        );
        updatedActions.push({ tool, text, status: 'running' });
        return [...prev.slice(0, -1), { ...last, actions: updatedActions }];
      }
      return [...prev, { id: nextId(), status: 'running', actions: [{ tool, text, status: 'running' }] }];
    });
  }, []);

  const finalizeActionLog = useCallback(() => {
    setActionLogs((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.status === 'running') {
        const updatedActions = last.actions.map((a) => ({ ...a, status: 'done' as const }));
        return [...prev.slice(0, -1), { ...last, status: 'done' as const, actions: updatedActions }];
      }
      return prev;
    });
  }, []);

  return {
    messages,
    processingText,
    actionLogs,
    isStreaming,
    addMessage,
    appendAiChunk,
    finalizeAiMessage,
    setProcessingText,
    addToolAction,
    finalizeActionLog,
    setIsStreaming,
  };
}
