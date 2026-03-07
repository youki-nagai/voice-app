import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot status={appStatus} />
          <span>{appStatusText}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onHelpToggle}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>使い方 (Cmd+/)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
