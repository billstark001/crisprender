import { useCallback, useRef } from "react";

export function useCallbackRef<T extends Function>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;
  return useCallback(((...args: any[]) => ref.current(...args)) as unknown as T, []) as T;
}