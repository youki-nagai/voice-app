import { useEffect, useRef } from 'react';
import { ChatMessage } from '../../molecules/ChatMessage/ChatMessage';
import { ActionLog } from '../ActionLog/ActionLog';
import { Spinner } from '../../atoms/Spinner/Spinner';
import type { ChatMessage as ChatMessageType, ActionLog as ActionLogType } from '../../../types/messages';
import './ChatArea.css';

interface ChatAreaProps {
  messages: ChatMessageType[];
  actionLogs: ActionLogType[];
  processingText: string | null;
}

export function ChatArea({ messages, actionLogs, processingText }: ChatAreaProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, actionLogs, processingText]);

  // Build a timeline of messages and action logs by insertion order
  // For simplicity, action logs appear after all messages
  return (
    <div className="chat-area" ref={chatRef} data-testid="chat-area">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} type={msg.type} text={msg.text} />
      ))}
      {actionLogs.map((log) => (
        <ActionLog key={log.id} actions={log.actions} status={log.status} />
      ))}
      {processingText && (
        <div className="message system processing">
          <Spinner />
          <span>{processingText}</span>
        </div>
      )}
    </div>
  );
}
