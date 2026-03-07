import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "./header";

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("header", () => {
  const defaultProps = {
    selectedModel: "claude-opus-4-6" as const,
    onModelChange: vi.fn(),
    appStatus: "connected" as const,
    appStatusText: "準備完了",
    onHelpToggle: vi.fn(),
  };

  it("renders title", () => {
    renderWithTooltip(<Header {...defaultProps} />);
    expect(screen.getByText("voice-app")).toBeInTheDocument();
  });

  it("renders model switch", () => {
    renderWithTooltip(<Header {...defaultProps} />);
    expect(screen.getByRole("radio", { name: "Opus" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sonnet" })).toBeInTheDocument();
  });

  it("renders app status", () => {
    renderWithTooltip(<Header {...defaultProps} />);
    expect(screen.getByText("準備完了")).toBeInTheDocument();
  });

  it("delegates model change", async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    renderWithTooltip(
      <Header {...defaultProps} onModelChange={onModelChange} />,
    );
    await user.click(screen.getByRole("radio", { name: "Sonnet" }));
    expect(onModelChange).toHaveBeenCalledWith("claude-sonnet-4-6");
  });
});
