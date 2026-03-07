import type { ModelId } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { StatusDot } from "../../atoms/status-dot/status-dot";
import type { GitBadgeStatus } from "../../molecules/git-status-badge/git-status-badge";
import { GitStatusBadge } from "../../molecules/git-status-badge/git-status-badge";
import { ModelSwitch } from "../../molecules/model-switch/model-switch";

interface HeaderProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  gitStatus: GitBadgeStatus;
  gitBranch: string;
  onGitStatusClick: () => void;
  appStatus: StatusDotStatus;
  appStatusText: string;
}

export function Header({
  selectedModel,
  onModelChange,
  gitStatus,
  gitBranch,
  onGitStatusClick,
  appStatus,
  appStatusText,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-zinc-950 px-5 py-3">
      <h1 className="text-base font-semibold text-white">voice-app</h1>
      <div className="flex items-center gap-4">
        <ModelSwitch
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        <GitStatusBadge
          status={gitStatus}
          branchName={gitBranch}
          onClick={onGitStatusClick}
        />
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <StatusDot status={appStatus} />
          <span>{appStatusText}</span>
        </div>
      </div>
    </header>
  );
}
