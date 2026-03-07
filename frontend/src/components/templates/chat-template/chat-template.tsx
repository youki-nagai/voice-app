import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import type { GitBadgeStatus } from "../../molecules/git-status-badge/git-status-badge";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";

interface ChatTemplateProps {
  // Header
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  gitStatus: GitBadgeStatus;
  gitBranch: string;
  onGitStatusClick: () => void;
  appStatus: StatusDotStatus;
  appStatusText: string;
  // ChatArea
  timeline: TimelineItem[];
  // ControlBar
  textValue: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
  isRecording: boolean;
  onMicToggle: () => void;
  silenceTimerText: string;
  isWaitingForAI: boolean;
  pendingImageUrl: string | null;
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageRemove: () => void;
}

export function ChatTemplate(props: ChatTemplateProps) {
  return (
    <>
      <Header
        selectedModel={props.selectedModel}
        onModelChange={props.onModelChange}
        gitStatus={props.gitStatus}
        gitBranch={props.gitBranch}
        onGitStatusClick={props.onGitStatusClick}
        appStatus={props.appStatus}
        appStatusText={props.appStatusText}
      />
      <ChatArea timeline={props.timeline} />
      <ControlBar
        textValue={props.textValue}
        onTextChange={props.onTextChange}
        onSend={props.onSend}
        isRecording={props.isRecording}
        onMicToggle={props.onMicToggle}
        silenceTimerText={props.silenceTimerText}
        isWaitingForAI={props.isWaitingForAI}
        pendingImageUrl={props.pendingImageUrl}
        onImagePaste={props.onImagePaste}
        onImageRemove={props.onImageRemove}
      />
    </>
  );
}
