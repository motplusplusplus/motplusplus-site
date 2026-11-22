'use client';
/** D3 "my wall": saved works, artists and events, in this browser only
 *  (localStorage, every access wrapped: private windows and blocked storage just
 *  mean an empty wall). Nothing is ever sent to a server. Ids: "w:<work slug>",
 *  "a:<artist slug>", "e:<event slug>". */
const KEY = 'mot:wall';
const EVT = 'mot:wall-change';
export type WallId = `${'w' | 'a' | 'e'}:${string}`;

export function readWall(): WallId[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? (v.filter(x => typeof x === 'string' && /^[wae]:/.test(x)) as WallId[]) : []; } catch { return []; }
}
function write(ids: WallId[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage blocked */ }
  try { window.dispatchEvent(new Event(EVT)); } catch { /* ignore */ }
}
export function inWall(id: WallId) { return readWall().includes(id); }
export function toggleWall(id: WallId): boolean {
  const ids = readWall();
  const on = !ids.includes(id);
  write(on ? [id, ...ids] : ids.filter(x => x !== id));
  return on;
}
export function onWallChange(fn: () => void) {
  window.addEventListener(EVT, fn);
  window.addEventListener('storage', fn);
  return () => { window.removeEventListener(EVT, fn); window.removeEventListener('storage', fn); };
}
/** share link: the ids in the URL (compact), so anyone can open it, no account */
export function wallShareUrl(ids: WallId[]): string {
  return `${window.location.origin}/wall/?s=${encodeURIComponent(ids.join(','))}`;
}
export function idsFromShare(s: string | null): WallId[] {
  return (s ?? '').split(',').map(x => x.trim()).filter(x => /^[wae]:[a-z0-9-]{1,120}$/.test(x)) as WallId[];
}
