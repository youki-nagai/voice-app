import { useEffect } from "react";

interface Modifiers {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  modifiers: Modifiers = {},
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== key) return;
      if (modifiers.meta && !e.metaKey) return;
      if (modifiers.ctrl && !e.ctrlKey) return;
      if (modifiers.shift && !e.shiftKey) return;
      e.preventDefault();
      handler();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, handler, modifiers.meta, modifiers.ctrl, modifiers.shift]);
}
