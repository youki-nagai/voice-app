import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../../../hooks/use-chat";
import { useGitCommands } from "../../../hooks/use-git-commands";
import { useGitStatus } from "../../../hooks/use-git-status";
import { useSpeechRecognition } from "../../../hooks/use-speech-recognition";
import { useSSE } from "../../../hooks/use-sse";
import { detectGitCommand, detectModelCommand } from "../../../types/git";
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
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string | null>(null);
  const interimIdRef = useRef<string | null>(null);

  const chat = useChat();
  const { gitStatus, gitBranch, checkGitStatus } = useGitStatus();
  const { executeGitCommand } = useGitCommands({
    addMessage: chat.addMessage,
    checkGitStatus,
  });

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "status":
          chat.setProcessingText(msg.text);
          setIsWaitingForAI(true);
          break;
        case "tool_action":
          chat.setProcessingText(null);
          chat.addToolAction(msg.tool, msg.text);
          setIsWaitingForAI(true);
          break;
        case "ai_chunk":
          chat.setProcessingText(null);
          chat.finalizeActionLog();
          chat.appendAiChunk(msg.text);
          break;
        case "ai_done":
          chat.finalizeAiMessage();
          break;
        case "test_result":
          if (msg.success) {
            chat.addMessage(
              `テスト OK (passed: ${msg.passed}, failed: ${msg.failed})`,
              "test-pass",
            );
          } else {
            chat.addMessage(
              `テスト NG (passed: ${msg.passed}, failed: ${msg.failed})\n${msg.output || ""}`,
              "test-fail",
            );
          }
          break;
        case "lint_result":
          chat.addMessage(
            msg.success ? "lint OK" : `lint NG\n${msg.output || ""}`,
            msg.success ? "test-pass" : "test-fail",
          );
          break;
        case "verify_failed":
          chat.addMessage(msg.text, "verify-failed");
          break;
        case "commit":
          chat.addMessage(`committed: ${msg.message}`, "commit");
          break;
        case "complete":
          setIsWaitingForAI(false);
          chat.setProcessingText(null);
          chat.finalizeActionLog();
          break;
        case "error":
          setIsWaitingForAI(false);
          chat.setProcessingText(null);
          chat.finalizeActionLog();
          chat.addMessage(msg.text, "error");
          break;
      }
    },
    [chat],
  );

  const sse = useSSE({
    onMessage: handleServerMessage,
    onError: (error) => {
      setIsWaitingForAI(false);
      chat.setProcessingText(null);
      chat.addMessage(`エラー: ${error}`, "error");
    },
    onRetry: (retryCount, delay) => {
      chat.addMessage(
        `ネットワークエラー。${delay / 1000}秒後にリトライします... (${retryCount}/${3})`,
        "error",
      );
    },
  });

  const sendMessage = useCallback(
    (text: string, skipUserDisplay = false) => {
      if (!text.trim() || isWaitingForAI) return;

      if (!skipUserDisplay) {
        chat.addMessage(text, "user");
      }

      const modelCmd = detectModelCommand(text);
      if (modelCmd) {
        setSelectedModel(modelCmd as ModelId);
        const label = modelCmd.includes("opus") ? "Opus" : "Sonnet";
        chat.addMessage(`モデル切替: ${label}`, "system");
        return;
      }

      const gitAction = detectGitCommand(text);
      if (gitAction) {
        executeGitCommand(gitAction, text);
        return;
      }

      const imageToSend = pendingImageUrl;
      setPendingImageUrl(null);

      chat.setProcessingText("送信中...");
      setIsWaitingForAI(true);
      sse.sendStream(text, selectedModel, imageToSend);
    },
    [
      isWaitingForAI,
      chat,
      selectedModel,
      pendingImageUrl,
      sse,
      executeGitCommand,
    ],
  );

  const handleSpeechComplete = useCallback(
    (transcript: string) => {
      if (interimIdRef.current) {
        setInterimText(null);
        interimIdRef.current = null;
      }
      chat.addMessage(transcript, "user");
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
      chat.addMessage(error, "error");
    },
  });

  const handleMicToggle = useCallback(() => {
    if (speech.isRecording) {
      speech.sendVoiceComplete();
      speech.stopRecording();
    } else {
      speech.startRecording();
    }
  }, [speech]);

  const handleSend = useCallback(() => {
    if (textValue.trim()) {
      sendMessage(textValue);
      setTextValue("");
    }
  }, [textValue, sendMessage]);

  const handleModelChange = useCallback(
    (model: ModelId) => {
      setSelectedModel(model);
      const label = model.includes("opus") ? "Opus" : "Sonnet";
      chat.addMessage(`モデル切替: ${label}`, "system");
    },
    [chat],
  );

  const handleGitStatusClick = useCallback(async () => {
    const detail = await checkGitStatus();
    if (detail) {
      chat.addMessage(detail, "system");
    } else {
      chat.addMessage("Git状態の取得に失敗しました", "error");
    }
  }, [checkGitStatus, chat]);

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
          setPendingImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialization effect - runs once on mount
  useEffect(() => {
    checkGitStatus();
    const timer = setTimeout(() => speech.startRecording(), 500);
    return () => clearTimeout(timer);
  }, []);

  // Visibility change handler
  useEffect(() => {
    let wasRecording = false;
    const handler = () => {
      if (document.hidden) {
        if (speech.isRecording) {
          wasRecording = true;
          speech.stopRecording();
        }
      } else {
        if (wasRecording) {
          wasRecording = false;
          speech.startRecording();
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [speech]);

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
  const displayTimeline: TimelineItem[] = [...chat.timeline];
  if (interimText) {
    displayTimeline.push({
      kind: "message",
      data: { id: "interim", type: "interim", text: interimText },
    });
  }

  return (
    <ChatTemplate
      selectedModel={selectedModel}
      onModelChange={handleModelChange}
      gitStatus={gitStatus}
      gitBranch={gitBranch}
      onGitStatusClick={handleGitStatusClick}
      appStatus={appStatus}
      appStatusText={appStatusText}
      timeline={displayTimeline}
      textValue={textValue}
      onTextChange={setTextValue}
      onSend={handleSend}
      isRecording={speech.isRecording}
      onMicToggle={handleMicToggle}
      silenceTimerText={speech.silenceTimerText}
      isWaitingForAI={isWaitingForAI}
      pendingImageUrl={pendingImageUrl}
      onImagePaste={handleImagePaste}
      onImageRemove={() => setPendingImageUrl(null)}
    />
  );
}
