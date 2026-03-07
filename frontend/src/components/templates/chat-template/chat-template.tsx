import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { FocusedPanel } from "../../../hooks/use-session-manager";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { CheatSheet } from "../../organisms/cheat-sheet/cheat-sheet";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";
import { ThreadSidebar } from "../../organisms/thread-sidebar/thread-sidebar";

export interface PanelProps {
  timeline: TimelineItem[];
  textValue: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
  isRecording: boolean;
  onMicToggle: () => void;
  silenceState: import("../../../hooks/use-speech-recognition").SilenceState;
  countdownKey: number;
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
  onClose,
}: {
  panel: PanelProps;
  isFocused: boolean;
  onFocus: () => void;
  label?: string;
  onClose?: () => void;
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
        <div className="flex items-center justify-between border-b border-border px-3 py-1">
          <span className="text-[10px] font-bold text-muted-foreground">
            {label}
          </span>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      <ChatArea timeline={panel.timeline} />
      <ControlBar
        textValue={panel.textValue}
        onTextChange={panel.onTextChange}
        onSend={panel.onSend}
        isRecording={panel.isRecording}
        onMicToggle={panel.onMicToggle}
        silenceState={panel.silenceState}
        countdownKey={panel.countdownKey}
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
    <TooltipProvider>
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
              <Separator orientation="vertical" />
              <ChatPanel
                panel={props.secondary}
                isFocused={props.focusedPanel === "secondary"}
                onFocus={() => props.onFocusPanel("secondary")}
                label="R"
                onClose={props.onUnsplit}
              />
            </div>
          ) : (
            <ChatPanel
              panel={props.primary}
              isFocused={true}
              onFocus={() => {}}
            />
          )}
        </div>
      </div>
      <CheatSheet
        isOpen={props.isCheatSheetOpen}
        onClose={props.onCheatSheetToggle}
      />
    </TooltipProvider>
  );
}
