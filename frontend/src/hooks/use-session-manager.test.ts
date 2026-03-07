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
});
