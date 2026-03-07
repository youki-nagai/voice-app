import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextInput } from './text-input';

describe('text-input', () => {
  it('renders with placeholder', () => {
    render(<TextInput placeholder="テスト入力..." value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('テスト入力...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextInput value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onSubmit on Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not call onSubmit on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
