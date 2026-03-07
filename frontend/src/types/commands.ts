import type { ModelId } from "./messages";

export function detectModelCommand(text: string): ModelId | null {
  const n = text.trim().toLowerCase().replace(/\s+/g, "");
  const opusPatterns = [
    "opusに",
    "オーパスに",
    "おーぱすに",
    "オプスに",
    "おぷすに",
  ];
  const sonnetPatterns = ["sonnetに", "ソネットに", "そねっとに", "ソネに"];
  for (const p of opusPatterns) {
    if (n.includes(p)) return "claude-opus-4-6";
  }
  for (const p of sonnetPatterns) {
    if (n.includes(p)) return "claude-sonnet-4-6";
  }
  return null;
}

const MODEL_LABELS: Record<ModelId, string> = {
  "claude-opus-4-6": "Opus",
  "claude-sonnet-4-6": "Sonnet",
};

export function getModelLabel(model: ModelId): string {
  return MODEL_LABELS[model];
}
