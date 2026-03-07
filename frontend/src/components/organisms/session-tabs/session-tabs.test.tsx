import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionTabs } from "./session-tabs";

const baseSessions = [
  { id: "s1", name: "Chat 1" },
  { id: "s2", name: "Chat 2" },
];

const defaultProps = {
  sessions: baseSessions,
  activeSessionId: "s1",
  secondarySessionId: null,
  isSplitView: false,
  onSelectSession: vi.fn(),
  onAddSession: vi.fn(),
  onRemoveSession: vi.fn(),
  onSplitSession: vi.fn(),
  onUnsplit: vi.fn(),
  waitingSessionIds: [] as string[],
};

describe("SessionTabs", () => {
  it("renders all session tabs", () => {
    render(<SessionTabs {...defaultProps} />);
    expect(screen.getByText("Chat 1")).toBeInTheDocument();
    expect(screen.getByText("Chat 2")).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(<SessionTabs {...defaultProps} />);
    const activeTab = screen.getByText("Chat 1").closest("[role=tab]");
    expect(activeTab?.getAttribute("data-active")).toBe("true");
  });

  it("calls onSelectSession when clicking a tab", () => {
    const onSelect = vi.fn();
    render(<SessionTabs {...defaultProps} onSelectSession={onSelect} />);
    fireEvent.click(screen.getByText("Chat 2"));
    expect(onSelect).toHaveBeenCalledWith("s2", undefined);
  });

  it("calls onAddSession when clicking add button", () => {
    const onAdd = vi.fn();
    render(<SessionTabs {...defaultProps} onAddSession={onAdd} />);
    fireEvent.click(screen.getByTitle("新しいチャット"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("calls onRemoveSession when clicking close button", () => {
    const onRemove = vi.fn();
    render(<SessionTabs {...defaultProps} onRemoveSession={onRemove} />);
    const closeButtons = screen.getAllByTitle("チャットを閉じる");
    fireEvent.click(closeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith("s1");
  });

  it("hides close button when only one session", () => {
    render(
      <SessionTabs {...defaultProps} sessions={[baseSessions[0]]} />,
    );
    expect(screen.queryByTitle("チャットを閉じる")).not.toBeInTheDocument();
  });

  it("shows processing indicator on waiting sessions", () => {
    render(<SessionTabs {...defaultProps} waitingSessionIds={["s2"]} />);
    const s2Tab = screen.getByText("Chat 2").closest("[role=tab]");
    expect(s2Tab?.querySelector("[data-processing]")).toBeInTheDocument();
  });

  it("shows split button on non-active tabs", () => {
    render(<SessionTabs {...defaultProps} />);
    expect(screen.getByTitle("右パネルで開く")).toBeInTheDocument();
  });

  it("calls onSplitSession when clicking split button", () => {
    const onSplit = vi.fn();
    render(<SessionTabs {...defaultProps} onSplitSession={onSplit} />);
    fireEvent.click(screen.getByTitle("右パネルで開く"));
    expect(onSplit).toHaveBeenCalledWith("s2");
  });

  it("shows unsplit button in split view", () => {
    render(
      <SessionTabs
        {...defaultProps}
        secondarySessionId="s2"
        isSplitView={true}
      />,
    );
    expect(screen.getByTitle("分割を解除")).toBeInTheDocument();
  });

  it("shows L/R labels in split view", () => {
    render(
      <SessionTabs
        {...defaultProps}
        secondarySessionId="s2"
        isSplitView={true}
      />,
    );
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });
});
