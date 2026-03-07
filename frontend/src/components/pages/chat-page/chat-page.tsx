import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStream } from "../../../hooks/use-chat-stream";
import { useKeyboardShortcut } from "../../../hooks/use-keyboard-shortcut";
import { useMultiChat } from "../../../hooks/use-multi-chat";
import { useSessionManager } from "../../../hooks/use-session-manager";
import {
  DEFAULT_SILENCE_DELAY,
  useSpeechRecognition,
} from "../../../hooks/use-speech-recognition";
import {
  detectAppCommand,
  detectModelCommand,
  getModelLabel,
} from "../../../types/commands";
import type {
  ChatMessageType,
  ModelId,
  TimelineItem,
  ToolAction,
} from "../../../types/messages";
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
  const [primaryTextValue, setPrimaryTextValue] = useState("");
  const [secondaryTextValue, setSecondaryTextValue] = useState("");
  const [primaryPendingImages, setPrimaryPendingImages] = useState<string[]>(
    [],
  );
  const [secondaryPendingImages, setSecondaryPendingImages] = useState<
    string[]
  >([]);
  const [interimText, setInterimText] = useState<string | null>(null);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [silenceDelayMs, setSilenceDelayMs] = useState(DEFAULT_SILENCE_DELAY);

  const silenceDelaySeconds = silenceDelayMs / 1000;
  const handleSilenceDelayChange = useCallback((seconds: number) => {
    setSilenceDelayMs(seconds * 1000);
  }, []);

  const toggleCheatSheet = useCallback(() => {
    setIsCheatSheetOpen((prev) => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  useKeyboardShortcut("/", toggleCheatSheet, { meta: true });

  const sessionManager = useSessionManager();
  const chat = useMultiChat();
  const focusedIdRef = useRef(sessionManager.focusedSessionId);
  focusedIdRef.current = sessionManager.focusedSessionId;

  const getFocusedSessionId = useCallback(() => focusedIdRef.current, []);

  const stream = useChatStream({
    chat,
    getActiveSessionId: getFocusedSessionId,
  });

  const switchModel = useCallback(
    (model: ModelId) => {
      setSelectedModel(model);
      chat.addMessage(
        focusedIdRef.current,
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

      const sid = focusedIdRef.current;
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
        case "set-silence-delay":
          handleSilenceDelayChange(appCmd.seconds);
          chat.addMessage(
            sid,
            `沈黙時間を${appCmd.seconds}秒に変更しました`,
            "system",
          );
          return true;
      }
    },
    [
      chat,
      sessionManager,
      switchModel,
      toggleCheatSheet,
      handleSilenceDelayChange,
    ],
  );

  const sendMessage = useCallback(
    (text: string, skipUserDisplay = false) => {
      const sid = focusedIdRef.current;
      if (!text.trim() || chat.getIsWaitingForAI(sid)) return;

      const isFocusedOnSecondary =
        sessionManager.focusedPanel === "secondary" &&
        sessionManager.secondarySessionId !== null;
      const pendingImages = isFocusedOnSecondary
        ? secondaryPendingImages
        : primaryPendingImages;
      const setPendingImages = isFocusedOnSecondary
        ? setSecondaryPendingImages
        : setPrimaryPendingImages;

      const imagesToSend = [...pendingImages];
      setPendingImages([]);

      if (!skipUserDisplay) {
        chat.addMessage(sid, text, "user", imagesToSend[0]);
      }

      if (handleAppCommand(text)) return;

      stream.send(text, selectedModel, imagesToSend, sid);
    },
    [
      chat,
      selectedModel,
      primaryPendingImages,
      secondaryPendingImages,
      sessionManager.focusedPanel,
      sessionManager.secondarySessionId,
      stream,
      handleAppCommand,
    ],
  );

  const handleSpeechComplete = useCallback(
    (transcript: string) => {
      setInterimText(null);
      chat.addMessage(focusedIdRef.current, transcript, "user");
      sendMessage(transcript, true);
    },
    [chat, sendMessage],
  );

  const speech = useSpeechRecognition({
    onSpeechComplete: handleSpeechComplete,
    onInterimUpdate: (text) => setInterimText(text),
    onError: (error) => chat.addMessage(focusedIdRef.current, error, "error"),
    silenceDelay: silenceDelayMs,
  });

  const handleMicToggle = useCallback(() => {
    speech.setRecordingEnabled(!speech.isRecording);
  }, [speech]);

  const handlePrimarySend = useCallback(() => {
    if (primaryTextValue.trim()) {
      sessionManager.setFocusedPanel("primary");
      focusedIdRef.current = sessionManager.activeSessionId;
      sendMessage(primaryTextValue);
      setPrimaryTextValue("");
    }
  }, [primaryTextValue, sendMessage, sessionManager]);

  const handleSecondarySend = useCallback(() => {
    if (secondaryTextValue.trim() && sessionManager.secondarySessionId) {
      sessionManager.setFocusedPanel("secondary");
      focusedIdRef.current = sessionManager.secondarySessionId;
      sendMessage(secondaryTextValue);
      setSecondaryTextValue("");
    }
  }, [secondaryTextValue, sendMessage, sessionManager]);

  const handleImagePaste = useCallback(
    (
      e: React.ClipboardEvent,
      setPendingImages: React.Dispatch<React.SetStateAction<string[]>>,
    ) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setPendingImages((prev) => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    },
    [],
  );

  const handleSelectThread = useCallback(
    async (sessionId: string) => {
      const existingSession = sessionManager.sessions.find(
        (s) => s.id === sessionId,
      );
      if (existingSession) {
        sessionManager.selectSession(sessionId);
        return;
      }

      try {
        const res = await fetch(
          `/api/voice/threads/${encodeURIComponent(sessionId)}/messages`,
        );
        if (!res.ok) return;

        const messages: Array<{
          role: string;
          text: string;
          tool_actions: Array<{ tool: string; text: string }> | null;
        }> = await res.json();

        const timeline: TimelineItem[] = [];
        let msgId = 0;
        for (const msg of messages) {
          const type: ChatMessageType =
            msg.role === "ai"
              ? "ai"
              : msg.role === "user"
                ? "user"
                : msg.role === "error"
                  ? "error"
                  : "system";
          timeline.push({
            kind: "message",
            data: { id: `restored-${++msgId}`, type, text: msg.text },
          });
          if (msg.tool_actions && msg.tool_actions.length > 0) {
            const actions: ToolAction[] = msg.tool_actions.map((a) => ({
              tool: a.tool,
              text: a.text,
              status: "done" as const,
            }));
            timeline.push({
              kind: "action-log",
              data: {
                id: `restored-action-${++msgId}`,
                status: "done",
                actions,
              },
            });
          }
        }

        sessionManager.addSessionWithId(sessionId);
        chat.setTimeline(sessionId, timeline);
      } catch {
        // silently fail
      }
    },
    [sessionManager, chat],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialization effect - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => speech.setRecordingEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const activeId = sessionManager.activeSessionId;
  const secondaryId = sessionManager.secondarySessionId;
  const focusedId = sessionManager.focusedSessionId;
  const isWaitingForAI = chat.getIsWaitingForAI(focusedId);
  const { status: appStatus, text: appStatusText } = computeAppStatus(
    isWaitingForAI,
    speech.isRecording,
  );

  const buildTimeline = (
    sessionId: string,
    showInterim: boolean,
  ): TimelineItem[] => {
    const timeline: TimelineItem[] = [...chat.getTimeline(sessionId)];
    if (showInterim && interimText) {
      timeline.push({
        kind: "message",
        data: { id: "interim", type: "interim", text: interimText },
      });
    }
    return timeline;
  };

  const primaryTimeline = buildTimeline(
    activeId,
    sessionManager.focusedPanel === "primary" || !sessionManager.isSplitView,
  );

  const secondaryTimeline = secondaryId
    ? buildTimeline(secondaryId, sessionManager.focusedPanel === "secondary")
    : [];

  return (
    <ChatTemplate
      selectedModel={selectedModel}
      onModelChange={switchModel}
      appStatus={appStatus}
      appStatusText={appStatusText}
      isCheatSheetOpen={isCheatSheetOpen}
      onCheatSheetToggle={toggleCheatSheet}
      focusedPanel={sessionManager.focusedPanel}
      onFocusPanel={sessionManager.setFocusedPanel}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={toggleSidebar}
      onSelectThread={handleSelectThread}
      onNewChat={sessionManager.addSession}
      activeSessionId={activeId}
      primary={{
        timeline: primaryTimeline,
        textValue: primaryTextValue,
        onTextChange: setPrimaryTextValue,
        onSend: handlePrimarySend,
        isRecording:
          speech.isRecording && sessionManager.focusedPanel === "primary",
        onMicToggle: handleMicToggle,
        silenceTimerText:
          sessionManager.focusedPanel === "primary"
            ? speech.silenceTimerText
            : "",
        isWaitingForAI: chat.getIsWaitingForAI(activeId),
        pendingImageUrls: primaryPendingImages,
        onImagePaste: (e) => handleImagePaste(e, setPrimaryPendingImages),
        onImageRemove: (index) =>
          setPrimaryPendingImages((prev) => prev.filter((_, i) => i !== index)),
        silenceDelaySeconds,
        onSilenceDelayChange: handleSilenceDelayChange,
      }}
      secondary={
        secondaryId
          ? {
              timeline: secondaryTimeline,
              textValue: secondaryTextValue,
              onTextChange: setSecondaryTextValue,
              onSend: handleSecondarySend,
              isRecording:
                speech.isRecording &&
                sessionManager.focusedPanel === "secondary",
              onMicToggle: handleMicToggle,
              silenceTimerText:
                sessionManager.focusedPanel === "secondary"
                  ? speech.silenceTimerText
                  : "",
              isWaitingForAI: chat.getIsWaitingForAI(secondaryId),
              pendingImageUrls: secondaryPendingImages,
              onImagePaste: (e) =>
                handleImagePaste(e, setSecondaryPendingImages),
              onImageRemove: (index) =>
                setSecondaryPendingImages((prev) =>
                  prev.filter((_, i) => i !== index),
                ),
              silenceDelaySeconds,
              onSilenceDelayChange: handleSilenceDelayChange,
            }
          : null
      }
    />
  );
}
