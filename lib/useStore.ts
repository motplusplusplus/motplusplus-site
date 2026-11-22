'use client';
/** useSyncExternalStore over a browser-storage read, re-read when `event` fires
 *  (and on cross-tab storage events). Server and first client render use `server`. */
import { useCallback, useRef, useSyncExternalStore } from 'react';
export function useStored<T>(read: () => T, event: string, server: T): T {
  const cache = useRef<{ k: string; v: T } | null>(null);
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener(event, cb); window.addEventListener('storage', cb);
    return () => { window.removeEventListener(event, cb); window.removeEventListener('storage', cb); };
  }, [event]);
  return useSyncExternalStore(subscribe, () => {
    const v = read();
    const k = JSON.stringify(v);
    if (cache.current?.k === k) return cache.current.v;
    cache.current = { k, v };
    return v;
  }, () => server);
}
