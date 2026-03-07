import { useCallback, useRef, useState } from "react";
import type {
  ChatMessageType,
  TimelineItem,
  ToolAction,
} from "../types/messages";

let idCounter = 0;
function nextId(): string {
  return `mc-${++idCounter}`;
}

function withoutProcessing(items: TimelineItem[]): TimelineItem[] {
  return items.filter((item) => item.kind !== "processing");
}

export function useMultiChat() {
  const [timelines, setTimelines] = useState<Record<string, TimelineItem[]>>(
    {},
  );
  const [waitingStates, setWaitingStates] = useState<Record<string, boolean>>(
    {},
  );
  const streamingRefs = useRef<Record<string, boolean>>({});

  const getTimeline = useCallback(
    (sessionId: string): TimelineItem[] => timelines[sessionId] ?? [],
    [timelines],
  );

  const getIsWaitingForAI = useCallback(
    (sessionId: string): boolean => waitingStates[sessionId] ?? false,
    [waitingStates],
  );

  const setIsWaitingForAI = useCallback((sessionId: string, value: boolean) => {
    setWaitingStates((prev) => ({ ...prev, [sessionId]: value }));
  }, []);

  const updateTimeline = useCallback(
    (sessionId: string, updater: (prev: TimelineItem[]) => TimelineItem[]) => {
      setTimelines((prev) => ({
        ...prev,
        [sessionId]: updater(prev[sessionId] ?? []),
      }));
    },
    [],
  );

  const addMessage = useCallback(
    (
      sessionId: string,
      text: string,
      type: ChatMessageType,
      imageUrl?: string,
    ) => {
      updateTimeline(sessionId, (prev) => [
        ...withoutProcessing(prev),
        { kind: "message", data: { id: nextId(), type, text, imageUrl } },
      ]);
    },
    [updateTimeline],
  );

  const setProcessingText = useCallback(
    (sessionId: string, text: string | null) => {
      updateTimeline(sessionId, (prev) => {
        const filtered = withoutProcessing(prev);
        if (text === null) return filtered;
        return [...filtered, { kind: "processing", id: "processing", text }];
      });
    },
    [updateTimeline],
  );

  const appendAiChunk = useCallback(
    (sessionId: string, chunk: string) => {
      updateTimeline(sessionId, (prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.kind === "message" &&
          last.data.type === "ai" &&
          streamingRefs.current[sessionId]
        ) {
          return [
            ...prev.slice(0, -1),
            {
              kind: "message" as const,
              data: { ...last.data, text: last.data.text + chunk },
            },
          ];
        }
        streamingRefs.current[sessionId] = true;
        return [
          ...prev,
          {
            kind: "message" as const,
            data: { id: nextId(), type: "ai" as const, text: chunk },
          },
        ];
      });
    },
    [updateTimeline],
  );

  const finalizeAiMessage = useCallback((sessionId: string) => {
    streamingRefs.current[sessionId] = false;
  }, []);

  const addToolAction = useCallback(
    (sessionId: string, tool: string, text: string) => {
      updateTimeline(sessionId, (prev) => {
        const filtered = withoutProcessing(prev);
        const last = filtered[filtered.length - 1];

        if (
          last &&
          last.kind === "action-log" &&
          last.data.status === "running"
        ) {
          const updatedActions: ToolAction[] = last.data.actions.map((a) =>
            a.status === "running" ? { ...a, status: "done" as const } : a,
          );
          updatedActions.push({ tool, text, status: "running" });
          return [
            ...filtered.slice(0, -1),
            {
              kind: "action-log" as const,
              data: { ...last.data, actions: updatedActions },
            },
          ];
        }
        return [
          ...filtered,
          {
            kind: "action-log" as const,
            data: {
              id: nextId(),
              status: "running" as const,
              actions: [{ tool, text, status: "running" }],
            },
          },
        ];
      });
    },
    [updateTimeline],
  );

  const finalizeActionLog = useCallback(
    (sessionId: string) => {
      updateTimeline(sessionId, (prev) =>
        prev.map((item) => {
          if (item.kind === "action-log" && item.data.status === "running") {
            const updatedActions = item.data.actions.map((a) => ({
              ...a,
              status: "done" as const,
            }));
            return {
              ...item,
              data: {
                ...item.data,
                status: "done" as const,
                actions: updatedActions,
              },
            };
          }
          return item;
        }),
      );
    },
    [updateTimeline],
  );

  const resetStreamState = useCallback(
    (sessionId: string) => {
      setIsWaitingForAI(sessionId, false);
      setProcessingText(sessionId, null);
      finalizeActionLog(sessionId);
    },
    [setIsWaitingForAI, setProcessingText, finalizeActionLog],
  );

  const setTimeline = useCallback(
    (sessionId: string, items: TimelineItem[]) => {
      setTimelines((prev) => ({ ...prev, [sessionId]: items }));
    },
    [],
  );

  const removeSessionData = useCallback((sessionId: string) => {
    setTimelines((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
    setWaitingStates((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
    delete streamingRefs.current[sessionId];
  }, []);

  return {
    getTimeline,
    getIsWaitingForAI,
    setIsWaitingForAI,
    addMessage,
    setProcessingText,
    appendAiChunk,
    finalizeAiMessage,
    addToolAction,
    finalizeActionLog,
    setTimeline,
    resetStreamState,
    removeSessionData,
  };
}
