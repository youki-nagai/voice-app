import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSessionManager } from "./use-session-manager";

describe("useSessionManager", () => {
  it("adds a new session", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[1].name).toBe("Chat 2");
  });

  it("switches active session to newly added one", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    expect(result.current.activeSessionId).toBe(result.current.sessions[1].id);
  });

  it("removes a session", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;
    act(() => {
      result.current.removeSession(secondId);
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it("switches active to previous session when active is removed", () => {
    const { result } = renderHook(() => useSessionManager());
    const firstId = result.current.sessions[0].id;
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;
    expect(result.current.activeSessionId).toBe(secondId);
    act(() => {
      result.current.removeSession(secondId);
    });
    expect(result.current.activeSessionId).toBe(firstId);
  });

  it("does not remove the last session", () => {
    const { result } = renderHook(() => useSessionManager());
    const firstId = result.current.sessions[0].id;
    act(() => {
      result.current.removeSession(firstId);
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it("increments session names correctly after removal", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    act(() => {
      result.current.addSession();
    });
    expect(result.current.sessions[2].name).toBe("Chat 3");
  });

  it("splits into multiple panels", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;
    act(() => {
      result.current.addSession();
    });
    const thirdId = result.current.sessions[2].id;

    // Split with second session
    act(() => {
      result.current.splitSession(secondId);
    });
    expect(result.current.panels).toHaveLength(2);
    expect(result.current.isSplitView).toBe(true);
    expect(result.current.focusedPanelIndex).toBe(1);

    // Split with third session
    act(() => {
      result.current.splitSession(thirdId);
    });
    expect(result.current.panels).toHaveLength(3);
    expect(result.current.focusedPanelIndex).toBe(2);
  });

  it("focuses existing panel when splitting with already-open session", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;

    act(() => {
      result.current.splitSession(secondId);
    });
    expect(result.current.panels).toHaveLength(2);

    // Try to split with same session again
    act(() => {
      result.current.splitSession(secondId);
    });
    expect(result.current.panels).toHaveLength(2);
    expect(result.current.focusedPanelIndex).toBe(1);
  });

  it("removes a specific panel", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;
    act(() => {
      result.current.addSession();
    });

    act(() => {
      result.current.splitSession(secondId);
    });
    act(() => {
      result.current.splitSession(result.current.sessions[2].id);
    });
    expect(result.current.panels).toHaveLength(3);

    act(() => {
      result.current.removePanel(1);
    });
    expect(result.current.panels).toHaveLength(2);
  });

  it("unsplits to single panel keeping focused session", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;

    act(() => {
      result.current.splitSession(secondId);
    });
    expect(result.current.panels).toHaveLength(2);

    // Focus is on panel 1 (secondary), unsplit should keep that session
    act(() => {
      result.current.unsplit();
    });
    expect(result.current.panels).toHaveLength(1);
    expect(result.current.panels[0]).toBe(secondId);
    expect(result.current.focusedPanelIndex).toBe(0);
  });

  it("selectSession focuses existing panel instead of replacing", () => {
    const { result } = renderHook(() => useSessionManager());
    act(() => {
      result.current.addSession();
    });
    const secondId = result.current.sessions[1].id;

    act(() => {
      result.current.splitSession(secondId);
    });

    // Focus panel 0
    act(() => {
      result.current.setFocusedPanelIndex(0);
    });

    // Select the session that's already in panel 1
    act(() => {
      result.current.selectSession(secondId);
    });
    expect(result.current.focusedPanelIndex).toBe(1);
    expect(result.current.panels).toHaveLength(2);
  });
});
