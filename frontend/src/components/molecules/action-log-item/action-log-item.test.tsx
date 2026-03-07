import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionLogItem } from "./action-log-item";

describe("action-log-item", () => {
  it("renders with running status and spinner", () => {
    render(
      <ActionLogItem tool="bash" text="コマンド実行中" status="running" />,
    );
    expect(screen.getByText("コマンド実行中")).toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders with done status and checkmark", () => {
    render(
      <ActionLogItem tool="read" text="ファイル読み込み完了" status="done" />,
    );
    expect(screen.getByText("ファイル読み込み完了")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders correct icon for tool type", () => {
    render(<ActionLogItem tool="bash" text="テスト" status="running" />);
    expect(screen.getByTestId("action-icon")).toHaveTextContent("⚡");
  });

  it("renders correct icon for read tool", () => {
    render(<ActionLogItem tool="read" text="テスト" status="done" />);
    expect(screen.getByTestId("action-icon")).toHaveTextContent("📖");
  });

  it("renders fallback icon for unknown tool", () => {
    render(<ActionLogItem tool="unknown" text="テスト" status="done" />);
    expect(screen.getByTestId("action-icon")).toHaveTextContent("🔧");
  });
});
