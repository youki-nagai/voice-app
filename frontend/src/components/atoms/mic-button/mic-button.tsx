import { Check, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SilenceState } from "../../../hooks/use-speech-recognition";

interface MicButtonProps {
  isRecording: boolean;
  silenceState: SilenceState;
  countdownKey: number;
  silenceDelayMs: number;
  onClick: () => void;
}

const SIZE = 56;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MicButton({
  isRecording,
  silenceState,
  countdownKey,
  silenceDelayMs,
  onClick,
}: MicButtonProps) {
  const isCountdown = isRecording && silenceState === "countdown";
  const isSent = silenceState === "sent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        "h-14 w-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !isRecording && "text-muted-foreground hover:text-accent-foreground",
        isRecording && !isSent && "text-red-400",
        isSent && "text-emerald-400",
      )}
      title="音声入力"
    >
      {/* Recording idle pulse */}
      {isRecording && silenceState === "idle" && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/10" />
      )}

      {/* Countdown glow */}
      {isCountdown && (
        <div className="absolute inset-0 rounded-full bg-red-500/10" />
      )}

      {/* Sent glow */}
      {isSent && (
        <div className="absolute inset-0 animate-[mic-sent-glow_1.5s_ease-out_forwards] rounded-full bg-emerald-500/15" />
      )}

      {/* SVG Ring */}
      <svg
        aria-hidden="true"
        className="absolute inset-0"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        {/* Background ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className={cn(
            "transition-opacity duration-300",
            isRecording ? "opacity-20" : "opacity-10",
          )}
        />

        {/* Countdown depleting ring */}
        {isCountdown && (
          <circle
            key={countdownKey}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="-rotate-90 origin-center"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: "0",
              animation: `mic-countdown ${silenceDelayMs}ms linear forwards`,
            }}
          />
        )}

        {/* Sent confirmation ring */}
        {isSent && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="-rotate-90 origin-center animate-[mic-sent-ring_1.5s_ease-out_forwards]"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: "0",
            }}
          />
        )}
      </svg>

      {/* Icon */}
      {isSent ? (
        <Check className="relative z-10 h-5 w-5 animate-[mic-check-pop_0.3s_ease-out]" />
      ) : (
        <Mic className="relative z-10 h-5 w-5" />
      )}
    </button>
  );
}
