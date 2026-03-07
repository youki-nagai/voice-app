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

export type AppCommand =
  | { type: "new-session" }
  | { type: "switch-session"; target: number | "next" | "prev" }
  | { type: "toggle-cheat-sheet" }
  | { type: "set-silence-delay"; seconds: number }
  | { type: "unsplit" };

function normalizeFullWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
}

export function detectAppCommand(text: string): AppCommand | null {
  const n = normalizeFullWidthDigits(
    text.trim().toLowerCase().replace(/\s+/g, ""),
  );

  // New session
  if (
    n.includes("新しいチャット") ||
    n.includes("新規チャット") ||
    n.includes("チャット追加") ||
    n.includes("チャットを追加")
  ) {
    return { type: "new-session" };
  }

  // Switch session by number: "チャット1に", "チャット2に切り替え"
  const switchMatch = n.match(/チャット(\d+)に/i);
  if (switchMatch) {
    return { type: "switch-session", target: Number(switchMatch[1]) };
  }

  // Switch session: next/prev
  if (n.includes("次のチャット")) {
    return { type: "switch-session", target: "next" };
  }
  if (n.includes("前のチャット")) {
    return { type: "switch-session", target: "prev" };
  }

  // Silence delay: "待ち時間3秒", "沈黙2秒", "待ち時間を5秒に"
  const delayMatch = n.match(/(?:待ち時間|沈黙|無音)(?:を)?(\d+(?:\.\d+)?)秒/);
  if (delayMatch) {
    const seconds = Number(delayMatch[1]);
    if (seconds >= 0.5 && seconds <= 10) {
      return { type: "set-silence-delay", seconds };
    }
  }

  // Unsplit
  if (
    n.includes("分割解除") ||
    n.includes("ペイン閉じ") ||
    n.includes("パネル閉じ") ||
    n.includes("分割閉じ") ||
    n.includes("ペインとじ") ||
    n.includes("パネルとじ")
  ) {
    return { type: "unsplit" };
  }

  // Cheat sheet
  if (
    n.includes("使い方") ||
    n.includes("ヘルプ") ||
    n.includes("チートシート")
  ) {
    return { type: "toggle-cheat-sheet" };
  }

  return null;
}
