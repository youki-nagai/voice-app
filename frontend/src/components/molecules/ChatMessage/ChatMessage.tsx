import type { ChatMessageType } from '../../../types/messages';
import { Spinner } from '../../atoms/Spinner/Spinner';
import './ChatMessage.css';

interface ChatMessageProps {
  type: ChatMessageType;
  text: string;
  isProcessing?: boolean;
}

export function ChatMessage({ type, text, isProcessing }: ChatMessageProps) {
  return (
    <div className={`message ${type}`}>
      {isProcessing && <Spinner />}
      <span>{text}</span>
    </div>
  );
}
