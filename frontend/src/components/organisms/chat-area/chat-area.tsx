import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineItem } from "../../../types/messages";
import { Spinner } from "../../atoms/spinner/spinner";
import { ChatMessage } from "../../molecules/chat-message/chat-message";
import { ActionLog } from "../action-log/action-log";

const AUTO_SCROLL_THRESHOLD = 50;

interface ChatAreaProps {
  timeline: TimelineItem[];
}

export function ChatArea({ timeline }: ChatAreaProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const nearBottom =
      scrollHeight - scrollTop - clientHeight < AUTO_SCROLL_THRESHOLD;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on timeline changes
  useEffect(() => {
    if (chatRef.current && isNearBottomRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [timeline]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4"
        ref={chatRef}
        data-testid="chat-area"
        onScroll={handleScroll}
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
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-700 p-2 text-white shadow-lg transition-opacity hover:bg-zinc-600"
          aria-label="最新メッセージへスクロール"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
