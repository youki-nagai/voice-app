import { Spinner } from '../../atoms/spinner/spinner';
import { ActionLogItem } from '../../molecules/action-log-item/action-log-item';
import type { ToolAction } from '../../../types/messages';
import './action-log.css';

interface ActionLogProps {
  actions: ToolAction[];
  status: 'running' | 'done';
}

export function ActionLog({ actions, status }: ActionLogProps) {
  const lastAction = actions[actions.length - 1];
  const currentText = status === 'done' ? '完了' : lastAction?.text || '';

  return (
    <div className="action-log">
      <details open={status === 'running'} className={status === 'running' ? 'running' : ''}>
        <summary>
          <span className="action-log-chevron">&#x25B6;</span>
          {status === 'running' && <Spinner size="small" data-testid="action-log-spinner" />}
          <span className="action-log-title">Claude の作業</span>
          <span className="action-log-current" data-testid="action-log-current">{currentText}</span>
          <span className="action-count" data-testid="action-count">{actions.length}</span>
        </summary>
        <div className="action-list">
          {actions.map((action, i) => (
            <ActionLogItem key={i} tool={action.tool} text={action.text} status={action.status} />
          ))}
        </div>
      </details>
    </div>
  );
}
