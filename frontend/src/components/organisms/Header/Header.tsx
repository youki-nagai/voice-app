import { ModelSwitch } from '../../molecules/ModelSwitch/ModelSwitch';
import { GitStatusBadge } from '../../molecules/GitStatusBadge/GitStatusBadge';
import { StatusDot } from '../../atoms/StatusDot/StatusDot';
import type { ModelId } from '../../../types/messages';
import type { GitBadgeStatus } from '../../molecules/GitStatusBadge/GitStatusBadge';
import type { StatusDotStatus } from '../../atoms/StatusDot/StatusDot';
import './Header.css';

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
        <ModelSwitch selectedModel={selectedModel} onModelChange={onModelChange} />
        <GitStatusBadge status={gitStatus} branchName={gitBranch} onClick={onGitStatusClick} />
        <div className="status-indicator">
          <StatusDot status={appStatus} />
          <span>{appStatusText}</span>
        </div>
      </div>
    </header>
  );
}
