import { fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardShortcut } from "./use-keyboard-shortcut";

describe("useKeyboardShortcut", () => {
  it("calls handler on Cmd+/ (Mac)", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut("/", handler, { meta: true }));
    fireEvent.keyDown(document, { key: "/", metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call handler without meta key", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut("/", handler, { meta: true }));
    fireEvent.keyDown(document, { key: "/" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("prevents default on match", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut("/", handler, { meta: true }));
    const event = new KeyboardEvent("keydown", {
      key: "/",
      metaKey: true,
      bubbles: true,
    });
    const spy = vi.spyOn(event, "preventDefault");
    document.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcut("/", handler, { meta: true }),
    );
    unmount();
    fireEvent.keyDown(document, { key: "/", metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
