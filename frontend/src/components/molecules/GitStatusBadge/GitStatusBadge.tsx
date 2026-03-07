import type { StatusDotStatus } from "../../atoms/StatusDot/StatusDot";
import { StatusDot } from "../../atoms/StatusDot/StatusDot";
import "./GitStatusBadge.css";

export type GitBadgeStatus = "checking" | "ok" | "warn" | "error";

interface GitStatusBadgeProps {
  status: GitBadgeStatus;
  branchName: string;
  onClick: () => void;
}

const STATUS_MAP: Record<GitBadgeStatus, StatusDotStatus> = {
  checking: "processing",
  ok: "ok",
  warn: "warn",
  error: "error",
};

const TEXT_MAP: Record<GitBadgeStatus, string> = {
  checking: "Git: 確認中",
  ok: "Git: ",
  warn: "Git: 一部エラー",
  error: "Git: 未設定",
};

export function GitStatusBadge({
  status,
  branchName,
  onClick,
}: GitStatusBadgeProps) {
  const text = status === "ok" ? `Git: ${branchName}` : TEXT_MAP[status];

  return (
    <button
      type="button"
      className="git-status"
      title="クリックでGit状態を再チェック"
      onClick={onClick}
    >
      <StatusDot status={STATUS_MAP[status]} />
      <span>{text}</span>
    </button>
  );
}
