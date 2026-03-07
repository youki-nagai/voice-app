import { useEffect, useRef } from 'react';
import { ChatMessage } from '../../molecules/ChatMessage/ChatMessage';
import { ActionLog } from '../ActionLog/ActionLog';
import { Spinner } from '../../atoms/Spinner/Spinner';
import type { TimelineItem } from '../../../types/messages';
import './ChatArea.css';

interface ChatAreaProps {
  timeline: TimelineItem[];
}

export function ChatArea({ timeline }: ChatAreaProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [timeline]);

  return (
    <div className="chat-area" ref={chatRef} data-testid="chat-area">
      {timeline.map((item, i) => {
        switch (item.kind) {
          case 'message':
            return <ChatMessage key={item.data.id} type={item.data.type} text={item.data.text} />;
          case 'action-log':
            return <ActionLog key={item.data.id} actions={item.data.actions} status={item.data.status} />;
          case 'processing':
            return (
              <div key={`processing-${i}`} className="message system processing">
                <Spinner />
                <span>{item.text}</span>
              </div>
            );
        }
      })}
    </div>
  );
}
