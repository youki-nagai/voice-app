import { useCallback, useMemo, useState } from "react";

export interface Session {
  id: string;
  name: string;
}

let sessionCounter = 0;

function createSession(name: string): Session {
  return { id: `session-${++sessionCounter}`, name };
}

export function useSessionManager() {
  const [sessions, setSessions] = useState<Session[]>(() => [
    createSession("Chat 1"),
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => sessions[0].id,
  );

  const addSession = useCallback((): string => {
    const newSession = createSession(`Chat ${sessions.length + 1}`);
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [sessions.length]);

  const removeSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((s) => s.id !== id);
        if (activeSessionId === id) {
          const removedIndex = prev.findIndex((s) => s.id === id);
          const newActive =
            filtered[Math.min(removedIndex, filtered.length - 1)];
          setActiveSessionId(newActive.id);
        }
        return filtered;
      });
    },
    [activeSessionId],
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  return {
    sessions,
    activeSessionId,
    activeSession,
    addSession,
    removeSession,
    setActiveSession: setActiveSessionId,
  };
}
