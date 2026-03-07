import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessage } from "./chat-message";

describe("chat-message", () => {
  it("renders user message", () => {
    render(<ChatMessage type="user" text="こんにちは" />);
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.getByText("こんにちは").parentElement?.className).toContain(
      "self-end",
    );
  });

  it("renders ai message", () => {
    render(<ChatMessage type="ai" text="応答です" />);
    expect(screen.getByText("応答です")).toBeInTheDocument();
    expect(screen.getByText("応答です").parentElement?.className).toContain(
      "self-start",
    );
  });

  it("renders error message", () => {
    render(<ChatMessage type="error" text="エラー発生" />);
    expect(screen.getByText("エラー発生")).toBeInTheDocument();
    expect(screen.getByText("エラー発生").parentElement?.className).toContain(
      "bg-red-950",
    );
  });

  it("renders system message", () => {
    render(<ChatMessage type="system" text="システム通知" />);
    expect(screen.getByText("システム通知")).toBeInTheDocument();
    expect(screen.getByText("システム通知").parentElement?.className).toContain(
      "self-center",
    );
  });

  it("renders interim message", () => {
    render(<ChatMessage type="interim" text="入力中..." />);
    expect(screen.getByText("入力中...")).toBeInTheDocument();
    expect(screen.getByText("入力中...").parentElement?.className).toContain(
      "italic",
    );
  });

  it("renders test-pass message", () => {
    render(<ChatMessage type="test-pass" text="テスト OK" />);
    expect(screen.getByText("テスト OK")).toBeInTheDocument();
    expect(screen.getByText("テスト OK").parentElement?.className).toContain(
      "bg-green-950",
    );
  });

  it("renders commit message", () => {
    render(<ChatMessage type="commit" text="committed: fix bug" />);
    expect(screen.getByText("committed: fix bug")).toBeInTheDocument();
    expect(
      screen.getByText("committed: fix bug").parentElement?.className,
    ).toContain("font-mono");
  });
});
