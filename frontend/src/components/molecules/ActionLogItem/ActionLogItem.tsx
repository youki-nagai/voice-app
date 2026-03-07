import { Spinner } from "../../atoms/Spinner/Spinner";
import "./ActionLogItem.css";

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

interface ActionLogItemProps {
  tool: string;
  text: string;
  status: "running" | "done";
}

export function ActionLogItem({ tool, text, status }: ActionLogItemProps) {
  return (
    <div className={`action-item ${status} tool-${tool.toLowerCase()}`}>
      <span className="action-status">
        {status === "running" ? <Spinner size="small" /> : "\u2713"}
      </span>
      <span className="action-icon" data-testid="action-icon">
        {getToolIcon(tool)}
      </span>
      <span className="action-text">{text}</span>
    </div>
  );
}
