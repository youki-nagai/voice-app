import { useCallback, useMemo, useState } from "react";

export interface Session {
  id: string;
  name: string;
}

export type FocusedPanel = "primary" | "secondary";

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
  const [secondarySessionId, setSecondarySessionId] = useState<string | null>(
    null,
  );
  const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>("primary");

  const isSplitView = secondarySessionId !== null;

  const addSession = useCallback((): string => {
    const newSession = createSession(`Chat ${sessions.length + 1}`);
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setFocusedPanel("primary");
    return newSession.id;
  }, [sessions.length]);

  const removeSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((s) => s.id !== id);

        if (secondarySessionId === id) {
          setSecondarySessionId(null);
          setFocusedPanel("primary");
        }

        if (activeSessionId === id) {
          const removedIndex = prev.findIndex((s) => s.id === id);
          const newActive =
            filtered[Math.min(removedIndex, filtered.length - 1)];
          setActiveSessionId(newActive.id);
          setFocusedPanel("primary");
        }

        return filtered;
      });
    },
    [activeSessionId, secondarySessionId],
  );

  const switchByDirection = useCallback(
    (direction: "next" | "prev"): Session | null => {
      const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      const target = sessions[targetIndex] ?? null;
      if (target) setActiveSessionId(target.id);
      return target;
    },
    [sessions, activeSessionId],
  );

  const switchByIndex = useCallback(
    (index: number): Session | null => {
      const target = sessions[index] ?? null;
      if (target) setActiveSessionId(target.id);
      return target;
    },
    [sessions],
  );

  const splitSession = useCallback(
    (id: string) => {
      if (id === activeSessionId) return;
      setSecondarySessionId(id);
      setFocusedPanel("secondary");
    },
    [activeSessionId],
  );

  const unsplit = useCallback(() => {
    setSecondarySessionId(null);
    setFocusedPanel("primary");
  }, []);

  const selectSession = useCallback(
    (id: string, panel?: FocusedPanel) => {
      if (panel === "secondary" || (!panel && focusedPanel === "secondary")) {
        if (id !== activeSessionId) {
          setSecondarySessionId(id);
          setFocusedPanel("secondary");
        }
      } else {
        if (id !== secondarySessionId) {
          setActiveSessionId(id);
          setFocusedPanel("primary");
        }
      }
    },
    [activeSessionId, secondarySessionId, focusedPanel],
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  const secondarySession = useMemo(
    () =>
      secondarySessionId
        ? (sessions.find((s) => s.id === secondarySessionId) ?? null)
        : null,
    [sessions, secondarySessionId],
  );

  const focusedSessionId =
    focusedPanel === "secondary" && secondarySessionId
      ? secondarySessionId
      : activeSessionId;

  return {
    sessions,
    activeSessionId,
    activeSession,
    secondarySessionId,
    secondarySession,
    isSplitView,
    focusedPanel,
    focusedSessionId,
    setFocusedPanel,
    addSession,
    removeSession,
    setActiveSession: setActiveSessionId,
    selectSession,
    switchByDirection,
    switchByIndex,
    splitSession,
    unsplit,
  };
}
