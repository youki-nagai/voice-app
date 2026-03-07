import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "default" | "small";
  "data-testid"?: string;
}

export function Spinner({
  size = "default",
  "data-testid": testId = "spinner",
}: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-amber-500",
        size === "small" ? "h-2.5 w-2.5" : "h-3 w-3 mr-2",
      )}
      data-testid={testId}
    />
  );
}
