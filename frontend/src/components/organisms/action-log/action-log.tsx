import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ToolAction } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";
import { ActionLogItem } from "../../molecules/action-log-item/action-log-item";

interface ActionLogProps {
  actions: ToolAction[];
  status: "running" | "done";
}

export function ActionLog({ actions, status }: ActionLogProps) {
  const [isOpen, setIsOpen] = useState(status === "running");
  const lastAction = actions[actions.length - 1];
  const currentText = status === "done" ? "完了" : lastAction?.text || "";

  return (
    <div className="w-full max-w-[85%] self-start">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "overflow-hidden rounded-lg border border-indigo-950 bg-[#141420] transition-colors",
          status === "running" && "border-indigo-900",
        )}
      >
        <CollapsibleTrigger className="flex w-full cursor-pointer select-none items-center gap-2 px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-950/50">
          <ChevronRight
            className={cn(
              "h-2.5 w-2.5 shrink-0 text-indigo-600 transition-transform",
              isOpen && "rotate-90",
            )}
          />
          {status === "running" && (
            <Spinner size="small" data-testid="action-log-spinner" />
          )}
          <span className="shrink-0 font-medium">Claude の作業</span>
          <span
            className="min-w-0 flex-1 truncate font-mono text-[11px] text-indigo-500"
            data-testid="action-log-current"
          >
            {currentText}
          </span>
          <Badge
            variant="secondary"
            className="shrink-0 px-1.5 py-px text-[10px]"
            data-testid="action-count"
          >
            {actions.length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="max-h-[300px]">
            <div className="py-1">
              {actions.map((action) => (
                <ActionLogItem
                  key={`${action.tool}-${action.text}`}
                  tool={action.tool}
                  text={action.text}
                  status={action.status}
                />
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
