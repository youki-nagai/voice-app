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
  const [panels, setPanels] = useState<string[]>(() => [sessions[0].id]);
  const [focusedPanelIndex, setFocusedPanelIndex] = useState(0);

  const isSplitView = panels.length > 1;
  const activeSessionId = panels[0];
  const focusedSessionId = panels[focusedPanelIndex] ?? panels[0];

  const addSession = useCallback((): string => {
    const newSession = createSession(`Chat ${sessions.length + 1}`);
    setSessions((prev) => [...prev, newSession]);
    setPanels((prev) => {
      const next = [...prev];
      next[0] = newSession.id;
      return next;
    });
    setFocusedPanelIndex(0);
    return newSession.id;
  }, [sessions.length]);

  const addSessionWithId = useCallback(
    (id: string, name?: string) => {
      const existing = sessions.find((s) => s.id === id);
      if (existing) {
        setPanels((prev) => {
          const idx = prev.indexOf(id);
          if (idx >= 0) {
            setFocusedPanelIndex(idx);
            return prev;
          }
          const next = [...prev];
          next[0] = id;
          setFocusedPanelIndex(0);
          return next;
        });
        return;
      }
      const session: Session = {
        id,
        name: name ?? `Chat ${sessions.length + 1}`,
      };
      setSessions((prev) => [...prev, session]);
      setPanels((prev) => {
        const next = [...prev];
        next[0] = id;
        return next;
      });
      setFocusedPanelIndex(0);
    },
    [sessions],
  );

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s.id !== id);

      setPanels((prevPanels) => {
        const panelIndex = prevPanels.indexOf(id);
        if (panelIndex >= 0) {
          if (prevPanels.length <= 1) {
            const replacement = filtered[0];
            if (replacement) return [replacement.id];
            return prevPanels;
          }
          const nextPanels = prevPanels.filter((_, i) => i !== panelIndex);
          setFocusedPanelIndex((fi) => Math.min(fi, nextPanels.length - 1));
          return nextPanels;
        }
        return prevPanels;
      });

      return filtered;
    });
  }, []);

  const switchByDirection = useCallback(
    (direction: "next" | "prev"): Session | null => {
      const currentId = panels[focusedPanelIndex] ?? panels[0];
      const currentIndex = sessions.findIndex((s) => s.id === currentId);
      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      const target = sessions[targetIndex] ?? null;
      if (target) {
        setPanels((prev) => {
          const existingIdx = prev.indexOf(target.id);
          if (existingIdx >= 0) {
            setFocusedPanelIndex(existingIdx);
            return prev;
          }
          const next = [...prev];
          next[focusedPanelIndex] = target.id;
          return next;
        });
      }
      return target;
    },
    [sessions, panels, focusedPanelIndex],
  );

  const switchByIndex = useCallback(
    (index: number): Session | null => {
      const target = sessions[index] ?? null;
      if (target) {
        setPanels((prev) => {
          const existingIdx = prev.indexOf(target.id);
          if (existingIdx >= 0) {
            setFocusedPanelIndex(existingIdx);
            return prev;
          }
          const next = [...prev];
          next[focusedPanelIndex] = target.id;
          return next;
        });
      }
      return target;
    },
    [sessions, focusedPanelIndex],
  );

  const splitSession = useCallback((sessionId: string) => {
    setPanels((prev) => {
      const existingIndex = prev.indexOf(sessionId);
      if (existingIndex >= 0) {
        setFocusedPanelIndex(existingIndex);
        return prev;
      }
      setFocusedPanelIndex(prev.length);
      return [...prev, sessionId];
    });
  }, []);

  const removePanel = useCallback((index: number) => {
    setPanels((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setFocusedPanelIndex((fi) => Math.min(fi, next.length - 1));
      return next;
    });
  }, []);

  const unsplit = useCallback(() => {
    setPanels((prev) => {
      if (prev.length <= 1) return prev;
      return [prev[focusedPanelIndex] ?? prev[0]];
    });
    setFocusedPanelIndex(0);
  }, [focusedPanelIndex]);

  const selectSession = useCallback(
    (id: string) => {
      setPanels((prev) => {
        const existingIndex = prev.indexOf(id);
        if (existingIndex >= 0) {
          setFocusedPanelIndex(existingIndex);
          return prev;
        }
        const next = [...prev];
        next[focusedPanelIndex] = id;
        return next;
      });
    },
    [focusedPanelIndex],
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === panels[0]) ?? sessions[0],
    [sessions, panels],
  );

  return {
    sessions,
    panels,
    activeSessionId,
    activeSession,
    isSplitView,
    focusedPanelIndex,
    focusedSessionId,
    setFocusedPanelIndex,
    addSession,
    addSessionWithId,
    removeSession,
    selectSession,
    switchByDirection,
    switchByIndex,
    splitSession,
    removePanel,
    unsplit,
  };
}
