import type { FocusedPanel, Session } from "../../../hooks/use-session-manager";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { CheatSheet } from "../../organisms/cheat-sheet/cheat-sheet";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";
import { SessionTabs } from "../../organisms/session-tabs/session-tabs";

interface PanelProps {
  timeline: TimelineItem[];
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
  silenceDelaySeconds: number;
  onSilenceDelayChange: (seconds: number) => void;
}

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
  secondarySessionId: string | null;
  isSplitView: boolean;
  focusedPanel: FocusedPanel;
  onSelectSession: (id: string) => void;
  onAddSession: () => string;
  onRemoveSession: (id: string) => void;
  onSplitSession: (id: string) => void;
  onUnsplit: () => void;
  onFocusPanel: (panel: FocusedPanel) => void;
  waitingSessionIds: string[];
  // Primary panel
  primary: PanelProps;
  // Secondary panel (split view)
  secondary: PanelProps | null;
}

function ChatPanel({
  panel,
  label,
  isFocused,
  onFocus,
}: {
  panel: PanelProps;
  label?: string;
  isFocused: boolean;
  onFocus: () => void;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${
        isFocused ? "ring-1 ring-accent/50 ring-inset" : ""
      }`}
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter") onFocus();
      }}
    >
      {label && (
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-1 text-[10px] text-muted-foreground">
          <span>{label}</span>
        </div>
      )}
      <ChatArea timeline={panel.timeline} />
      <ControlBar
        textValue={panel.textValue}
        onTextChange={panel.onTextChange}
        onSend={panel.onSend}
        isRecording={panel.isRecording}
        onMicToggle={panel.onMicToggle}
        silenceTimerText={panel.silenceTimerText}
        isWaitingForAI={panel.isWaitingForAI}
        pendingImageUrls={panel.pendingImageUrls}
        onImagePaste={panel.onImagePaste}
        onImageRemove={panel.onImageRemove}
        silenceDelaySeconds={panel.silenceDelaySeconds}
        onSilenceDelayChange={panel.onSilenceDelayChange}
      />
    </div>
  );
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
        secondarySessionId={props.secondarySessionId}
        isSplitView={props.isSplitView}
        onSelectSession={props.onSelectSession}
        onAddSession={props.onAddSession}
        onRemoveSession={props.onRemoveSession}
        onSplitSession={props.onSplitSession}
        onUnsplit={props.onUnsplit}
        waitingSessionIds={props.waitingSessionIds}
      />
      {props.isSplitView && props.secondary ? (
        <div className="flex flex-1 min-h-0">
          <ChatPanel
            panel={props.primary}
            isFocused={props.focusedPanel === "primary"}
            onFocus={() => props.onFocusPanel("primary")}
          />
          <div className="w-px bg-border" />
          <ChatPanel
            panel={props.secondary}
            isFocused={props.focusedPanel === "secondary"}
            onFocus={() => props.onFocusPanel("secondary")}
          />
        </div>
      ) : (
        <>
          <ChatArea timeline={props.primary.timeline} />
          <ControlBar
            textValue={props.primary.textValue}
            onTextChange={props.primary.onTextChange}
            onSend={props.primary.onSend}
            isRecording={props.primary.isRecording}
            onMicToggle={props.primary.onMicToggle}
            silenceTimerText={props.primary.silenceTimerText}
            isWaitingForAI={props.primary.isWaitingForAI}
            pendingImageUrls={props.primary.pendingImageUrls}
            onImagePaste={props.primary.onImagePaste}
            onImageRemove={props.primary.onImageRemove}
            silenceDelaySeconds={props.primary.silenceDelaySeconds}
            onSilenceDelayChange={props.primary.onSilenceDelayChange}
          />
        </>
      )}
      <CheatSheet
        isOpen={props.isCheatSheetOpen}
        onClose={props.onCheatSheetToggle}
      />
    </>
  );
}
