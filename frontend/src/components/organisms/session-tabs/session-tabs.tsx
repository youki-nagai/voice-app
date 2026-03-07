import { Plus, X } from "lucide-react";
import type { Session } from "../../../hooks/use-session-manager";

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  onRemoveSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  waitingSessionIds: string[];
}

export function SessionTabs({
  sessions,
  activeSessionId,
  onSelectSession,
  onAddSession,
  onRemoveSession,
  waitingSessionIds,
}: SessionTabsProps) {
  const canClose = sessions.length > 1;

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-3 py-1.5">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const isWaiting = waitingSessionIds.includes(session.id);

        return (
          <button
            key={session.id}
            type="button"
            data-active={isActive}
            className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            {isWaiting && (
              <span
                data-processing
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
              />
            )}
            <span>{session.name}</span>
            {canClose && (
              <span
                role="button"
                title="チャットを閉じる"
                className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity hover:bg-background/50 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSession(session.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onRemoveSession(session.id);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
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
    </div>
  );
}
