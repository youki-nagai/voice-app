import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStream } from "../../../hooks/use-chat-stream";
import { useKeyboardShortcut } from "../../../hooks/use-keyboard-shortcut";
import { useMultiChat } from "../../../hooks/use-multi-chat";
import { useSessionManager } from "../../../hooks/use-session-manager";
import { useSpeechRecognition } from "../../../hooks/use-speech-recognition";
import {
  detectAppCommand,
  detectModelCommand,
  getModelLabel,
} from "../../../types/commands";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatTemplate } from "../../templates/chat-template/chat-template";

function computeAppStatus(
  isWaitingForAI: boolean,
  isRecording: boolean,
): { status: StatusDotStatus; text: string } {
  if (isWaitingForAI) return { status: "processing", text: "AI処理中" };
  if (isRecording) return { status: "recording", text: "録音中" };
  return { status: "connected", text: "準備完了" };
}

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

  const getActiveSessionId = useCallback(() => activeIdRef.current, []);

  const stream = useChatStream({ chat, getActiveSessionId });

  const switchModel = useCallback(
    (model: ModelId) => {
      setSelectedModel(model);
      chat.addMessage(
        activeIdRef.current,
        `モデル切替: ${getModelLabel(model)}`,
        "system",
      );
    },
    [chat],
  );

  const handleAppCommand = useCallback(
    (text: string): boolean => {
      const modelCmd = detectModelCommand(text);
      if (modelCmd) {
        switchModel(modelCmd);
        return true;
      }

      const appCmd = detectAppCommand(text);
      if (!appCmd) return false;

      const sid = activeIdRef.current;
      switch (appCmd.type) {
        case "new-session": {
          const newId = sessionManager.addSession();
          chat.addMessage(newId, "新しいチャットを作成しました", "system");
          return true;
        }
        case "switch-session": {
          const target =
            appCmd.target === "next" || appCmd.target === "prev"
              ? sessionManager.switchByDirection(appCmd.target)
              : sessionManager.switchByIndex(appCmd.target - 1);
          if (target) {
            chat.addMessage(sid, `${target.name} に切り替えました`, "system");
          } else {
            chat.addMessage(sid, "該当するチャットが見つかりません", "error");
          }
          return true;
        }
        case "toggle-cheat-sheet":
          toggleCheatSheet();
          return true;
      }
    },
    [chat, sessionManager, switchModel, toggleCheatSheet],
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

      if (handleAppCommand(text)) return;

      stream.send(text, selectedModel, imagesToSend, sid);
    },
    [chat, selectedModel, pendingImageUrls, stream, handleAppCommand],
  );

  const handleSpeechComplete = useCallback(
    (transcript: string) => {
      setInterimText(null);
      chat.addMessage(activeIdRef.current, transcript, "user");
      sendMessage(transcript, true);
    },
    [chat, sendMessage],
  );

  const speech = useSpeechRecognition({
    onSpeechComplete: handleSpeechComplete,
    onInterimUpdate: (text) => setInterimText(text),
    onError: (error) => chat.addMessage(activeIdRef.current, error, "error"),
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
          setPendingImageUrls((prev) => [...prev, reader.result as string]);
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
  const { status: appStatus, text: appStatusText } = computeAppStatus(
    isWaitingForAI,
    speech.isRecording,
  );

  const displayTimeline: TimelineItem[] = [...chat.getTimeline(activeId)];
  if (interimText) {
    displayTimeline.push({
      kind: "message",
      data: { id: "interim", type: "interim", text: interimText },
    });
  }

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
      waitingSessionIds={waitingSessionIds}
    />
  );
}
