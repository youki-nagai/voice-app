import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionTabs } from "./session-tabs";

const baseSessions = [
  { id: "s1", name: "Chat 1" },
  { id: "s2", name: "Chat 2" },
];

describe("SessionTabs", () => {
  it("renders all session tabs", () => {
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        onRemoveSession={vi.fn()}
        waitingSessionIds={[]}
      />,
    );
    expect(screen.getByText("Chat 1")).toBeInTheDocument();
    expect(screen.getByText("Chat 2")).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        onRemoveSession={vi.fn()}
        waitingSessionIds={[]}
      />,
    );
    const activeTab = screen.getByText("Chat 1").closest("[role=tab]");
    expect(activeTab?.getAttribute("data-active")).toBe("true");
  });

  it("calls onSelectSession when clicking a tab", () => {
    const onSelect = vi.fn();
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={onSelect}
        onAddSession={vi.fn()}
        onRemoveSession={vi.fn()}
        waitingSessionIds={[]}
      />,
    );
    fireEvent.click(screen.getByText("Chat 2"));
    expect(onSelect).toHaveBeenCalledWith("s2");
  });

  it("calls onAddSession when clicking add button", () => {
    const onAdd = vi.fn();
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={onAdd}
        onRemoveSession={vi.fn()}
        waitingSessionIds={[]}
      />,
    );
    fireEvent.click(screen.getByTitle("新しいチャット"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("calls onRemoveSession when clicking close button", () => {
    const onRemove = vi.fn();
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        onRemoveSession={onRemove}
        waitingSessionIds={[]}
      />,
    );
    const closeButtons = screen.getAllByTitle("チャットを閉じる");
    fireEvent.click(closeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith("s1");
  });

  it("hides close button when only one session", () => {
    render(
      <SessionTabs
        sessions={[baseSessions[0]]}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        onRemoveSession={vi.fn()}
        waitingSessionIds={[]}
      />,
    );
    expect(screen.queryByTitle("チャットを閉じる")).not.toBeInTheDocument();
  });

  it("shows processing indicator on waiting sessions", () => {
    render(
      <SessionTabs
        sessions={baseSessions}
        activeSessionId="s1"
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        onRemoveSession={vi.fn()}
        waitingSessionIds={["s2"]}
      />,
    );
    const s2Tab = screen.getByText("Chat 2").closest("[role=tab]");
    expect(s2Tab?.querySelector("[data-processing]")).toBeInTheDocument();
  });
});
