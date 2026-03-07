import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeechRecognition } from "./use-speech-recognition";

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

beforeEach(() => {
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition =
    MockSpeechRecognition;
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  Object.defineProperty(document, "hidden", { value: false, writable: true });
});

describe("use-speech-recognition", () => {
  it("starts in not-recording state", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onSpeechComplete: vi.fn() }),
    );
    expect(result.current.isRecording).toBe(false);
  });

  it("starts recording when setRecordingEnabled(true) is called", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onSpeechComplete: vi.fn() }),
    );
    act(() => {
      result.current.setRecordingEnabled(true);
    });
    expect(result.current.isRecording).toBe(true);
  });

  it("stops recording when setRecordingEnabled(false) is called", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onSpeechComplete: vi.fn() }),
    );
    act(() => {
      result.current.setRecordingEnabled(true);
    });
    act(() => {
      result.current.setRecordingEnabled(false);
    });
    expect(result.current.isRecording).toBe(false);
  });

  it("returns not supported when API is not available", () => {
    delete (window as unknown as Record<string, unknown>)
      .webkitSpeechRecognition;
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    const { result } = renderHook(() =>
      useSpeechRecognition({ onSpeechComplete: vi.fn() }),
    );
    expect(result.current.isSupported).toBe(false);
  });
});
