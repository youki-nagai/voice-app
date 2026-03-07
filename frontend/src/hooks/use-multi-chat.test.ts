import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMultiChat } from "./use-multi-chat";

describe("useMultiChat", () => {
  it("returns empty timeline for unknown session", () => {
    const { result } = renderHook(() => useMultiChat());
    expect(result.current.getTimeline("nonexistent")).toEqual([]);
  });

  it("adds a message to a specific session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addMessage("s1", "hello", "user");
    });
    const timeline = result.current.getTimeline("s1");
    expect(timeline).toHaveLength(1);
    expect(timeline[0].kind).toBe("message");
    if (timeline[0].kind === "message") {
      expect(timeline[0].data.text).toBe("hello");
      expect(timeline[0].data.type).toBe("user");
    }
  });

  it("keeps sessions isolated", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addMessage("s1", "session 1 msg", "user");
      result.current.addMessage("s2", "session 2 msg", "user");
    });
    expect(result.current.getTimeline("s1")).toHaveLength(1);
    expect(result.current.getTimeline("s2")).toHaveLength(1);
    const s1Item = result.current.getTimeline("s1")[0];
    if (s1Item.kind === "message") {
      expect(s1Item.data.text).toBe("session 1 msg");
    }
    const s2Item = result.current.getTimeline("s2")[0];
    if (s2Item.kind === "message") {
      expect(s2Item.data.text).toBe("session 2 msg");
    }
  });

  it("streams AI chunks to specific session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.appendAiChunk("s1", "Hello");
    });
    act(() => {
      result.current.appendAiChunk("s1", " World");
    });
    const timeline = result.current.getTimeline("s1");
    expect(timeline).toHaveLength(1);
    if (timeline[0].kind === "message") {
      expect(timeline[0].data.text).toBe("Hello World");
    }
  });

  it("finalizes AI message per session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.appendAiChunk("s1", "First");
    });
    act(() => {
      result.current.finalizeAiMessage("s1");
    });
    act(() => {
      result.current.appendAiChunk("s1", "Second");
    });
    const timeline = result.current.getTimeline("s1");
    expect(timeline).toHaveLength(2);
  });

  it("manages processing text per session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.setProcessingText("s1", "sending...");
    });
    const timeline = result.current.getTimeline("s1");
    expect(timeline).toHaveLength(1);
    expect(timeline[0].kind).toBe("processing");

    act(() => {
      result.current.setProcessingText("s1", null);
    });
    expect(result.current.getTimeline("s1")).toHaveLength(0);
  });

  it("manages action logs per session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addToolAction("s1", "bash", "command");
    });
    const timeline = result.current.getTimeline("s1");
    expect(timeline).toHaveLength(1);
    expect(timeline[0].kind).toBe("action-log");
    // s2 is unaffected
    expect(result.current.getTimeline("s2")).toHaveLength(0);
  });

  it("finalizes action log per session", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addToolAction("s1", "bash", "command");
    });
    act(() => {
      result.current.finalizeActionLog("s1");
    });
    const timeline = result.current.getTimeline("s1");
    if (timeline[0].kind === "action-log") {
      expect(timeline[0].data.status).toBe("done");
    }
  });

  it("manages isWaitingForAI per session", () => {
    const { result } = renderHook(() => useMultiChat());
    expect(result.current.getIsWaitingForAI("s1")).toBe(false);
    act(() => {
      result.current.setIsWaitingForAI("s1", true);
    });
    expect(result.current.getIsWaitingForAI("s1")).toBe(true);
    expect(result.current.getIsWaitingForAI("s2")).toBe(false);
  });

  it("removes session timeline", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addMessage("s1", "hello", "user");
    });
    act(() => {
      result.current.removeSessionData("s1");
    });
    expect(result.current.getTimeline("s1")).toEqual([]);
  });

  it("adds message with image", () => {
    const { result } = renderHook(() => useMultiChat());
    act(() => {
      result.current.addMessage(
        "s1",
        "check this",
        "user",
        "data:image/png;base64,abc",
      );
    });
    const timeline = result.current.getTimeline("s1");
    if (timeline[0].kind === "message") {
      expect(timeline[0].data.imageUrl).toBe("data:image/png;base64,abc");
    }
  });
});
