import { useCallback } from "react";
import type { ModelId, ServerMessage } from "../types/messages";

const MAX_RETRIES = 3;

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return (
      error.message === "Failed to fetch" ||
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message === "Load failed"
    );
  }
  return false;
}

interface UseSSEOptions {
  onMessage: (msg: ServerMessage) => void;
  onError: (error: string) => void;
  onRetry: (retryCount: number, delay: number) => void;
}

export function useSSE({ onMessage, onError, onRetry }: UseSSEOptions) {
  const sendStream = useCallback(
    async (
      text: string,
      model: ModelId,
      images: string[],
      sessionId: string = "default",
    ) => {
      const requestBody = JSON.stringify({
        text,
        model,
        images,
        session_id: sessionId,
      });

      async function attemptStream(retryCount: number): Promise<void> {
        try {
          const response = await fetch("/api/voice/stream", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: requestBody,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const body = response.body;
          if (!body) throw new Error("Response body is null");
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          function processLines(text: string) {
            for (const line of text.split("\n")) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                try {
                  const data: ServerMessage = JSON.parse(trimmed.slice(6));
                  if (data.type === "keepalive") continue;
                  onMessage(data);
                } catch (e) {
                  console.error("JSON parse error:", e, trimmed);
                }
              }
            }
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer.trim()) processLines(buffer);
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            processLines(lines.join("\n"));
          }
        } catch (error) {
          if (retryCount < MAX_RETRIES && isNetworkError(error)) {
            const delay = Math.min(1000 * 2 ** retryCount, 8000);
            onRetry(retryCount + 1, delay);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return attemptStream(retryCount + 1);
          }
          onError(error instanceof Error ? error.message : String(error));
        }
      }

      return attemptStream(0);
    },
    [onMessage, onError, onRetry],
  );

  return { sendStream };
}
