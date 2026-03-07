import { X } from "lucide-react";
import { IconButton } from "../../atoms/icon-button/icon-button";
import { MicIcon, SendIcon } from "../../atoms/icons";
import { TextInput } from "../../atoms/text-input/text-input";

interface ControlBarProps {
  textValue: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
  isRecording: boolean;
  onMicToggle: () => void;
  silenceTimerText: string;
  isWaitingForAI: boolean;
  pendingImageUrl: string | null;
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageRemove: () => void;
}

export function ControlBar({
  textValue,
  onTextChange,
  onSend,
  isRecording,
  onMicToggle,
  silenceTimerText,
  isWaitingForAI,
  pendingImageUrl,
  onImagePaste,
  onImageRemove,
}: ControlBarProps) {
  const handleSend = () => {
    if (textValue.trim() && !isWaitingForAI) {
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-4 border-t border-border bg-background px-5 py-4">
      <div className="flex flex-1 items-center gap-3 rounded-3xl border border-border bg-card px-4 py-2">
        {pendingImageUrl && (
          <span className="relative mr-2 inline-block">
            <img
              src={pendingImageUrl}
              alt="添付画像"
              className="max-h-9 rounded-md border border-border align-middle"
            />
            <button
              type="button"
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
              title="画像を削除"
              onClick={onImageRemove}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        <TextInput
          value={textValue}
          onChange={onTextChange}
          onSubmit={handleSend}
          onPaste={onImagePaste}
          placeholder="テキストで入力..."
        />
        <IconButton
          variant="send"
          title="送信"
          onClick={handleSend}
          disabled={!textValue.trim() || isWaitingForAI}
        >
          <SendIcon className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="min-w-[60px] text-center text-[11px] text-muted-foreground">
            {silenceTimerText}
          </span>
          <IconButton
            variant="mic"
            title="音声入力"
            active={isRecording}
            onClick={onMicToggle}
          >
            <MicIcon className="h-5 w-5" />
          </IconButton>
          <span className="text-center text-[10px] text-muted-foreground">
            1秒の沈黙で送信
          </span>
        </div>
      </div>
    </div>
  );
}
