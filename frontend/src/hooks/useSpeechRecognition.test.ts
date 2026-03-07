import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpeechRecognition } from './useSpeechRecognition';

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

beforeEach(() => {
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;
});

describe('useSpeechRecognition', () => {
  it('starts in not-recording state', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onSpeechComplete: vi.fn() }));
    expect(result.current.isRecording).toBe(false);
  });

  it('starts recording when startRecording is called', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onSpeechComplete: vi.fn() }));
    act(() => {
      result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);
  });

  it('stops recording when stopRecording is called', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onSpeechComplete: vi.fn() }));
    act(() => {
      result.current.startRecording();
    });
    act(() => {
      result.current.stopRecording();
    });
    expect(result.current.isRecording).toBe(false);
  });

  it('returns not supported when API is not available', () => {
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition({ onSpeechComplete: vi.fn() }));
    expect(result.current.isSupported).toBe(false);
  });
});
