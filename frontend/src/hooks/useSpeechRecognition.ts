import { useCallback, useEffect, useRef, useState } from 'react';

const SILENCE_DELAY = 1000;

interface SpeechRecognitionOptions {
  onSpeechComplete: (transcript: string) => void;
  onInterimUpdate?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({ onSpeechComplete, onInterimUpdate, onError }: SpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [silenceTimerText, setSilenceTimerText] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const isWindowFocusedRef = useRef(document.hasFocus());

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const sendVoiceComplete = useCallback(() => {
    const text = finalTranscriptRef.current.trim();
    if (!text) {
      setSilenceTimerText('');
      return;
    }
    onSpeechComplete(text);
    finalTranscriptRef.current = '';
    setSilenceTimerText('送信済み');
  }, [onSpeechComplete]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setSilenceTimerText('話し中...');
    silenceTimeoutRef.current = setTimeout(() => {
      sendVoiceComplete();
    }, SILENCE_DELAY);
  }, [sendVoiceComplete]);

  const setupRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return null;
    const recognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalPart = '';

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

      onInterimUpdate?.(finalTranscriptRef.current + interim);
      resetSilenceTimer();
    };

    recognition.onend = () => {
      if (isRecordingRef.current && isWindowFocusedRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current && isWindowFocusedRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
        return;
      }
      onError?.(`音声認識エラー: ${event.error}`);
    };

    return recognition;
  }, [SpeechRecognitionAPI, onInterimUpdate, onError, resetSilenceTimer]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (!recognitionRef.current) return;

    isRecordingRef.current = true;
    setIsRecording(true);
    finalTranscriptRef.current = '';
    setSilenceTimerText('');

    try { recognitionRef.current.start(); } catch {}
  }, [setupRecognition]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setSilenceTimerText('');

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  useEffect(() => {
    const pauseRecognition = () => {
      isWindowFocusedRef.current = false;
      if (!isRecordingRef.current) return;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    const resumeRecognition = () => {
      isWindowFocusedRef.current = true;
      if (!isRecordingRef.current) return;
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseRecognition();
      } else {
        resumeRecognition();
      }
    };

    window.addEventListener('blur', pauseRecognition);
    window.addEventListener('focus', resumeRecognition);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', pauseRecognition);
      window.removeEventListener('focus', resumeRecognition);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    isSupported,
    silenceTimerText,
    startRecording,
    stopRecording,
    sendVoiceComplete,
  };
}
