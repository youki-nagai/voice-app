import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SilenceState } from "../../../hooks/use-speech-recognition";
import { IconButton } from "../../atoms/icon-button/icon-button";
import { SendIcon } from "../../atoms/icons";
import { MicButton } from "../../atoms/mic-button/mic-button";
import { TextInput } from "../../atoms/text-input/text-input";

interface ControlBarProps {
  textValue: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
  isRecording: boolean;
  onMicToggle: () => void;
  silenceState: SilenceState;
  countdownKey: number;
  isWaitingForAI: boolean;
  pendingImageUrls: string[];
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageRemove: (index: number) => void;
  silenceDelaySeconds: number;
  onSilenceDelayChange: (seconds: number) => void;
}

export function ControlBar({
  textValue,
  onTextChange,
  onSend,
  isRecording,
  onMicToggle,
  silenceState,
  countdownKey,
  isWaitingForAI,
  pendingImageUrls,
  onImagePaste,
  onImageRemove,
  silenceDelaySeconds,
  onSilenceDelayChange,
}: ControlBarProps) {
  const handleSend = () => {
    if (textValue.trim() && !isWaitingForAI) {
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-4 border-t border-border bg-background px-5 py-4">
      <div className="flex flex-1 items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3">
        {pendingImageUrls.map((url, index) => (
          <span key={url.slice(-20)} className="relative mr-2 inline-block">
            <img
              src={url}
              alt={`添付画像${index + 1}`}
              className="max-h-9 rounded-md border border-border align-middle"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full"
              onClick={() => onImageRemove(index)}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </span>
        ))}
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

      <div className="flex flex-col items-center gap-0.5">
        <MicButton
          isRecording={isRecording}
          silenceState={silenceState}
          countdownKey={countdownKey}
          silenceDelayMs={silenceDelaySeconds * 1000}
          onClick={onMicToggle}
        />
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-5 w-5"
                onClick={() =>
                  onSilenceDelayChange(Math.max(0.5, silenceDelaySeconds - 0.5))
                }
                disabled={silenceDelaySeconds <= 0.5}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>沈黙時間を減らす</p>
            </TooltipContent>
          </Tooltip>
          <span className="min-w-[40px] text-center text-[10px] text-muted-foreground">
            {silenceDelaySeconds}秒
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-5 w-5"
                onClick={() =>
                  onSilenceDelayChange(Math.min(10, silenceDelaySeconds + 0.5))
                }
                disabled={silenceDelaySeconds >= 10}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>沈黙時間を増やす</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
