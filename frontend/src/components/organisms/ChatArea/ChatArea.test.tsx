import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatArea } from './ChatArea';
import type { TimelineItem } from '../../../types/messages';

describe('ChatArea', () => {
  it('renders empty chat', () => {
    render(<ChatArea timeline={[]} />);
    const chat = screen.getByTestId('chat-area');
    expect(chat).toBeInTheDocument();
  });

  it('renders messages', () => {
    const timeline: TimelineItem[] = [
      { kind: 'message', data: { id: '1', type: 'user', text: 'こんにちは' } },
      { kind: 'message', data: { id: '2', type: 'ai', text: '応答です' } },
    ];
    render(<ChatArea timeline={timeline} />);
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('応答です')).toBeInTheDocument();
  });

  it('renders processing message with spinner', () => {
    const timeline: TimelineItem[] = [
      { kind: 'processing', id: 'processing', text: '送信中...' },
    ];
    render(<ChatArea timeline={timeline} />);
    expect(screen.getByText('送信中...')).toBeInTheDocument();
  });

  it('renders action logs', () => {
    const timeline: TimelineItem[] = [
      {
        kind: 'action-log',
        data: {
          id: 'log1',
          status: 'running',
          actions: [{ tool: 'bash', text: 'テスト実行', status: 'running' }],
        },
      },
    ];
    render(<ChatArea timeline={timeline} />);
    expect(screen.getAllByText('テスト実行').length).toBeGreaterThanOrEqual(1);
  });
});
