import "./StatusDot.css";

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

export function StatusDot({ status }: StatusDotProps) {
  return <div className={`status-dot ${status}`} data-testid="status-dot" />;
}
