import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FocusedPanel } from "../../../hooks/use-session-manager";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { CheatSheet } from "../../organisms/cheat-sheet/cheat-sheet";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";
import { ThreadSidebar } from "../../organisms/thread-sidebar/thread-sidebar";

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
  // ThreadSidebar
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onSelectThread: (sessionId: string) => void;
  onSplitThread: (sessionId: string) => void;
  onNewChat: () => string;
  activeSessionId: string;
  secondarySessionId: string | null;
  // Panels
  focusedPanel: FocusedPanel;
  onFocusPanel: (panel: FocusedPanel) => void;
  onUnsplit: () => void;
  // Primary panel
  primary: PanelProps;
  // Secondary panel (split view)
  secondary: PanelProps | null;
}

function ChatPanel({
  panel,
  isFocused,
  onFocus,
  label,
}: {
  panel: PanelProps;
  isFocused: boolean;
  onFocus: () => void;
  label?: string;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: panel focus area
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
        <div className="border-b border-border px-3 py-1 text-[10px] font-bold text-muted-foreground">
          {label}
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

function SplitDivider({ onUnsplit }: { onUnsplit: () => void }) {
  return (
    <div className="group relative flex shrink-0 items-center justify-center">
      <Separator orientation="vertical" />
      <Button
        variant="secondary"
        size="icon"
        className="absolute z-10 h-5 w-5 rounded-full opacity-0 shadow-md group-hover:opacity-100"
        onClick={onUnsplit}
      >
        <X className="h-3 w-3" />
      </Button>
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
      <div className="relative flex flex-1 min-h-0">
        <ThreadSidebar
          isOpen={props.isSidebarOpen}
          onToggle={props.onSidebarToggle}
          onSelectThread={props.onSelectThread}
          onSplitThread={props.onSplitThread}
          onNewChat={props.onNewChat}
          activeSessionId={props.activeSessionId}
          secondarySessionId={props.secondarySessionId}
        />
        <div className="flex flex-1 min-w-0 flex-col">
          {props.secondary ? (
            <div className="flex flex-1 min-h-0">
              <ChatPanel
                panel={props.primary}
                isFocused={props.focusedPanel === "primary"}
                onFocus={() => props.onFocusPanel("primary")}
                label="L"
              />
              <SplitDivider onUnsplit={props.onUnsplit} />
              <ChatPanel
                panel={props.secondary}
                isFocused={props.focusedPanel === "secondary"}
                onFocus={() => props.onFocusPanel("secondary")}
                label="R"
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
        </div>
      </div>
      <CheatSheet
        isOpen={props.isCheatSheetOpen}
        onClose={props.onCheatSheetToggle}
      />
    </>
  );
}
