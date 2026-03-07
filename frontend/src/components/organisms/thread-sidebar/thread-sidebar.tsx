import { Columns2, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ThreadSummary {
  session_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ThreadSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectThread: (sessionId: string) => void;
  onSplitThread: (sessionId: string) => void;
  onNewChat: () => void;
  activeSessionId: string;
  secondarySessionId: string | null;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function ThreadSidebar({
  isOpen,
  onToggle,
  onSelectThread,
  onSplitThread,
  onNewChat,
  activeSessionId,
  secondarySessionId,
}: ThreadSidebarProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/voice/threads");
      if (res.ok) {
        const data: ThreadSummary[] = await res.json();
        setThreads(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchThreads();
    }
  }, [isOpen, fetchThreads]);

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 top-16 z-10 h-8 w-8"
            onClick={onToggle}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>スレッド一覧を開く</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const isSplitView = secondarySessionId !== null;

  return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-zinc-900">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-xs font-semibold text-foreground">
            スレッド
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onNewChat}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>新しいチャット</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onToggle}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>サイドバーを閉じる</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          {isLoading && threads.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              読み込み中...
            </div>
          ) : threads.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              スレッドがありません
            </div>
          ) : (
            <ul className="py-1">
              {threads.map((thread, index) => {
                const isPrimary = thread.session_id === activeSessionId;
                const isSecondary = thread.session_id === secondarySessionId;
                const isActive = isPrimary || isSecondary;
                const number = index + 1;
                const canSplit = !isPrimary && !isSecondary;

                return (
                  <li key={thread.session_id}>
                    <div
                      className={`group flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectThread(thread.session_id)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        <span className="mt-0.5 w-4 shrink-0 text-center text-[10px] font-bold opacity-60">
                          {number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isSplitView && isPrimary && (
                              <span className="shrink-0 rounded bg-blue-500/20 px-1 text-[9px] font-bold leading-tight text-blue-400">
                                L
                              </span>
                            )}
                            {isSplitView && isSecondary && (
                              <span className="shrink-0 rounded bg-emerald-500/20 px-1 text-[9px] font-bold leading-tight text-emerald-400">
                                R
                              </span>
                            )}
                            <span className="truncate">
                              {thread.title || "無題のスレッド"}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[10px] opacity-60">
                            {formatDate(thread.updated_at)}
                          </div>
                        </div>
                      </button>
                      {canSplit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-0.5 h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSplitThread(thread.session_id);
                              }}
                            >
                              <Columns2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>右パネルで開く</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </aside>
  );
}
