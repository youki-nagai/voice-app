import { Columns2, Plus, X } from "lucide-react";
import type { FocusedPanel, Session } from "../../../hooks/use-session-manager";

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string;
  secondarySessionId: string | null;
  isSplitView: boolean;
  onSelectSession: (id: string, panel?: FocusedPanel) => void;
  onAddSession: () => void;
  onRemoveSession: (id: string) => void;
  onSplitSession: (id: string) => void;
  onUnsplit: () => void;
  waitingSessionIds: string[];
  forPanel?: FocusedPanel;
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
  forPanel,
}: SessionTabsProps) {
  const canClose = sessions.length > 1;
  const canSplit = sessions.length > 1;

  const currentSessionId =
    forPanel === "secondary" ? secondarySessionId : activeSessionId;

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-3 py-1.5">
      {sessions.map((session) => {
        const isCurrentPanel = session.id === currentSessionId;
        const isPrimary = session.id === activeSessionId;
        const isSecondary = session.id === secondarySessionId;
        const isWaiting = waitingSessionIds.includes(session.id);

        const isOtherPanel = forPanel
          ? forPanel === "primary"
            ? isSecondary
            : isPrimary
          : false;

        return (
          <div
            key={session.id}
            role="tab"
            tabIndex={0}
            data-active={isCurrentPanel || (!forPanel && (isPrimary || isSecondary))}
            className={`group relative flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              isCurrentPanel
                ? "bg-accent text-accent-foreground"
                : isOtherPanel
                  ? "text-muted-foreground/50 cursor-default"
                  : !forPanel && isSecondary
                    ? "bg-accent/70 text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            onClick={() => {
              if (isOtherPanel) return;
              onSelectSession(session.id, forPanel);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isOtherPanel)
                onSelectSession(session.id, forPanel);
            }}
          >
            {isWaiting && (
              <span
                data-processing
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
              />
            )}
            {!forPanel && isSplitView && isPrimary && (
              <span className="text-[9px] font-bold text-blue-400">L</span>
            )}
            {!forPanel && isSplitView && isSecondary && (
              <span className="text-[9px] font-bold text-green-400">R</span>
            )}
            {forPanel && isOtherPanel && (
              <span className="text-[9px] font-bold text-muted-foreground/50">
                {forPanel === "primary" ? "R" : "L"}
              </span>
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
            {canClose && !isOtherPanel && (
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
      {isSplitView && !forPanel && (
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
      {forPanel && (
        <button
          type="button"
          title="分割を解除"
          className="ml-auto flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          onClick={onUnsplit}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
