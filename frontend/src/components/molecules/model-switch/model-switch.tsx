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
    <div className="flex items-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
      {MODELS.map(({ id, label }) => (
        <button
          type="button"
          key={id}
          className={cn(
            "border-0 bg-transparent px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:text-zinc-400",
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
