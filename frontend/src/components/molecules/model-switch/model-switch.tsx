import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <ToggleGroup
      type="single"
      size="sm"
      value={selectedModel}
      onValueChange={(value) => {
        if (value) onModelChange(value as ModelId);
      }}
    >
      {MODELS.map(({ id, label }) => (
        <ToggleGroupItem key={id} value={id} className="text-xs px-2.5">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
