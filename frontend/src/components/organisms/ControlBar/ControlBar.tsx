import { TextInput } from '../../atoms/TextInput/TextInput';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { MicIcon, SendIcon } from '../../atoms/Icons';
import './ControlBar.css';

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
    <div className="control-bar">
      <div className="input-section">
        {pendingImageUrl && (
          <span className="image-preview-container">
            <img src={pendingImageUrl} alt="添付画像" />
            <button className="image-preview-remove" title="画像を削除" onClick={onImageRemove}>&times;</button>
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
          <SendIcon />
        </IconButton>
      </div>

      <div className="voice-section">
        <div className="voice-control">
          <span className="silence-timer">{silenceTimerText}</span>
          <IconButton
            variant="mic"
            title="音声入力"
            active={isRecording}
            onClick={onMicToggle}
          >
            <MicIcon />
          </IconButton>
          <span className="silence-info">1秒の沈黙で送信</span>
        </div>
      </div>
    </div>
  );
}
