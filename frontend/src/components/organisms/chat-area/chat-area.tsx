import { useEffect, useRef } from "react";
import type { TimelineItem } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";
import { ChatMessage } from "../../molecules/chat-message/chat-message";
import { ActionLog } from "../action-log/action-log";

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
    <div
      className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4"
      ref={chatRef}
      data-testid="chat-area"
    >
      <div className="mt-auto" />
      {timeline.map((item) => {
        switch (item.kind) {
          case "message":
            return (
              <ChatMessage
                key={item.data.id}
                type={item.data.type}
                text={item.data.text}
                imageUrl={item.data.imageUrl}
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
                className="flex items-center justify-center gap-2 self-center rounded-lg bg-orange-950 px-3.5 py-2.5 text-xs text-amber-500"
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
