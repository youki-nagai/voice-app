import type { ModelId } from "../../../types/messages";
import type { StatusDotStatus } from "../../atoms/status-dot/status-dot";
import { StatusDot } from "../../atoms/status-dot/status-dot";
import type { GitBadgeStatus } from "../../molecules/git-status-badge/git-status-badge";
import { GitStatusBadge } from "../../molecules/git-status-badge/git-status-badge";
import { ModelSwitch } from "../../molecules/model-switch/model-switch";
import "./header.css";

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
    <header className="app-header">
      <h1>voice-app</h1>
      <div className="header-right">
        <ModelSwitch
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        <GitStatusBadge
          status={gitStatus}
          branchName={gitBranch}
          onClick={onGitStatusClick}
        />
        <div className="status-indicator">
          <StatusDot status={appStatus} />
          <span>{appStatusText}</span>
        </div>
      </div>
    </header>
  );
}
