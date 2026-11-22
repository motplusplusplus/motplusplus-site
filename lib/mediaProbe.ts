/** Build-time measurement of work images that Sanity does not describe:
 *  legacy image URLs (no asset metadata) and YouTube stills for video works
 *  with no photo. Without real sizes the grid box and the viewer would guess
 *  (they used to guess 1600x1200, which stretched a 461x44 text strip into
 *  a 4:3 blur). Server only: runs while the static export builds.
 *
 *  Every probe fails soft: an unreachable image keeps no size here and the
 *  page measures it on load instead (app/layout.tsx IMG_FADE_SCRIPT for the
 *  grid box, components/work/viewer.ts for the viewer). */

import { youtubeId } from './youtube';

export type Size = { w: number; h: number };
export type YoutubeStill = { url: string; w: number; h: number; video: string };

const TIMEOUT_MS = 8000;
const sizeCache = new Map<string, Promise<Size | null>>();
const ytCache = new Map<string, Promise<YoutubeStill | null>>();

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

/** Width/height from the first bytes of a PNG, GIF, JPEG or WebP. */
export function sizeFromBytes(b: Uint8Array): Size | null {
  const u16be = (i: number) => (b[i] << 8) | b[i + 1];
  const u16le = (i: number) => b[i] | (b[i + 1] << 8);
  const u32be = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { w: u32be(16), h: u32be(20) };
  }
  if (b.length >= 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { w: u16le(6), h: u16le(8) };
  }
  if (b.length >= 30 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) {
    const kind = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (kind === 'VP8 ') return { w: u16le(26) & 0x3fff, h: u16le(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = u16be(i + 2);
      // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: u16be(i + 7), h: u16be(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/** Real pixel size of an image URL, or null if it cannot be read. */
export function probeImageSize(url: string): Promise<Size | null> {
  let p = sizeCache.get(url);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetchWithTimeout(url, { headers: { Range: 'bytes=0-131071' } });
        if (!res.ok) return null;
        const s = sizeFromBytes(new Uint8Array(await res.arrayBuffer()));
        return s && s.w > 0 && s.h > 0 ? s : null;
      } catch { return null; }
    })();
    sizeCache.set(url, p);
  }
  return p;
}

/** The video's still: maxresdefault (1280x720) where YouTube has one,
 *  otherwise hqdefault (480x360, always present). A missing maxresdefault
 *  answers 404 with a 120x90 grey stand-in, so the size is checked too. */
export function youtubeStill(videoUrl: string): Promise<YoutubeStill | null> {
  const id = youtubeId(videoUrl);
  if (!id) return Promise.resolve(null);
  let p = ytCache.get(id);
  if (!p) {
    p = (async () => {
      const max = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
      const hq = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      const maxSize = await probeImageSize(max);
      if (maxSize && maxSize.w > 120) return { url: max, ...maxSize, video: videoUrl };
      const hqSize = await probeImageSize(hq);
      return { url: hq, w: hqSize?.w ?? 480, h: hqSize?.h ?? 360, video: videoUrl };
    })();
    ytCache.set(id, p);
  }
  return p;
}

/** Adds `legacySizes` (url → size) and, for works with no Sanity photo,
 *  `youtubeStills` to a raw trashItem row. normalizeWork() reads both. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function enrichWorkRow<T extends Record<string, any> | null>(r: T): Promise<T> {
  if (!r) return r;
  const legacy: string[] = (r.legacyImageUrls ?? []).filter(Boolean);
  const hasPhoto = (r.imgs ?? []).some((i: { url?: string } | null) => i?.url);
  const yt: string[] = hasPhoto ? [] : (r.youtubeUrls ?? []).filter(Boolean);
  if (legacy.length === 0 && yt.length === 0) return r;
  const [sizes, stills] = await Promise.all([
    Promise.all(legacy.map(u => probeImageSize(u))),
    Promise.all(yt.map(u => youtubeStill(u))),
  ]);
  const legacySizes: Record<string, Size> = {};
  legacy.forEach((u, i) => { if (sizes[i]) legacySizes[u] = sizes[i]!; });
  return { ...r, legacySizes, youtubeStills: stills.filter(Boolean) };
}

export function enrichWorkRows<T extends Record<string, unknown>>(rows: T[] | null | undefined): Promise<T[]> {
  return Promise.all((rows ?? []).map(r => enrichWorkRow(r)));
}
