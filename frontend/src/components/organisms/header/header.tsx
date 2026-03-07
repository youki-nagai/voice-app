import { HelpCircle } from "lucide-react";
import type { ModelId } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { StatusDot } from "../../atoms/status-dot/status-dot";
import { ModelSwitch } from "../../molecules/model-switch/model-switch";

interface HeaderProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  appStatus: StatusDotStatus;
  appStatusText: string;
  onHelpToggle: () => void;
}

export function Header({
  selectedModel,
  onModelChange,
  appStatus,
  appStatusText,
  onHelpToggle,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
      <h1 className="text-base font-semibold text-foreground">voice-app</h1>
      <div className="flex items-center gap-4">
        <ModelSwitch
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot status={appStatus} />
          <span>{appStatusText}</span>
        </div>
        <button
          type="button"
          title="使い方 (Cmd+/)"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onHelpToggle}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
