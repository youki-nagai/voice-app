import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ControlBar } from './ControlBar';

describe('ControlBar', () => {
  const defaultProps = {
    textValue: '',
    onTextChange: vi.fn(),
    onSend: vi.fn(),
    isRecording: false,
    onMicToggle: vi.fn(),
    silenceTimerText: '',
    isWaitingForAI: false,
    pendingImageUrl: null as string | null,
    onImagePaste: vi.fn(),
    onImageRemove: vi.fn(),
  };

  it('renders text input', () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('テキストで入力...')).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle('送信')).toBeInTheDocument();
  });

  it('renders mic button', () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle('音声入力')).toBeInTheDocument();
  });

  it('calls onSend when send button clicked with text', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ControlBar {...defaultProps} textValue="hello" onSend={onSend} />);
    await user.click(screen.getByTitle('送信'));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('calls onMicToggle when mic clicked', async () => {
    const user = userEvent.setup();
    const onMicToggle = vi.fn();
    render(<ControlBar {...defaultProps} onMicToggle={onMicToggle} />);
    await user.click(screen.getByTitle('音声入力'));
    expect(onMicToggle).toHaveBeenCalledOnce();
  });

  it('shows mic as active when recording', () => {
    render(<ControlBar {...defaultProps} isRecording={true} />);
    expect(screen.getByTitle('音声入力')).toHaveClass('active');
  });

  it('shows silence timer text', () => {
    render(<ControlBar {...defaultProps} silenceTimerText="話し中..." />);
    expect(screen.getByText('話し中...')).toBeInTheDocument();
  });

  it('shows image preview when pendingImageUrl is set', () => {
    render(<ControlBar {...defaultProps} pendingImageUrl="data:image/png;base64,abc" />);
    expect(screen.getByAltText('添付画像')).toBeInTheDocument();
  });

  it('calls onImageRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    const onImageRemove = vi.fn();
    render(<ControlBar {...defaultProps} pendingImageUrl="data:image/png;base64,abc" onImageRemove={onImageRemove} />);
    await user.click(screen.getByTitle('画像を削除'));
    expect(onImageRemove).toHaveBeenCalledOnce();
  });
});
