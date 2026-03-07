import { cn } from "@/lib/utils";
import { Spinner } from "../../atoms/spinner/spinner";

interface ToolStyle {
  icon: string;
  color: string;
}

const DEFAULT_TOOL_STYLE: ToolStyle = { icon: "\uD83D\uDD27", color: "" };

const TOOL_STYLES: Record<string, ToolStyle> = {
  bash: { icon: "\u26A1", color: "text-amber-400" },
  read: { icon: "\uD83D\uDCD6", color: "text-blue-300" },
  write: { icon: "\u270F\uFE0F", color: "text-green-400" },
  edit: { icon: "\u270F\uFE0F", color: "text-green-400" },
  multiedit: { icon: "\u270F\uFE0F", color: "text-green-400" },
  glob: { icon: "\uD83D\uDD0D", color: "text-purple-400" },
  grep: { icon: "\uD83D\uDD0D", color: "text-purple-400" },
};

function getToolStyle(tool: string): ToolStyle {
  return TOOL_STYLES[tool.toLowerCase()] ?? DEFAULT_TOOL_STYLE;
}

interface ActionLogItemProps {
  tool: string;
  text: string;
  status: "running" | "done";
}

export function ActionLogItem({ tool, text, status }: ActionLogItemProps) {
  const style = getToolStyle(tool);

  return (
    <div className="flex items-start gap-1.5 px-3 py-0.5 font-mono text-[11px] text-indigo-400/60 leading-relaxed whitespace-pre-wrap break-all animate-in fade-in slide-in-from-top-0.5 duration-150">
      <span className="w-3.5 shrink-0 text-center text-[10px]">
        {status === "running" ? (
          <Spinner size="small" />
        ) : (
          <span className="text-green-600">{"\u2713"}</span>
        )}
      </span>
      <span className="w-4 shrink-0 text-center" data-testid="action-icon">
        {style.icon}
      </span>
      <span className={cn("flex-1 min-w-0", style.color)}>{text}</span>
    </div>
  );
}
