import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

describe("spinner", () => {
  it("renders with default size", () => {
    render(<Spinner />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner.getAttribute("class")).toContain("animate-spin");
  });

  it("renders with small size", () => {
    render(<Spinner size="small" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner.getAttribute("class")).toContain("h-2.5");
  });
});
