import { cn } from "@/lib/utils";
import type { ModelId } from "../../../types/messages";

interface ModelSwitchProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
}

const MODELS: { id: ModelId; label: string }[] = [
  { id: "claude-opus-4-6", label: "Opus" },
  { id: "claude-sonnet-4-6", label: "Sonnet" },
];

export function ModelSwitch({
  selectedModel,
  onModelChange,
}: ModelSwitchProps) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border bg-card">
      {MODELS.map(({ id, label }) => (
        <button
          type="button"
          key={id}
          className={cn(
            "border-0 bg-transparent px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-accent-foreground",
            selectedModel === id && "bg-blue-950 text-blue-200",
          )}
          onClick={() => onModelChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
