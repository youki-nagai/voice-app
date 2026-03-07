import { cn } from "@/lib/utils";
import { Spinner } from "../../atoms/spinner/spinner";

const TOOL_ICONS: Record<string, string> = {
  bash: "\u26A1",
  read: "\uD83D\uDCD6",
  write: "\u270F\uFE0F",
  edit: "\u270F\uFE0F",
  multiedit: "\u270F\uFE0F",
  glob: "\uD83D\uDD0D",
  grep: "\uD83D\uDD0D",
};

function getToolIcon(tool: string): string {
  return TOOL_ICONS[tool.toLowerCase()] || "\uD83D\uDD27";
}

const toolTextColors: Record<string, string> = {
  bash: "text-amber-400",
  write: "text-green-400",
  edit: "text-green-400",
  multiedit: "text-green-400",
  read: "text-blue-300",
  glob: "text-purple-400",
  grep: "text-purple-400",
};

interface ActionLogItemProps {
  tool: string;
  text: string;
  status: "running" | "done";
}

export function ActionLogItem({ tool, text, status }: ActionLogItemProps) {
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
        {getToolIcon(tool)}
      </span>
      <span
        className={cn(
          "flex-1 min-w-0",
          toolTextColors[tool.toLowerCase()] || "",
        )}
      >
        {text}
      </span>
    </div>
  );
}
