import type { ModelId } from "../../../types/messages";
import "./model-switch.css";

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
    <div className="model-switch">
      {MODELS.map(({ id, label }) => (
        <button
          type="button"
          key={id}
          className={selectedModel === id ? "active" : ""}
          onClick={() => onModelChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
