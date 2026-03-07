import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelSwitch } from "./model-switch";

describe("model-switch", () => {
  it("renders Opus and Sonnet options", () => {
    render(
      <ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: "Opus" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sonnet" })).toBeInTheDocument();
  });

  it("marks the selected model as checked", () => {
    render(
      <ModelSwitch selectedModel="claude-opus-4-6" onModelChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: "Opus" })).toHaveAttribute(
      "data-state",
      "on",
    );
    expect(screen.getByRole("radio", { name: "Sonnet" })).toHaveAttribute(
      "data-state",
      "off",
    );
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
    await user.click(screen.getByRole("radio", { name: "Sonnet" }));
    expect(onModelChange).toHaveBeenCalledWith("claude-sonnet-4-6");
  });
});
