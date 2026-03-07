import type { Session } from "../../../hooks/use-session-manager";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { CheatSheet } from "../../organisms/cheat-sheet/cheat-sheet";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";
import { SessionTabs } from "../../organisms/session-tabs/session-tabs";

interface ChatTemplateProps {
  // Header
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  appStatus: StatusDotStatus;
  appStatusText: string;
  // CheatSheet
  isCheatSheetOpen: boolean;
  onCheatSheetToggle: () => void;
  // SessionTabs
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onAddSession: () => string;
  onRemoveSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  waitingSessionIds: string[];
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
  pendingImageUrls: string[];
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageRemove: (index: number) => void;
}

export function ChatTemplate(props: ChatTemplateProps) {
  return (
    <>
      <Header
        selectedModel={props.selectedModel}
        onModelChange={props.onModelChange}
        appStatus={props.appStatus}
        appStatusText={props.appStatusText}
        onHelpToggle={props.onCheatSheetToggle}
      />
      <SessionTabs
        sessions={props.sessions}
        activeSessionId={props.activeSessionId}
        onSelectSession={props.onSelectSession}
        onAddSession={props.onAddSession}
        onRemoveSession={props.onRemoveSession}
        onRenameSession={props.onRenameSession}
        waitingSessionIds={props.waitingSessionIds}
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
        pendingImageUrls={props.pendingImageUrls}
        onImagePaste={props.onImagePaste}
        onImageRemove={props.onImageRemove}
      />
      <CheatSheet
        isOpen={props.isCheatSheetOpen}
        onClose={props.onCheatSheetToggle}
      />
    </>
  );
}
