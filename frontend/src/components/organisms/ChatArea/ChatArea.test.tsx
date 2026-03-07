import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatArea } from './ChatArea';
import type { ChatMessage as ChatMessageType, ActionLog as ActionLogType } from '../../../types/messages';

describe('ChatArea', () => {
  it('renders empty chat', () => {
    render(<ChatArea messages={[]} actionLogs={[]} processingText={null} />);
    const chat = screen.getByTestId('chat-area');
    expect(chat).toBeInTheDocument();
  });

  it('renders messages', () => {
    const messages: ChatMessageType[] = [
      { id: '1', type: 'user', text: 'こんにちは' },
      { id: '2', type: 'ai', text: '応答です' },
    ];
    render(<ChatArea messages={messages} actionLogs={[]} processingText={null} />);
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('応答です')).toBeInTheDocument();
  });

  it('renders processing message with spinner', () => {
    render(<ChatArea messages={[]} actionLogs={[]} processingText="送信中..." />);
    expect(screen.getByText('送信中...')).toBeInTheDocument();
  });

  it('renders action logs', () => {
    const actionLogs: ActionLogType[] = [
      {
        id: 'log1',
        status: 'running',
        actions: [
          { tool: 'bash', text: 'テスト実行', status: 'running' },
        ],
      },
    ];
    render(<ChatArea messages={[]} actionLogs={actionLogs} processingText={null} />);
    // 'テスト実行' appears in both action-log-current and action-list
    expect(screen.getAllByText('テスト実行').length).toBeGreaterThanOrEqual(1);
  });
});
