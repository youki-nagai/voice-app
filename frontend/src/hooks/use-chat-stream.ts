import { useCallback, useRef } from "react";
import type { ModelId, ServerMessage } from "../types/messages";
import type { useMultiChat } from "./use-multi-chat";
import { useSSE } from "./use-sse";

interface UseChatStreamOptions {
  chat: ReturnType<typeof useMultiChat>;
  getActiveSessionId: () => string;
  onCommand?: (
    commandType: "model" | "app",
    command: Record<string, unknown>,
  ) => void;
}

export function useChatStream({
  chat,
  getActiveSessionId,
  onCommand,
}: UseChatStreamOptions) {
  const sendingSessionIdRef = useRef<string | null>(null);

  const getSessionId = useCallback(
    () => sendingSessionIdRef.current ?? getActiveSessionId(),
    [getActiveSessionId],
  );

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      const sid = getSessionId();
      switch (msg.type) {
        case "status":
          chat.setProcessingText(sid, msg.text);
          chat.setIsWaitingForAI(sid, true);
          break;
        case "tool_action":
          chat.setProcessingText(sid, null);
          chat.addToolAction(sid, msg.tool, msg.text);
          chat.setIsWaitingForAI(sid, true);
          break;
        case "ai_chunk":
          chat.setProcessingText(sid, null);
          chat.finalizeActionLog(sid);
          chat.appendAiChunk(sid, msg.text);
          break;
        case "ai_done":
          chat.finalizeAiMessage(sid);
          break;
        case "command":
          chat.resetStreamState(sid);
          onCommand?.(msg.command_type, msg.command);
          sendingSessionIdRef.current = null;
          break;
        case "complete":
          chat.resetStreamState(sid);
          sendingSessionIdRef.current = null;
          break;
        case "error":
          chat.resetStreamState(sid);
          chat.addMessage(sid, msg.text, "error");
          sendingSessionIdRef.current = null;
          break;
      }
    },
    [chat, getSessionId, onCommand],
  );

  const sse = useSSE({
    onMessage: handleServerMessage,
    onError: (error) => {
      const sid = getSessionId();
      chat.resetStreamState(sid);
      chat.addMessage(sid, `エラー: ${error}`, "error");
      sendingSessionIdRef.current = null;
    },
    onRetry: (retryCount, delay) => {
      const sid = getSessionId();
      chat.addMessage(
        sid,
        `ネットワークエラー。${delay / 1000}秒後にリトライします... (${retryCount}/${3})`,
        "error",
      );
    },
  });

  const send = useCallback(
    (text: string, model: ModelId, images: string[], sessionId: string) => {
      chat.setProcessingText(sessionId, "送信中...");
      chat.setIsWaitingForAI(sessionId, true);
      sendingSessionIdRef.current = sessionId;
      sse.sendStream(text, model, images, sessionId);
    },
    [chat, sse],
  );

  return { send };
}
