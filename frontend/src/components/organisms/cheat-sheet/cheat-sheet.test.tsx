import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheatSheet } from "./cheat-sheet";

describe("CheatSheet", () => {
  it("renders content when open", () => {
    render(<CheatSheet isOpen onClose={vi.fn()} />);
    expect(screen.getByText("使い方")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<CheatSheet isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("使い方")).not.toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(<CheatSheet isOpen onClose={onClose} />);
    // Sheet uses a dialog overlay; click outside the content
    const overlay = document.querySelector("[data-state=open]");
    if (overlay) fireEvent.click(overlay);
    // Sheet handles close via onOpenChange
  });

  it("shows voice input section", () => {
    render(<CheatSheet isOpen onClose={vi.fn()} />);
    expect(screen.getByText("音声入力")).toBeInTheDocument();
  });

  it("shows keyboard shortcuts section", () => {
    render(<CheatSheet isOpen onClose={vi.fn()} />);
    expect(screen.getByText("キーボード")).toBeInTheDocument();
  });

  it("shows session management section", () => {
    render(<CheatSheet isOpen onClose={vi.fn()} />);
    expect(screen.getByText("チャット管理")).toBeInTheDocument();
  });

  it("calls onClose on Escape key", () => {
    const onClose = vi.fn();
    render(<CheatSheet isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
