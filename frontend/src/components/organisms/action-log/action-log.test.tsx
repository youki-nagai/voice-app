import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToolAction } from "../../../types/messages";
import { ActionLog } from "./action-log";

describe("action-log", () => {
  const actions: ToolAction[] = [
    { tool: "bash", text: "コマンド実行", status: "done" },
    { tool: "read", text: "ファイル読み込み", status: "running" },
  ];

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

  it("initial open state depends on status", () => {
    const { unmount } = render(
      <ActionLog actions={actions} status="running" />,
    );
    expect(screen.getByText("コマンド実行")).toBeInTheDocument();
    unmount();

    render(<ActionLog actions={actions} status="done" />);
    expect(screen.queryByText("コマンド実行")).not.toBeInTheDocument();
  });
});
