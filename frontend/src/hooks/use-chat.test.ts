import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChat } from './use-chat';

function getMessages(timeline: ReturnType<typeof useChat>['timeline']) {
  return timeline.filter((item) => item.kind === 'message').map((item) => item.data);
}

function getActionLogs(timeline: ReturnType<typeof useChat>['timeline']) {
  return timeline.filter((item) => item.kind === 'action-log').map((item) => item.data);
}

function getProcessing(timeline: ReturnType<typeof useChat>['timeline']) {
  return timeline.filter((item) => item.kind === 'processing');
}

describe('use-chat', () => {
  it('starts with empty timeline', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.timeline).toEqual([]);
  });

  it('adds a message', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage('hello', 'user');
    });
    const messages = getMessages(result.current.timeline);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe('hello');
    expect(messages[0].type).toBe('user');
  });

  it('adds multiple messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage('user msg', 'user');
      result.current.addMessage('ai msg', 'ai');
    });
    expect(getMessages(result.current.timeline)).toHaveLength(2);
  });

  it('handles AI streaming chunks', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.appendAiChunk('Hello');
    });
    let messages = getMessages(result.current.timeline);
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('ai');
    expect(messages[0].text).toBe('Hello');

    act(() => {
      result.current.appendAiChunk(' World');
    });
    messages = getMessages(result.current.timeline);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe('Hello World');
  });

  it('finalizes AI message and starts new one', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.appendAiChunk('First response');
    });
    act(() => {
      result.current.finalizeAiMessage();
    });
    act(() => {
      result.current.appendAiChunk('Second response');
    });
    const messages = getMessages(result.current.timeline);
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe('First response');
    expect(messages[1].text).toBe('Second response');
  });

  it('manages processing text in timeline', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.setProcessingText('送信中...');
    });
    let processing = getProcessing(result.current.timeline);
    expect(processing).toHaveLength(1);
    expect(processing[0].text).toBe('送信中...');
    act(() => {
      result.current.setProcessingText(null);
    });
    processing = getProcessing(result.current.timeline);
    expect(processing).toHaveLength(0);
  });

  it('manages action logs in timeline', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド実行');
    });
    const logs = getActionLogs(result.current.timeline);
    expect(logs).toHaveLength(1);
    expect(logs[0].actions).toHaveLength(1);
    expect(logs[0].actions[0].tool).toBe('bash');
    expect(logs[0].status).toBe('running');
  });

  it('adds multiple actions to same log', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド1');
    });
    act(() => {
      result.current.addToolAction('read', 'ファイル読み込み');
    });
    const logs = getActionLogs(result.current.timeline);
    expect(logs).toHaveLength(1);
    expect(logs[0].actions).toHaveLength(2);
    expect(logs[0].actions[0].status).toBe('done');
    expect(logs[0].actions[1].status).toBe('running');
  });

  it('finalizes action log', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド');
    });
    act(() => {
      result.current.finalizeActionLog();
    });
    const logs = getActionLogs(result.current.timeline);
    expect(logs[0].status).toBe('done');
    expect(logs[0].actions[0].status).toBe('done');
  });

  it('starts new action log after finalization', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド1');
    });
    act(() => {
      result.current.finalizeActionLog();
    });
    act(() => {
      result.current.addToolAction('read', 'ファイル読み込み');
    });
    expect(getActionLogs(result.current.timeline)).toHaveLength(2);
  });
});
