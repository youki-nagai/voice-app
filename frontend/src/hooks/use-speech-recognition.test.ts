import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSpeechRecognition } from "./use-speech-recognition";

describe("use-speech-recognition", () => {
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
