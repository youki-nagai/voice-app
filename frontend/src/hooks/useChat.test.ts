import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChat } from './useChat';

describe('useChat', () => {
  it('starts with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
  });

  it('adds a message', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage('hello', 'user');
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('hello');
    expect(result.current.messages[0].type).toBe('user');
  });

  it('adds multiple messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage('user msg', 'user');
      result.current.addMessage('ai msg', 'ai');
    });
    expect(result.current.messages).toHaveLength(2);
  });

  it('handles AI streaming chunks', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.appendAiChunk('Hello');
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].type).toBe('ai');
    expect(result.current.messages[0].text).toBe('Hello');

    act(() => {
      result.current.appendAiChunk(' World');
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('Hello World');
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
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].text).toBe('First response');
    expect(result.current.messages[1].text).toBe('Second response');
  });

  it('manages processing text', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.setProcessingText('送信中...');
    });
    expect(result.current.processingText).toBe('送信中...');
    act(() => {
      result.current.setProcessingText(null);
    });
    expect(result.current.processingText).toBeNull();
  });

  it('manages action logs', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド実行');
    });
    expect(result.current.actionLogs).toHaveLength(1);
    expect(result.current.actionLogs[0].actions).toHaveLength(1);
    expect(result.current.actionLogs[0].actions[0].tool).toBe('bash');
    expect(result.current.actionLogs[0].status).toBe('running');
  });

  it('adds multiple actions to same log', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド1');
    });
    act(() => {
      result.current.addToolAction('read', 'ファイル読み込み');
    });
    expect(result.current.actionLogs).toHaveLength(1);
    expect(result.current.actionLogs[0].actions).toHaveLength(2);
    expect(result.current.actionLogs[0].actions[0].status).toBe('done');
    expect(result.current.actionLogs[0].actions[1].status).toBe('running');
  });

  it('finalizes action log', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addToolAction('bash', 'コマンド');
    });
    act(() => {
      result.current.finalizeActionLog();
    });
    expect(result.current.actionLogs[0].status).toBe('done');
    expect(result.current.actionLogs[0].actions[0].status).toBe('done');
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
    expect(result.current.actionLogs).toHaveLength(2);
  });
});
