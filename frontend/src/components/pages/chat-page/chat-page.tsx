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
import type { PanelProps } from "../../templates/chat-template/chat-template";
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

  const executeAppCommand = useCallback(
    async (appCmd: { type: string; [key: string]: unknown }) => {
      const sid = focusedIdRef.current;
      switch (appCmd.type) {
        case "new-session": {
          const newId = sessionManager.addSession();
          chat.addMessage(newId, "新しいチャットを作成しました", "system");
          break;
        }
        case "switch-session": {
          const target =
            appCmd.target === "next" || appCmd.target === "prev"
              ? sessionManager.switchByDirection(
                  appCmd.target as "next" | "prev",
                )
              : sessionManager.switchByIndex((appCmd.target as number) - 1);
          if (target) {
            chat.addMessage(sid, `${target.name} に切り替えました`, "system");
          } else {
            chat.addMessage(sid, "該当するチャットが見つかりません", "error");
          }
          break;
        }
        case "split": {
          const newId = sessionManager.addSession();
          sessionManager.splitSession(newId);
          chat.addMessage(newId, "新しいセッションで分割しました", "system");
          break;
        }
        case "unsplit":
          if (sessionManager.isSplitView) {
            sessionManager.unsplit();
            chat.addMessage(sid, "分割を解除しました", "system");
          } else {
            chat.addMessage(sid, "分割されていません", "system");
          }
          break;
        case "focus-panel": {
          const index = appCmd.index as number;
          if (index >= 1 && index <= sessionManager.panels.length) {
            sessionManager.setFocusedPanelIndex(index - 1);
            chat.addMessage(sid, `パネル${index}にフォーカスしました`, "system");
          } else {
            chat.addMessage(sid, `パネル${index}は存在しません`, "error");
          }
          break;
        }
        case "close-panel": {
          if (sessionManager.panels.length <= 1) {
            chat.addMessage(sid, "最後のパネルは閉じられません", "system");
          } else {
            const closeIndex = appCmd.index !== undefined
              ? (appCmd.index as number) - 1
              : sessionManager.focusedPanelIndex;
            if (closeIndex >= 0 && closeIndex < sessionManager.panels.length) {
              sessionManager.removePanel(closeIndex);
              chat.addMessage(sid, `パネル${closeIndex + 1}を閉じました`, "system");
            } else {
              chat.addMessage(sid, `パネル${appCmd.index ?? 0}は存在しません`, "error");
            }
          }
          break;
        }
        case "select-thread": {
          try {
            const res = await fetch("/api/voice/threads");
            if (res.ok) {
              const threads: Array<{ session_id: string; title: string | null }> = await res.json();
              const target = threads[(appCmd.index as number) - 1];
              if (target) {
                await handleSelectThread(target.session_id);
                chat.addMessage(
                  focusedIdRef.current,
                  `スレッド「${target.title || "無題"}」を選択しました`,
                  "system",
                );
              } else {
                chat.addMessage(sid, `スレッド${appCmd.index}が見つかりません`, "error");
              }
            }
          } catch {
            chat.addMessage(sid, "スレッド一覧の取得に失敗しました", "error");
          }
          break;
        }
        case "toggle-cheat-sheet":
          toggleCheatSheet();
          break;
        case "set-silence-delay":
          handleSilenceDelayChange(appCmd.seconds as number);
          chat.addMessage(
            sid,
            `沈黙時間を${appCmd.seconds}秒に変更しました`,
            "system",
          );
          break;
      }
    },
    [chat, sessionManager, toggleCheatSheet, handleSilenceDelayChange, handleSelectThread],
  );

  const handleAppCommand = useCallback(
    async (text: string): Promise<boolean> => {
      const modelCmd = detectModelCommand(text);
      if (modelCmd) {
        switchModel(modelCmd);
        return true;
      }

      const appCmd = detectAppCommand(text);
      if (!appCmd) return false;

      await executeAppCommand(appCmd);
      return true;
    },
    [switchModel, executeAppCommand],
  );

  const handleBackendCommand = useCallback(
    (commandType: "model" | "app", command: Record<string, unknown>) => {
      if (commandType === "model") {
        switchModel(command.model_id as ModelId);
      } else {
        executeAppCommand(command as { type: string; [key: string]: unknown });
      }
    },
    [switchModel, executeAppCommand],
  );

  const stream = useChatStream({
    chat,
    getActiveSessionId: getFocusedSessionId,
    onCommand: handleBackendCommand,
  });

  const sendMessage = useCallback(
    async (text: string, images: string[] = [], skipUserDisplay = false) => {
      const sid = focusedIdRef.current;
      if (!text.trim() || chat.getIsWaitingForAI(sid)) return;

      if (!skipUserDisplay) {
        chat.addMessage(sid, text, "user", images[0]);
      }

      if (await handleAppCommand(text)) return;

      stream.send(text, selectedModel, images, sid);
    },
    [chat, selectedModel, stream, handleAppCommand],
  );

  const handlePanelSend = useCallback(
    (panelIndex: number, text: string, images: string[]) => {
      const sessionId = sessionManager.panels[panelIndex];
      if (!sessionId) return;

      sessionManager.setFocusedPanelIndex(panelIndex);
      focusedIdRef.current = sessionId;
      sendMessage(text, images);
    },
    [sendMessage, sessionManager],
  );

  const handleSpeechComplete = useCallback(
    (transcript: string) => {
      setInterimText(null);
      chat.addMessage(focusedIdRef.current, transcript, "user");
      sendMessage(transcript, [], true);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialization effect - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => speech.setRecordingEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

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

  const panelPropsList: PanelProps[] = sessionManager.panels.map(
    (sessionId, index) => {
      const isFocused =
        !sessionManager.isSplitView ||
        sessionManager.focusedPanelIndex === index;

      return {
        sessionId,
        timeline: buildTimeline(sessionId, isFocused),
        onSend: (text: string, images: string[]) =>
          handlePanelSend(index, text, images),
        isRecording:
          speech.isRecording && sessionManager.focusedPanelIndex === index,
        onMicToggle: handleMicToggle,
        silenceState:
          sessionManager.focusedPanelIndex === index
            ? speech.silenceState
            : "idle",
        countdownKey: speech.countdownKey,
        isWaitingForAI: chat.getIsWaitingForAI(sessionId),
        silenceDelaySeconds,
        onSilenceDelayChange: handleSilenceDelayChange,
      };
    },
  );

  return (
    <ChatTemplate
      selectedModel={selectedModel}
      onModelChange={switchModel}
      appStatus={appStatus}
      appStatusText={appStatusText}
      isCheatSheetOpen={isCheatSheetOpen}
      onCheatSheetToggle={toggleCheatSheet}
      focusedPanelIndex={sessionManager.focusedPanelIndex}
      onFocusPanel={sessionManager.setFocusedPanelIndex}
      onRemovePanel={sessionManager.removePanel}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={toggleSidebar}
      onSelectThread={handleSelectThread}
      onSplitThread={sessionManager.splitSession}
      onNewChat={sessionManager.addSession}
      panelSessionIds={sessionManager.panels}
      panels={panelPropsList}
    />
  );
}
