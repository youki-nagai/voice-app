import "./spinner.css";

interface SpinnerProps {
  size?: "default" | "small";
  "data-testid"?: string;
}

export function Spinner({
  size = "default",
  "data-testid": testId = "spinner",
}: SpinnerProps) {
  const className = size === "small" ? "spinner-small" : "spinner";
  return <span className={className} data-testid={testId} />;
}
