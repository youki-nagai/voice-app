import { cn } from "@/lib/utils";

export type StatusDotStatus =
  | "connected"
  | "recording"
  | "processing"
  | "error"
  | "ok"
  | "warn";

interface StatusDotProps {
  status: StatusDotStatus;
}

const statusStyles: Record<StatusDotStatus, string> = {
  connected: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]",
  recording: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)] animate-pulse",
  processing:
    "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)] animate-pulse",
  error: "bg-red-500",
  ok: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]",
  warn: "bg-amber-500",
};

export function StatusDot({ status }: StatusDotProps) {
  return (
    <div
      className={cn("h-2 w-2 rounded-full bg-zinc-600", statusStyles[status])}
      data-testid="status-dot"
    />
  );
}
