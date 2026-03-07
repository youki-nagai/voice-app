import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ActionLog } from './ActionLog';
import type { ToolAction } from '../../../types/messages';

describe('ActionLog', () => {
  const actions: ToolAction[] = [
    { tool: 'bash', text: 'コマンド実行', status: 'done' },
    { tool: 'read', text: 'ファイル読み込み', status: 'running' },
  ];

  it('renders action count', () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId('action-count')).toHaveTextContent('2');
  });

  it('shows spinner when running', () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId('action-log-spinner')).toBeInTheDocument();
  });

  it('does not show spinner when done', () => {
    render(<ActionLog actions={actions} status="done" />);
    expect(screen.queryByTestId('action-log-spinner')).not.toBeInTheDocument();
  });

  it('shows current action text when running', () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId('action-log-current')).toHaveTextContent('ファイル読み込み');
  });

  it('shows 完了 when done', () => {
    render(<ActionLog actions={actions} status="done" />);
    expect(screen.getByTestId('action-log-current')).toHaveTextContent('完了');
  });

  it('renders all action items', () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByText('コマンド実行')).toBeInTheDocument();
    // 'ファイル読み込み' appears in both action-log-current and action-list
    expect(screen.getAllByText('ファイル読み込み').length).toBeGreaterThanOrEqual(1);
  });

  it('collapses when done', async () => {
    const { container } = render(<ActionLog actions={actions} status="done" />);
    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
  });

  it('is open when running', () => {
    const { container } = render(<ActionLog actions={actions} status="running" />);
    const details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('can toggle open/close', async () => {
    const user = userEvent.setup();
    const { container } = render(<ActionLog actions={actions} status="running" />);
    const summary = container.querySelector('summary')!;
    await user.click(summary);
    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
  });
});
