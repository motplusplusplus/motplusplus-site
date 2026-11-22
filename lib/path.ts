'use client';
/** D7 "your path": the last 6 things viewed this session (sessionStorage only). */
export type PathItem = { id: string; href: string; title: string; thumb: string | null };
const KEY = 'mot:path';
export const PATH_EVT = 'mot:path-change';
export function readPath(): PathItem[] { try { const v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
export function visit(it: PathItem) {
  try {
    const next = [it, ...readPath().filter(x => x.id !== it.id)].slice(0, 6);
    sessionStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PATH_EVT));
  } catch { /* storage blocked */ }
}
