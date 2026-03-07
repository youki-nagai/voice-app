import type { ModelId } from "./messages";

export function detectModelCommand(text: string): ModelId | null {
  const n = text.trim().toLowerCase().replace(/\s+/g, "");
  const opusPatterns = [
    "opusに",
    "オーパスに",
    "おーぱすに",
    "オプスに",
    "おぷすに",
    "オパスに",
    "おぱすに",
  ];
  const sonnetPatterns = [
    "sonnetに",
    "ソネットに",
    "そねっとに",
    "ソネに",
    "そねに",
  ];
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
  | { type: "split" }
  | { type: "unsplit" }
  | { type: "focus-panel"; index: number }
  | { type: "close-panel"; index?: number }
  | { type: "select-thread"; index: number };

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
    n.includes("チャットを追加") ||
    n.includes("チャット作") ||
    n.includes("チャットを作") ||
    n.includes("チャット開") ||
    n.includes("チャットを開") ||
    n.includes("新しいセッション")
  ) {
    return { type: "new-session" };
  }

  // Switch session by number: "チャット1に", "チャット2に切り替え"
  const switchMatch = n.match(/チャット(\d+)に/i);
  if (switchMatch) {
    return { type: "switch-session", target: Number(switchMatch[1]) };
  }

  // Switch session: next/prev
  if (n.includes("次のチャット") || n.includes("チャットを次")) {
    return { type: "switch-session", target: "next" };
  }
  if (n.includes("前のチャット") || n.includes("チャットを前")) {
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

  // Select thread by number: "スレッド1", "スレッド2を開いて"
  const threadMatch = n.match(/スレッド(\d+)/);
  if (threadMatch) {
    return { type: "select-thread", index: Number(threadMatch[1]) };
  }

  // Close specific panel: "パネル2閉じて", "ペイン3閉じて"
  const closePanelMatch = n.match(
    /(?:パネル|ペイン)(\d+)(?:を)?(?:閉|とじ)/,
  );
  if (closePanelMatch) {
    return { type: "close-panel", index: Number(closePanelMatch[1]) };
  }

  // Close focused panel: "パネル閉じて", "ペイン閉じて", "このパネル閉じて"
  if (
    n.includes("このパネル閉") ||
    n.includes("このパネルとじ") ||
    n.includes("このペイン閉") ||
    n.includes("このペインとじ") ||
    n.includes("パネル閉じ") ||
    n.includes("パネルとじ") ||
    n.includes("ペイン閉じ") ||
    n.includes("ペインとじ")
  ) {
    return { type: "close-panel" };
  }

  // Split
  if (
    n.includes("ペイン分割") ||
    n.includes("ペインわけ") ||
    n.includes("ペイン分け") ||
    n.includes("画面分割") ||
    n.includes("分割して") ||
    n.includes("分割し て") ||
    n.includes("パネル分割") ||
    n.includes("splitして")
  ) {
    return { type: "split" };
  }

  // Unsplit
  if (
    n.includes("分割解除") ||
    n.includes("分割閉じ") ||
    n.includes("分割やめ") ||
    n.includes("1つに戻") ||
    n.includes("ひとつに戻") ||
    n.includes("一つに戻")
  ) {
    return { type: "unsplit" };
  }

  // Focus panel: "パネル1", "パネル2にフォーカス", "ペイン3"
  const focusPanelMatch = n.match(/(?:パネル|ペイン)(\d+)/);
  if (focusPanelMatch) {
    return { type: "focus-panel", index: Number(focusPanelMatch[1]) };
  }

  // Cheat sheet
  if (
    n.includes("使い方") ||
    n.includes("ヘルプ") ||
    n.includes("チートシート") ||
    n.includes("操作方法") ||
    n.includes("ショートカット")
  ) {
    return { type: "toggle-cheat-sheet" };
  }

  return null;
}
