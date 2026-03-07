import { Fragment, useCallback, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SilenceState } from "../../../hooks/use-speech-recognition";
import type { ModelId, TimelineItem } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { ChatArea } from "../../organisms/chat-area/chat-area";
import { CheatSheet } from "../../organisms/cheat-sheet/cheat-sheet";
import { ControlBar } from "../../organisms/control-bar/control-bar";
import { Header } from "../../organisms/header/header";
import { ThreadSidebar } from "../../organisms/thread-sidebar/thread-sidebar";

export interface PanelProps {
  sessionId: string;
  timeline: TimelineItem[];
  onSend: (text: string, images: string[]) => void;
  isRecording: boolean;
  onMicToggle: () => void;
  silenceState: SilenceState;
  countdownKey: number;
  isWaitingForAI: boolean;
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
  panelSessionIds: string[];
  // Panels
  focusedPanelIndex: number;
  onFocusPanel: (index: number) => void;
  onRemovePanel: (index: number) => void;
  panels: PanelProps[];
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
  const [textValue, setTextValue] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const handleSend = useCallback(() => {
    if (!textValue.trim()) return;
    panel.onSend(textValue, pendingImages);
    setTextValue("");
    setPendingImages([]);
  }, [textValue, pendingImages, panel]);

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
          setPendingImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

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
        textValue={textValue}
        onTextChange={setTextValue}
        onSend={handleSend}
        isRecording={panel.isRecording}
        onMicToggle={panel.onMicToggle}
        silenceState={panel.silenceState}
        countdownKey={panel.countdownKey}
        isWaitingForAI={panel.isWaitingForAI}
        pendingImageUrls={pendingImages}
        onImagePaste={handleImagePaste}
        onImageRemove={(index) =>
          setPendingImages((prev) => prev.filter((_, i) => i !== index))
        }
        silenceDelaySeconds={panel.silenceDelaySeconds}
        onSilenceDelayChange={panel.onSilenceDelayChange}
      />
    </div>
  );
}

export function ChatTemplate(props: ChatTemplateProps) {
  const isSplit = props.panels.length > 1;

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
          panelSessionIds={props.panelSessionIds}
        />
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex flex-1 min-h-0">
            {props.panels.map((panel, index) => (
              <Fragment key={panel.sessionId}>
                {index > 0 && <Separator orientation="vertical" />}
                <ChatPanel
                  panel={panel}
                  isFocused={isSplit ? props.focusedPanelIndex === index : true}
                  onFocus={() => props.onFocusPanel(index)}
                  label={isSplit ? String(index + 1) : undefined}
                  onClose={
                    isSplit ? () => props.onRemovePanel(index) : undefined
                  }
                />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <CheatSheet
        isOpen={props.isCheatSheetOpen}
        onClose={props.onCheatSheetToggle}
      />
    </TooltipProvider>
  );
}
