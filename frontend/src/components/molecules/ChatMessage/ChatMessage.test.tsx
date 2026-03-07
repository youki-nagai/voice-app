import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessage } from "./ChatMessage";

describe("ChatMessage", () => {
  it("renders user message", () => {
    render(<ChatMessage type="user" text="こんにちは" />);
    const msg = screen.getByText("こんにちは").closest(".message");
    expect(msg).toHaveClass("message", "user");
  });

  it("renders ai message", () => {
    render(<ChatMessage type="ai" text="応答です" />);
    const msg = screen.getByText("応答です").closest(".message");
    expect(msg).toHaveClass("message", "ai");
  });

  it("renders error message", () => {
    render(<ChatMessage type="error" text="エラー発生" />);
    const msg = screen.getByText("エラー発生").closest(".message");
    expect(msg).toHaveClass("message", "error");
  });

  it("renders system message", () => {
    render(<ChatMessage type="system" text="システム通知" />);
    const msg = screen.getByText("システム通知").closest(".message");
    expect(msg).toHaveClass("message", "system");
  });

  it("renders interim message", () => {
    render(<ChatMessage type="interim" text="入力中..." />);
    const msg = screen.getByText("入力中...").closest(".message");
    expect(msg).toHaveClass("message", "interim");
  });

  it("renders test-pass message", () => {
    render(<ChatMessage type="test-pass" text="テスト OK" />);
    const msg = screen.getByText("テスト OK").closest(".message");
    expect(msg).toHaveClass("message", "test-pass");
  });

  it("renders commit message", () => {
    render(<ChatMessage type="commit" text="committed: fix bug" />);
    const msg = screen.getByText("committed: fix bug").closest(".message");
    expect(msg).toHaveClass("message", "commit");
  });
});
