import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyboardShortcut } from "../../../hooks/use-keyboard-shortcut";
import { useMultiChat } from "../../../hooks/use-multi-chat";
import { useSessionManager } from "../../../hooks/use-session-manager";
import { useSpeechRecognition } from "../../../hooks/use-speech-recognition";
import { useSSE } from "../../../hooks/use-sse";
import { detectModelCommand, getModelLabel } from "../../../types/commands";
import type {
  ModelId,
  ServerMessage,
  TimelineItem,
} from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatTemplate } from "../../templates/chat-template/chat-template";

export function ChatPage() {
  const [selectedModel, setSelectedModel] =
    useState<ModelId>("claude-opus-4-6");
  const [textValue, setTextValue] = useState("");
  const [pendingImageUrls, setPendingImageUrls] = useState<string[]>([]);
  const [interimText, setInterimText] = useState<string | null>(null);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  const toggleCheatSheet = useCallback(() => {
    setIsCheatSheetOpen((prev) => !prev);
  }, []);

  useKeyboardShortcut("/", toggleCheatSheet, { meta: true });

  const sessionManager = useSessionManager();
  const chat = useMultiChat();
  const activeIdRef = useRef(sessionManager.activeSessionId);
  activeIdRef.current = sessionManager.activeSessionId;
  const sendingSessionIdRef = useRef<string | null>(null);

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      const sid = sendingSessionIdRef.current ?? activeIdRef.current;
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
        case "test_result":
          if (msg.success) {
            chat.addMessage(
              sid,
              `テスト OK (passed: ${msg.passed}, failed: ${msg.failed})`,
              "test-pass",
            );
          } else {
            chat.addMessage(
              sid,
              `テスト NG (passed: ${msg.passed}, failed: ${msg.failed})\n${msg.output || ""}`,
              "test-fail",
            );
          }
          break;
        case "lint_result":
          chat.addMessage(
            sid,
            msg.success ? "lint OK" : `lint NG\n${msg.output || ""}`,
            msg.success ? "test-pass" : "test-fail",
          );
          break;
        case "verify_failed":
          chat.addMessage(sid, msg.text, "verify-failed");
          break;
        case "complete":
          chat.setIsWaitingForAI(sid, false);
          chat.setProcessingText(sid, null);
          chat.finalizeActionLog(sid);
          sendingSessionIdRef.current = null;
          break;
        case "error":
          chat.setIsWaitingForAI(sid, false);
          chat.setProcessingText(sid, null);
          chat.finalizeActionLog(sid);
          chat.addMessage(sid, msg.text, "error");
          sendingSessionIdRef.current = null;
          break;
      }
    },
    [chat],
  );

  const sse = useSSE({
    onMessage: handleServerMessage,
    onError: (error) => {
      const sid = sendingSessionIdRef.current ?? activeIdRef.current;
      chat.setIsWaitingForAI(sid, false);
      chat.setProcessingText(sid, null);
      chat.addMessage(sid, `エラー: ${error}`, "error");
      sendingSessionIdRef.current = null;
    },
    onRetry: (retryCount, delay) => {
      const sid = sendingSessionIdRef.current ?? activeIdRef.current;
      chat.addMessage(
        sid,
        `ネットワークエラー。${delay / 1000}秒後にリトライします... (${retryCount}/${3})`,
        "error",
      );
    },
  });

  const switchModel = useCallback(
    (model: ModelId) => {
      const sid = activeIdRef.current;
      setSelectedModel(model);
      chat.addMessage(sid, `モデル切替: ${getModelLabel(model)}`, "system");
    },
    [chat],
  );

  const sendMessage = useCallback(
    (text: string, skipUserDisplay = false) => {
      const sid = activeIdRef.current;
      if (!text.trim() || chat.getIsWaitingForAI(sid)) return;

      const imagesToSend = [...pendingImageUrls];
      setPendingImageUrls([]);

      if (!skipUserDisplay) {
        chat.addMessage(sid, text, "user", imagesToSend[0]);
      }

      const modelCmd = detectModelCommand(text);
      if (modelCmd) {
        switchModel(modelCmd);
        return;
      }

      chat.setProcessingText(sid, "送信中...");
      chat.setIsWaitingForAI(sid, true);
      sendingSessionIdRef.current = sid;
      sse.sendStream(text, selectedModel, imagesToSend, sid);
    },
    [chat, selectedModel, pendingImageUrls, sse, switchModel],
  );

  const handleSpeechComplete = useCallback(
    (transcript: string) => {
      const sid = activeIdRef.current;
      setInterimText(null);
      chat.addMessage(sid, transcript, "user");
      sendMessage(transcript, true);
    },
    [chat, sendMessage],
  );

  const speech = useSpeechRecognition({
    onSpeechComplete: handleSpeechComplete,
    onInterimUpdate: (text) => {
      setInterimText(text);
    },
    onError: (error) => {
      const sid = activeIdRef.current;
      chat.addMessage(sid, error, "error");
    },
  });

  const handleMicToggle = useCallback(() => {
    speech.setRecordingEnabled(!speech.isRecording);
  }, [speech]);

  const handleSend = useCallback(() => {
    if (textValue.trim()) {
      sendMessage(textValue);
      setTextValue("");
    }
  }, [textValue, sendMessage]);

  const handleImagePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setPendingImageUrls((prev) => [
            ...prev,
            reader.result as string,
          ]);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  const handleRemoveSession = useCallback(
    (id: string) => {
      sessionManager.removeSession(id);
      chat.removeSessionData(id);
    },
    [sessionManager, chat],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialization effect - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => speech.setRecordingEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const activeId = sessionManager.activeSessionId;
  const isWaitingForAI = chat.getIsWaitingForAI(activeId);

  // Compute app status
  let appStatus: StatusDotStatus = "connected";
  let appStatusText = "準備完了";
  if (isWaitingForAI) {
    appStatus = "processing";
    appStatusText = "AI処理中";
  } else if (speech.isRecording) {
    appStatus = "recording";
    appStatusText = "録音中";
  }

  // Build display timeline with interim text appended
  const displayTimeline: TimelineItem[] = [
    ...chat.getTimeline(activeId),
  ];
  if (interimText) {
    displayTimeline.push({
      kind: "message",
      data: { id: "interim", type: "interim", text: interimText },
    });
  }

  // Collect session IDs that are waiting for AI
  const waitingSessionIds = sessionManager.sessions
    .filter((s) => chat.getIsWaitingForAI(s.id))
    .map((s) => s.id);

  return (
    <ChatTemplate
      selectedModel={selectedModel}
      onModelChange={switchModel}
      appStatus={appStatus}
      appStatusText={appStatusText}
      isCheatSheetOpen={isCheatSheetOpen}
      onCheatSheetToggle={toggleCheatSheet}
      timeline={displayTimeline}
      textValue={textValue}
      onTextChange={setTextValue}
      onSend={handleSend}
      isRecording={speech.isRecording}
      onMicToggle={handleMicToggle}
      silenceTimerText={speech.silenceTimerText}
      isWaitingForAI={isWaitingForAI}
      pendingImageUrls={pendingImageUrls}
      onImagePaste={handleImagePaste}
      onImageRemove={(index) =>
        setPendingImageUrls((prev) => prev.filter((_, i) => i !== index))
      }
      sessions={sessionManager.sessions}
      activeSessionId={activeId}
      onSelectSession={sessionManager.setActiveSession}
      onAddSession={sessionManager.addSession}
      onRemoveSession={handleRemoveSession}
      onRenameSession={sessionManager.renameSession}
      waitingSessionIds={waitingSessionIds}
    />
  );
}
