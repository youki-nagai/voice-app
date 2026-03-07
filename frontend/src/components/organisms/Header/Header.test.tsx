import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  const defaultProps = {
    selectedModel: 'claude-opus-4-6' as const,
    onModelChange: vi.fn(),
    gitStatus: 'ok' as const,
    gitBranch: 'main',
    onGitStatusClick: vi.fn(),
    appStatus: 'connected' as const,
    appStatusText: '準備完了',
  };

  it('renders title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('voice-app')).toBeInTheDocument();
  });

  it('renders model switch', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Opus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sonnet' })).toBeInTheDocument();
  });

  it('renders git status', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Git: main')).toBeInTheDocument();
  });

  it('renders app status', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('準備完了')).toBeInTheDocument();
  });

  it('delegates model change', async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    render(<Header {...defaultProps} onModelChange={onModelChange} />);
    await user.click(screen.getByRole('button', { name: 'Sonnet' }));
    expect(onModelChange).toHaveBeenCalledWith('claude-sonnet-4-6');
  });
});
