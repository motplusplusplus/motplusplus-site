'use client';
export type Item = { id: string; href: string; title: string; sub: string; thumb: string | null; w: number; h: number; good: boolean; avail: boolean };
let p: Promise<Item[]> | null = null;
export function loadItems(): Promise<Item[]> {
  p ??= fetch('/items.json').then(r => r.json()).then((rows: [string, string, string, string, string | null, number, number, number, number][]) =>
    rows.map(([id, href, title, sub, thumb, w, h, good, avail]) => ({ id, href, title, sub, thumb, w, h, good: !!good, avail: !!avail }))).catch(() => { p = null; return []; });
  return p;
}
