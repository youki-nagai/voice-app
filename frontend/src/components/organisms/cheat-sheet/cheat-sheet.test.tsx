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

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<CheatSheet isOpen onClose={onClose} />);
    fireEvent.click(screen.getByTestId("cheat-sheet-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<CheatSheet isOpen onClose={onClose} />);
    fireEvent.click(screen.getByTitle("閉じる"));
    expect(onClose).toHaveBeenCalled();
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
