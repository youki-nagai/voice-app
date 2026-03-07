import { useEffect, useRef } from "react";

export function useCallbackRef<T extends ((...args: never[]) => unknown) | undefined>(
  callback: T,
): React.RefObject<T> {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }, [callback]);
  return ref;
}
