import { useEffect, useRef } from "react";
import type { TimelineItem } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";
import { ChatMessage } from "../../molecules/chat-message/chat-message";
import { ActionLog } from "../action-log/action-log";
import "./chat-area.css";

interface ChatAreaProps {
  timeline: TimelineItem[];
}

export function ChatArea({ timeline }: ChatAreaProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on timeline changes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [timeline]);

  return (
    <div className="chat-area" ref={chatRef} data-testid="chat-area">
      {timeline.map((item) => {
        switch (item.kind) {
          case "message":
            return (
              <ChatMessage
                key={item.data.id}
                type={item.data.type}
                text={item.data.text}
              />
            );
          case "action-log":
            return (
              <ActionLog
                key={item.data.id}
                actions={item.data.actions}
                status={item.data.status}
              />
            );
          case "processing":
            return (
              <div
                key={`processing-${item.text}`}
                className="message system processing"
              >
                <Spinner />
                <span>{item.text}</span>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
