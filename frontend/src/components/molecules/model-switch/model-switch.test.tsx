import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ModelSwitch } from './model-switch';

describe('model-switch', () => {
  it('renders Opus and Sonnet buttons', () => {
    render(<ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Opus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sonnet' })).toBeInTheDocument();
  });

  it('highlights the selected model', () => {
    render(<ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Opus' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Sonnet' })).not.toHaveClass('active');
  });

  it('calls onModelChange when clicking a different model', async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    render(<ModelSwitch selectedModel="claude-opus-4-6" onModelChange={onModelChange} />);
    await user.click(screen.getByRole('button', { name: 'Sonnet' }));
    expect(onModelChange).toHaveBeenCalledWith('claude-sonnet-4-6');
  });
});
