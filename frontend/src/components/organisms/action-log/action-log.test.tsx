import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ToolAction } from "../../../types/messages";
import { ActionLog } from "./action-log";

describe("action-log", () => {
  const actions: ToolAction[] = [
    { tool: "bash", text: "コマンド実行", status: "done" },
    { tool: "read", text: "ファイル読み込み", status: "running" },
  ];

  it("renders action count", () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId("action-count")).toHaveTextContent("2");
  });

  it("shows spinner when running", () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId("action-log-spinner")).toBeInTheDocument();
  });

  it("does not show spinner when done", () => {
    render(<ActionLog actions={actions} status="done" />);
    expect(screen.queryByTestId("action-log-spinner")).not.toBeInTheDocument();
  });

  it("shows current action text when running", () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByTestId("action-log-current")).toHaveTextContent(
      "ファイル読み込み",
    );
  });

  it("shows 完了 when done", () => {
    render(<ActionLog actions={actions} status="done" />);
    expect(screen.getByTestId("action-log-current")).toHaveTextContent("完了");
  });

  it("renders all action items when open", () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByText("コマンド実行")).toBeInTheDocument();
    expect(
      screen.getAllByText("ファイル読み込み").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("is closed when done", () => {
    render(<ActionLog actions={actions} status="done" />);
    // Collapsible content should be hidden when done (initial state is closed)
    expect(screen.queryByText("コマンド実行")).not.toBeInTheDocument();
  });

  it("is open when running", () => {
    render(<ActionLog actions={actions} status="running" />);
    expect(screen.getByText("コマンド実行")).toBeInTheDocument();
  });

  it("can toggle open/close", async () => {
    const user = userEvent.setup();
    render(<ActionLog actions={actions} status="running" />);
    const trigger = screen.getByText("Claude の作業").closest("button");
    expect(trigger).toBeTruthy();
    if (trigger) await user.click(trigger);
    // After clicking, content should be hidden
    expect(screen.queryByText("コマンド実行")).not.toBeInTheDocument();
  });
});
