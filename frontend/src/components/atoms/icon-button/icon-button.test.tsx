import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./icon-button";

describe("icon-button", () => {
  it("renders with children", () => {
    render(<IconButton aria-label="test">Click me</IconButton>);
    expect(screen.getByRole("button", { name: "test" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="test" onClick={onClick}>
        Click
      </IconButton>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="test" onClick={onClick} disabled>
        Click
      </IconButton>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies active styling when active with mic variant", () => {
    render(
      <IconButton aria-label="test" active variant="mic">
        Click
      </IconButton>,
    );
    expect(screen.getByRole("button").className).toContain("border-red-500");
  });

  it("applies variant styling", () => {
    render(
      <IconButton aria-label="test" variant="mic">
        Click
      </IconButton>,
    );
    expect(screen.getByRole("button").className).toContain("rounded-full");
  });
});
