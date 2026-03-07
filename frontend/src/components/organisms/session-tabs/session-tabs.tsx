import { Columns2, Plus, X } from "lucide-react";
import type { Session } from "../../../hooks/use-session-manager";

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string;
  secondarySessionId: string | null;
  isSplitView: boolean;
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  onRemoveSession: (id: string) => void;
  onSplitSession: (id: string) => void;
  onUnsplit: () => void;
  waitingSessionIds: string[];
}

export function SessionTabs({
  sessions,
  activeSessionId,
  secondarySessionId,
  isSplitView,
  onSelectSession,
  onAddSession,
  onRemoveSession,
  onSplitSession,
  onUnsplit,
  waitingSessionIds,
}: SessionTabsProps) {
  const canClose = sessions.length > 1;
  const canSplit = sessions.length > 1;

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-3 py-1.5">
      {sessions.map((session) => {
        const isPrimary = session.id === activeSessionId;
        const isSecondary = session.id === secondarySessionId;
        const isActive = isPrimary || isSecondary;
        const isWaiting = waitingSessionIds.includes(session.id);

        return (
          <div
            key={session.id}
            role="tab"
            tabIndex={0}
            data-active={isActive}
            className={`group relative flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              isPrimary
                ? "bg-accent text-accent-foreground"
                : isSecondary
                  ? "bg-accent/70 text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            onClick={() => onSelectSession(session.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelectSession(session.id);
            }}
          >
            {isWaiting && (
              <span
                data-processing
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
              />
            )}
            {isSplitView && isPrimary && (
              <span className="text-[9px] font-bold text-blue-400">L</span>
            )}
            {isSplitView && isSecondary && (
              <span className="text-[9px] font-bold text-green-400">R</span>
            )}
            <span>{session.name}</span>
            {canSplit && !isSplitView && !isPrimary && (
              <button
                type="button"
                title="右パネルで開く"
                className="ml-0.5 rounded border-0 bg-transparent p-0.5 opacity-0 transition-opacity hover:bg-background/50 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onSplitSession(session.id);
                }}
              >
                <Columns2 className="h-3 w-3" />
              </button>
            )}
            {canClose && (
              <button
                type="button"
                title="チャットを閉じる"
                className="ml-0.5 rounded border-0 bg-transparent p-0.5 opacity-0 transition-opacity hover:bg-background/50 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSession(session.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        title="新しいチャット"
        className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        onClick={onAddSession}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {isSplitView && (
        <button
          type="button"
          title="分割を解除"
          className="ml-auto flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          onClick={onUnsplit}
        >
          <Columns2 className="h-3.5 w-3.5 text-blue-400" />
          <X className="h-2.5 w-2.5 -ml-0.5" />
        </button>
      )}
    </div>
  );
}
