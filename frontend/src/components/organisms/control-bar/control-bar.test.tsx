import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ControlBar } from "./control-bar";

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("control-bar", () => {
  const defaultProps = {
    textValue: "",
    onTextChange: vi.fn(),
    onSend: vi.fn(),
    isRecording: false,
    onMicToggle: vi.fn(),
    silenceTimerText: "",
    isWaitingForAI: false,
    pendingImageUrls: [] as string[],
    onImagePaste: vi.fn(),
    onImageRemove: vi.fn(),
    silenceDelaySeconds: 1,
    onSilenceDelayChange: vi.fn(),
  };

  it("renders text input", () => {
    renderWithTooltip(<ControlBar {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("テキストで入力..."),
    ).toBeInTheDocument();
  });

  it("renders send button", () => {
    renderWithTooltip(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle("送信")).toBeInTheDocument();
  });

  it("renders mic button", () => {
    renderWithTooltip(<ControlBar {...defaultProps} />);
    expect(screen.getByTitle("音声入力")).toBeInTheDocument();
  });

  it("calls onSend when send button clicked with text", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithTooltip(<ControlBar {...defaultProps} textValue="hello" onSend={onSend} />);
    await user.click(screen.getByTitle("送信"));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("calls onMicToggle when mic clicked", async () => {
    const user = userEvent.setup();
    const onMicToggle = vi.fn();
    renderWithTooltip(<ControlBar {...defaultProps} onMicToggle={onMicToggle} />);
    await user.click(screen.getByTitle("音声入力"));
    expect(onMicToggle).toHaveBeenCalledOnce();
  });

  it("applies active styling when recording", () => {
    renderWithTooltip(<ControlBar {...defaultProps} isRecording={true} />);
    expect(screen.getByTitle("音声入力").className).toContain("border-red-500");
  });

  it("shows silence timer text", () => {
    renderWithTooltip(<ControlBar {...defaultProps} silenceTimerText="話し中..." />);
    expect(screen.getByText("話し中...")).toBeInTheDocument();
  });

  it("shows image preview when pendingImageUrls has items", () => {
    renderWithTooltip(
      <ControlBar
        {...defaultProps}
        pendingImageUrls={["data:image/png;base64,abc"]}
      />,
    );
    expect(screen.getByAltText("添付画像1")).toBeInTheDocument();
  });

  it("shows multiple image previews", () => {
    renderWithTooltip(
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
    renderWithTooltip(
      <ControlBar
        {...defaultProps}
        pendingImageUrls={["data:image/png;base64,abc"]}
        onImageRemove={onImageRemove}
      />,
    );
    // The destructive button doesn't have title anymore, find by aria or text
    const removeButton = screen
      .getByAltText("添付画像1")
      .closest("span")
      ?.querySelector("button");
    expect(removeButton).toBeTruthy();
    if (removeButton) await user.click(removeButton);
    expect(onImageRemove).toHaveBeenCalledWith(0);
  });
});
