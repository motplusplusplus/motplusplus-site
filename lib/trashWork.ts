/** The one shape every +1 trash work takes on the site (grid, viewer, work
 *  page, profile works, related row), built from a raw GROQ row by
 *  normalizeWork(). Pure, no SDK: imported by server and client code alike.
 *
 *  Prices are never part of this shape. Unsold prices reach the browser only
 *  through the worker's /api/pricelist gate; sold prices and buyers are not in
 *  the public dataset at all (Studio rule, 2026-11-18). */

import { CONTACTS } from './contacts';
import { isExcludedPerson } from './excludedPeople';
import { formatDimensions, parseDimensions, type Dims } from './dimensions';

export type ArtistCredit = { _id: string; name: string; slug: string | null };

export type WorkImage = {
  url: string;
  w: number;
  h: number;
  alt: string;
  bg?: string;      // dominant colour, painted before anything loads
  lqip?: string;    // inline base64 blur, only where a page has few images
};

export type ShownIn = { title: string; slug: string };

export type Work = {
  _id: string;
  slug: string | null;
  title: string;
  artist: string;            // display label, "A & B" for collaborations
  artists: ArtistCredit[];
  artistSlug: string | null; // single artistRef slug, used when artists[] is empty
  medium: string;
  workType: string[];
  year: number | null;
  dimensions: string;        // as stored
  dimensionsText: string;    // "120 × 80 cm (47¼ × 31½ in)" or the stored text
  dims: Dims | null;
  edition: string;
  description: string;
  images: WorkImage[];
  youtubeUrls: string[];
  museumLocationId: string | null;
  neighbourhood: string | null;
  sold: boolean;
  notForSale: boolean;
  shownIn: ShownIn[];
  orderIndex: number;
};

/** Works that must never be shown (owner rules, permanent): anything by Luke
 *  Schneider under any name incl. NEW3IM (lib/excludedPeople.ts does not know
 *  the alias), Thom Nguyen's "Spencer" and "Micro Penis", Đặng Thanh Long's
 *  "Adam" and "Eve". They are not in Sanity; this is the read-time backstop. */
const EXCLUDED_ALIASES = ['new3im'];
const EXCLUDED_WORKS: { artist: string; titles: string[] }[] = [
  { artist: 'thom nguyen', titles: ['spencer', 'micro penis'] },
  { artist: 'dang thanh long', titles: ['adam', 'eve'] },
];

export function foldText(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function isExcludedWork(w: { artist?: string; artists?: { name: string }[]; title?: string }): boolean {
  const names = [w.artist ?? '', ...(w.artists ?? []).map(a => a?.name ?? '')].filter(Boolean);
  if (names.some(n => isExcludedPerson(n))) return true;
  const folded = names.map(foldText);
  if (folded.some(n => EXCLUDED_ALIASES.some(a => n.replace(/\s/g, '').includes(a)))) return true;
  const t = foldText(w.title);
  return EXCLUDED_WORKS.some(r => folded.some(n => n.includes(r.artist)) && r.titles.includes(t));
}

/** Raw row from TRASH_ITEM_FIELDS (lib/sanity.ts) → Work, or null if the
 *  work must not be shown. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeWork(r: any, orderIndex = 0): Work | null {
  if (!r?._id) return null;
  const artists: ArtistCredit[] = (r.artists ?? []).filter(Boolean);
  const label = artists.length > 0 ? artists.map(a => a.name).join(' & ') : (r.artist ?? '');
  const base = { artist: label, artists, title: r.title ?? '' };
  if (isExcludedWork(base)) return null;

  const title = (r.title ?? '').trim() || 'untitled';
  const medium = (r.medium ?? '').trim();
  const fallbackAlt = [title, label, medium].filter(Boolean).join(', ');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanityImgs: WorkImage[] = (r.imgs ?? []).filter((i: any) => i?.url).map((i: any) => ({
    url: i.url,
    w: i.w || 1600,
    h: i.h || 1200,
    alt: (i.alt ?? '').trim() || fallbackAlt,
    bg: i.bg ?? undefined,
    lqip: i.lqip ?? undefined,
  }));
  const legacy: WorkImage[] = (r.legacyImageUrls ?? []).filter(Boolean).map((url: string) => ({
    url, w: 1600, h: 1200, alt: fallbackAlt,
  }));

  return {
    _id: r._id,
    slug: r.slug ?? null,
    title,
    artist: label,
    artists,
    artistSlug: r.artistSlug ?? null,
    medium,
    workType: (r.workType ?? []).filter(Boolean),
    year: r.year ?? null,
    dimensions: r.dimensions ?? '',
    dimensionsText: formatDimensions(r.dimensions),
    dims: parseDimensions(r.dimensions),
    edition: r.edition ?? '',
    description: (r.description ?? '').trim(),
    images: [...sanityImgs, ...legacy],
    youtubeUrls: (r.youtubeUrls ?? []).filter(Boolean),
    museumLocationId: r.museumLocationId ?? null,
    neighbourhood: r.neighbourhood ?? null,
    sold: r.sold === true,
    notForSale: r.notForSale === true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shownIn: (r.shownIn ?? []).filter((e: any) => e?.slug && e?.title),
    orderIndex,
  };
}

export const isAvailable = (w: Work) => !w.sold && !w.notForSale;

/** Video, sound and performance works: the grid shows a still with a play
 *  mark and opens the work page instead of the viewer. */
const TIME_BASED = ['video-digital', 'sound', 'performance-documentation'];
export function isTimeBased(w: Work): boolean {
  return w.youtubeUrls.length > 0 || w.workType.some(t => TIME_BASED.includes(t));
}

export function workHref(w: Work): string | null {
  return w.slug ? `/trash/${w.slug}/` : null;
}

/** "inquiry: <title>, <artist>" to sales@. Only ever built for available works. */
export function inquiryMailto(w: Work): string {
  const subject = `inquiry: ${w.title}, ${w.artist}`;
  const body =
    `hello,\n\ni would like to ask about this work:\n\n` +
    `${w.artist}, ${w.title}${w.year ? `, ${w.year}` : ''}\n` +
    (w.medium ? `${w.medium}\n` : '') +
    (w.dimensionsText ? `${w.dimensionsText}\n` : '') +
    (w.slug ? `https://motplusplusplus.com/trash/${w.slug}/\n` : '') +
    `\nthank you.`;
  return `mailto:${CONTACTS.sales}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** One-line caption: "artist, title, year". */
export function captionLine(w: Work): string {
  return [w.artist, w.title, w.year ? String(w.year) : null].filter(Boolean).join(', ');
}

/** Search: every typed word must appear in title, artist(s) or medium,
 *  ignoring case and Vietnamese diacritics ("dang" finds "Đặng"). */
export function matchesSearch(w: Work, q: string): boolean {
  const words = foldText(q).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const hay = foldText([w.title, w.artist, ...w.artists.map(a => a.name), w.medium].join(' '));
  return words.every(word => hay.includes(word));
}

/** Deterministic shuffle of `ids` from a numeric seed (mulberry32 +
 *  Fisher-Yates). SELF-CONTAINED ON PURPOSE: its source is inlined into the
 *  /trash HTML (app/trash/page.tsx) so the very first paint already shows
 *  this visitor's order, before React loads. No closures, no imports. */
export function seededOrder(ids: string[], seed: number): string[] {
  const a = ids.slice();
  let t = seed >>> 0;
  const rand = function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/** sessionStorage that never throws (private mode, blocked storage, previews). */
export const session = {
  get(key: string): string | null {
    try { return window.sessionStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { window.sessionStorage.setItem(key, value); } catch { /* ignore */ }
  },
  remove(key: string): void {
    try { window.sessionStorage.removeItem(key); } catch { /* ignore */ }
  },
};

export const SEED_KEY = 'mot:trash:seed';
export const STATE_KEY = 'mot:trash:state';
export const RETURN_KEY = 'mot:trash:return';
export const VIEW_KEY = 'mot:trash:view';
export const HINT_KEY = 'mot:viewer:hint';

export function prefersReducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
