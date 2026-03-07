import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TimelineItem } from "../../../types/messages";
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
                  className="flex items-center justify-center gap-2.5 self-center rounded-full border border-amber-500/20 bg-amber-950/60 px-4 py-2 text-xs text-amber-400 backdrop-blur-sm"
                >
                  <div className="flex gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                      style={{
                        animation: "processing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0ms",
                      }}
                    />
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                      style={{
                        animation: "processing-dot 1.4s infinite ease-in-out",
                        animationDelay: "200ms",
                      }}
                    />
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                      style={{
                        animation: "processing-dot 1.4s infinite ease-in-out",
                        animationDelay: "400ms",
                      }}
                    />
                  </div>
                  <span>{item.text}</span>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
          onClick={scrollToBottom}
          aria-label="最新メッセージへスクロール"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
