import { useCallback, useEffect, useRef, useState } from "react";
import { useCallbackRef } from "./use-callback-ref";

export const DEFAULT_SILENCE_DELAY = 1000;

export type SilenceState = "idle" | "countdown" | "sent";

interface SpeechRecognitionOptions {
  onSpeechComplete: (transcript: string) => void;
  onInterimUpdate?: (text: string) => void;
  onError?: (error: string) => void;
  silenceDelay?: number;
}

export function useSpeechRecognition({
  onSpeechComplete,
  onInterimUpdate,
  onError,
  silenceDelay = DEFAULT_SILENCE_DELAY,
}: SpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [silenceState, setSilenceState] = useState<SilenceState>("idle");
  const [countdownKey, setCountdownKey] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(false);
  const visibleRef = useRef(!document.hidden && document.hasFocus());
  const silenceDelayRef = useRef(silenceDelay);
  silenceDelayRef.current = silenceDelay;

  const onSpeechCompleteRef = useCallbackRef(onSpeechComplete);
  const onInterimUpdateRef = useCallbackRef(onInterimUpdate);
  const onErrorRef = useCallbackRef(onError);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const sendVoiceComplete = useCallback(() => {
    const text = finalTranscriptRef.current.trim();
    if (!text) {
      setSilenceState("idle");
      return;
    }
    onSpeechCompleteRef.current(text);
    finalTranscriptRef.current = "";
    setSilenceState("sent");

    if (sentTimeoutRef.current) {
      clearTimeout(sentTimeoutRef.current);
    }
    sentTimeoutRef.current = setTimeout(() => {
      setSilenceState((prev) => (prev === "sent" ? "idle" : prev));
    }, 1500);
  }, [onSpeechCompleteRef]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setSilenceState("countdown");
    setCountdownKey((k) => k + 1);
    silenceTimeoutRef.current = setTimeout(() => {
      sendVoiceComplete();
    }, silenceDelayRef.current);
  }, [sendVoiceComplete]);

  const setupRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return null;
    const recognition = new (
      SpeechRecognitionAPI as new () => SpeechRecognition
    )();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalPart = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalPart) {
        finalTranscriptRef.current += finalPart;
      }

      onInterimUpdateRef.current?.(finalTranscriptRef.current + interim);
      resetSilenceTimer();
    };

    recognition.onend = () => {
      if (enabledRef.current && visibleRef.current) {
        setTimeout(() => {
          if (enabledRef.current && visibleRef.current) {
            try {
              recognition.start();
            } catch {
              /* already started */
            }
          }
        }, 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (
        event.error === "no-speech" ||
        event.error === "aborted" ||
        event.error === "network"
      ) {
        return;
      }
      onErrorRef.current?.(`音声認識エラー: ${event.error}`);
    };

    return recognition;
  }, [SpeechRecognitionAPI, resetSilenceTimer, onInterimUpdateRef, onErrorRef]);

  const startActualRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (!recognitionRef.current) return;

    setIsRecording(true);
    finalTranscriptRef.current = "";
    setSilenceState("idle");

    try {
      recognitionRef.current.start();
    } catch {
      /* already started */
    }
  }, [setupRecognition]);

  const stopActualRecognition = useCallback(() => {
    setIsRecording(false);
    setSilenceState("idle");

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const syncRecognition = useCallback(() => {
    const shouldRun = enabledRef.current && visibleRef.current;
    if (shouldRun) {
      startActualRecognition();
    } else {
      stopActualRecognition();
    }
  }, [startActualRecognition, stopActualRecognition]);

  const setRecordingEnabled = useCallback(
    (enabled: boolean) => {
      enabledRef.current = enabled;
      if (!enabled) {
        sendVoiceComplete();
      }
      syncRecognition();
    },
    [syncRecognition, sendVoiceComplete],
  );

  useEffect(() => {
    const handleBlur = () => {
      visibleRef.current = false;
      syncRecognition();
    };

    const handleFocus = () => {
      visibleRef.current = true;
      syncRecognition();
    };

    const handleVisibilityChange = () => {
      visibleRef.current = !document.hidden && document.hasFocus();
      syncRecognition();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (sentTimeoutRef.current) {
        clearTimeout(sentTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [syncRecognition]);

  return {
    isRecording,
    isSupported,
    silenceState,
    countdownKey,
    setRecordingEnabled,
  };
}
