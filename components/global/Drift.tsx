'use client';
/** D1 drift: jump to a random work, artist or event, weighted toward items with
 *  good images, never repeating within a session. Shortcut: r. */
import { loadItems } from '@/lib/items';
import { track } from '@/lib/track';
import { THIN } from '@/components/cat/Pieces';

const SEEN = 'mot:drift:seen';
export async function drift() {
  const items = await loadItems();
  if (!items.length) return;
  let seen: string[] = [];
  try { seen = JSON.parse(sessionStorage.getItem(SEEN) || '[]'); } catch { /* ignore */ }
  const here = location.pathname;
  let pool = items.filter(i => !seen.includes(i.id) && i.href !== here);
  if (!pool.length) { seen = []; pool = items.filter(i => i.href !== here); }
  const weight = (i: typeof items[number]) => (i.good ? 6 : i.thumb ? 2 : 0.4);
  let r = Math.random() * pool.reduce((n, i) => n + weight(i), 0);
  const pick = pool.find(i => (r -= weight(i)) <= 0) ?? pool[0];
  try { sessionStorage.setItem(SEEN, JSON.stringify([...seen, pick.id].slice(-400))); } catch { /* ignore */ }
  track('drift');
  location.href = pick.href;
}
export default function DriftButton() {
  return (
    <button type="button" className="mot-icon-btn" onClick={drift} onPointerEnter={() => loadItems()} aria-label="drift: go somewhere at random" data-label="drift">
      {THIN.drift}
    </button>
  );
}
