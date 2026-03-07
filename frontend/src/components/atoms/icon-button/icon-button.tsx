import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "mic" | "send";
}

const variantStyles: Record<string, string> = {
  default: "",
  send: "rounded-full h-8 w-8 bg-blue-900 text-blue-200 hover:bg-blue-800 disabled:bg-muted disabled:text-muted-foreground",
  mic: "rounded-full h-12 w-12 border-2 border-border bg-card text-muted-foreground hover:border-ring hover:text-accent-foreground",
};

export function IconButton({
  active,
  variant = "default",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        variantStyles[variant],
        active &&
          variant === "mic" &&
          "border-red-500 bg-red-950 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
