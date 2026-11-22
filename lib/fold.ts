/** Search folding (S5). Matching only: text is always displayed as stored.
 *
 *  fold() lowercases, strips combining marks, and maps đ/Đ to d by hand
 *  (NFD does not decompose Đ: 'Đ'.normalize('NFD') === 'Đ').
 *
 *  foldMap() also returns, for every character of the folded string, the index
 *  of the original character it came from, so a match found in folded text can
 *  be highlighted on the original (highlightRanges). Client-safe, no imports. */

export function fold(s: string | null | undefined): string {
  return foldMap(s ?? '').text;
}

export function foldMap(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    let f: string;
    if (ch === 'đ' || ch === 'Đ') f = 'd';
    else f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (let k = 0; k < f.length; k++) { text += f[k]; map.push(i); }
  }
  return { text, map };
}

/** Words of a query, folded; empty words dropped. */
export function queryTerms(q: string): string[] {
  return fold(q).split(/\s+/).map(t => t.trim()).filter(Boolean);
}

/** True when every query word occurs somewhere in the haystack (already folded). */
export function matchesAll(haystackFolded: string, terms: string[]): boolean {
  for (const t of terms) if (!haystackFolded.includes(t)) return false;
  return true;
}

/** [start, end) ranges in the ORIGINAL string covering each query word's matches. */
export function highlightRanges(original: string, terms: string[]): [number, number][] {
  if (!terms.length || !original) return [];
  const { text, map } = foldMap(original);
  const out: [number, number][] = [];
  for (const t of terms) {
    let from = 0;
    while (t && (from = text.indexOf(t, from)) !== -1) {
      const start = map[from];
      const endFolded = from + t.length - 1;
      const end = map[endFolded] + 1;
      out.push([start, end]);
      from += t.length;
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of out) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

/** Sort key for names: folded, with đ → d. */
export function sortKey(s: string): string {
  return fold(s).replace(/[^a-z0-9 ]/g, '').trim();
}
