import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelSwitch } from "./model-switch";

describe("model-switch", () => {
  it("renders Opus and Sonnet buttons", () => {
    render(
      <ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Opus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sonnet" })).toBeInTheDocument();
  });

  it("highlights the selected model", () => {
    render(
      <ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Opus" }).className).toContain(
      "bg-blue-950",
    );
    expect(
      screen.getByRole("button", { name: "Sonnet" }).className,
    ).not.toContain("bg-blue-950");
  });

  it("calls onModelChange when clicking a different model", async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    render(
      <ModelSwitch
        selectedModel="claude-opus-4-6"
        onModelChange={onModelChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Sonnet" }));
    expect(onModelChange).toHaveBeenCalledWith("claude-sonnet-4-6");
  });
});
