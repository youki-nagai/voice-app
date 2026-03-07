import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextInput } from "./text-input";

describe("text-input", () => {
  it("calls onSubmit on Command+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox"), "{Meta>}{Enter}{/Meta}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not call onSubmit on Enter without Command", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox"), "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
