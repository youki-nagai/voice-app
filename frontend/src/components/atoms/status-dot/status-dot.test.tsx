import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./status-dot";

describe("status-dot", () => {
  it("renders with connected status", () => {
    render(<StatusDot status="connected" />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("connected");
  });

  it("renders with recording status", () => {
    render(<StatusDot status="recording" />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("recording");
  });

  it("renders with processing status", () => {
    render(<StatusDot status="processing" />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("processing");
  });

  it("renders with error status", () => {
    render(<StatusDot status="error" />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("error");
  });
});
