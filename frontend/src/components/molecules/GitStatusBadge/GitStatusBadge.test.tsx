import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GitStatusBadge } from './GitStatusBadge';

describe('GitStatusBadge', () => {
  it('renders checking state', () => {
    render(<GitStatusBadge status="checking" branchName="" onClick={() => {}} />);
    expect(screen.getByText('Git: 確認中')).toBeInTheDocument();
  });

  it('renders ok state with branch name', () => {
    render(<GitStatusBadge status="ok" branchName="main" onClick={() => {}} />);
    expect(screen.getByText('Git: main')).toBeInTheDocument();
  });

  it('renders warn state', () => {
    render(<GitStatusBadge status="warn" branchName="" onClick={() => {}} />);
    expect(screen.getByText('Git: 一部エラー')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<GitStatusBadge status="error" branchName="" onClick={() => {}} />);
    expect(screen.getByText('Git: 未設定')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GitStatusBadge status="ok" branchName="main" onClick={onClick} />);
    await user.click(screen.getByTitle('クリックでGit状態を再チェック'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
