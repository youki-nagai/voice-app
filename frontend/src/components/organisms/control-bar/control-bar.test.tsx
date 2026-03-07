import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ControlBar } from "./control-bar";

describe("control-bar", () => {
  const defaultProps = {
    textValue: "",
    onTextChange: vi.fn(),
    onSend: vi.fn(),
    isRecording: false,
    onMicToggle: vi.fn(),
    silenceState: "idle" as const,
    countdownKey: 0,
    isWaitingForAI: false,
    pendingImageUrls: [] as string[],
    onImagePaste: vi.fn(),
    onImageRemove: vi.fn(),
    silenceDelaySeconds: 1,
    onSilenceDelayChange: vi.fn(),
  };

  it("renders text input", () => {
    render(<ControlBar {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("テキストで入力..."),
    ).toBeInTheDocument();
  });

  it("renders send button", () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle("送信")).toBeInTheDocument();
  });

  it("renders mic button", () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle("音声入力")).toBeInTheDocument();
  });

  it("calls onSend when send button clicked with text", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ControlBar {...defaultProps} textValue="hello" onSend={onSend} />);
    await user.click(screen.getByTitle("送信"));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("calls onMicToggle when mic clicked", async () => {
    const user = userEvent.setup();
    const onMicToggle = vi.fn();
    render(<ControlBar {...defaultProps} onMicToggle={onMicToggle} />);
    await user.click(screen.getByTitle("音声入力"));
    expect(onMicToggle).toHaveBeenCalledOnce();
  });

  it("shows countdown ring when in countdown state", () => {
    const { container } = render(
      <ControlBar
        {...defaultProps}
        isRecording={true}
        silenceState="countdown"
      />,
    );
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it("shows check icon when sent", () => {
    const { container } = render(
      <ControlBar {...defaultProps} isRecording={true} silenceState="sent" />,
    );
    const svg = container.querySelector(".lucide-check");
    expect(svg).toBeInTheDocument();
  });

  it("shows image preview when pendingImageUrls has items", () => {
    render(
      <ControlBar
        {...defaultProps}
        pendingImageUrls={["data:image/png;base64,abc"]}
      />,
    );
    expect(screen.getByAltText("添付画像1")).toBeInTheDocument();
  });

  it("shows multiple image previews", () => {
    render(
      <ControlBar
        {...defaultProps}
        pendingImageUrls={[
          "data:image/png;base64,abc",
          "data:image/png;base64,def",
        ]}
      />,
    );
    expect(screen.getByAltText("添付画像1")).toBeInTheDocument();
    expect(screen.getByAltText("添付画像2")).toBeInTheDocument();
  });

  it("calls onImageRemove with index when remove button clicked", async () => {
    const user = userEvent.setup();
    const onImageRemove = vi.fn();
    render(
      <ControlBar
        {...defaultProps}
        pendingImageUrls={["data:image/png;base64,abc"]}
        onImageRemove={onImageRemove}
      />,
    );
    const removeButton = screen
      .getByAltText("添付画像1")
      .closest("span")
      ?.querySelector("button");
    expect(removeButton).toBeTruthy();
    if (removeButton) await user.click(removeButton);
    expect(onImageRemove).toHaveBeenCalledWith(0);
  });
});
