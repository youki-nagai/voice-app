import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolAction } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";
import { ActionLogItem } from "../../molecules/action-log-item/action-log-item";

interface ActionLogProps {
  actions: ToolAction[];
  status: "running" | "done";
}

export function ActionLog({ actions, status }: ActionLogProps) {
  const lastAction = actions[actions.length - 1];
  const currentText = status === "done" ? "完了" : lastAction?.text || "";

  return (
    <div className="w-full max-w-[85%] self-start">
      <details
        open={status === "running"}
        className={cn(
          "group overflow-hidden rounded-lg border border-indigo-950 bg-[#141420] transition-colors",
          status === "running" && "border-indigo-900",
        )}
      >
        <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-xs text-indigo-400 list-none hover:bg-indigo-950/50 [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-2.5 w-2.5 shrink-0 text-indigo-600 transition-transform group-open:rotate-90" />
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
          <span
            className="shrink-0 rounded-full bg-indigo-950 px-1.5 py-px text-[10px] text-indigo-300"
            data-testid="action-count"
          >
            {actions.length}
          </span>
        </summary>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {actions.map((action) => (
            <ActionLogItem
              key={`${action.tool}-${action.text}`}
              tool={action.tool}
              text={action.text}
              status={action.status}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
