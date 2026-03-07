import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  onNewChat: () => void;
  activeSessionId: string;
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
  onNewChat,
  activeSessionId,
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
      <button
        type="button"
        onClick={onToggle}
        className="absolute left-3 top-16 z-10 rounded-lg bg-zinc-800 p-2 text-muted-foreground transition-colors hover:bg-zinc-700 hover:text-foreground"
        title="スレッド一覧を開く"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-zinc-900">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-semibold text-foreground">スレッド</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewChat}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            title="新しいチャット"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
            title="サイドバーを閉じる"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
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
            {threads.map((thread) => {
              const isActive = thread.session_id === activeSessionId;
              return (
                <li key={thread.session_id}>
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.session_id)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        {thread.title || "無題のスレッド"}
                      </div>
                      <div className="mt-0.5 text-[10px] opacity-60">
                        {formatDate(thread.updated_at)}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
