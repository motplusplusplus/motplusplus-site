/** Sanity image CDN URL helpers for +1 trash works (grid, viewer, work page,
 *  profiles, social previews). Pure string building: no client SDK, safe in
 *  client bundles. Non-Sanity URLs (legacy R2) pass through untouched, since
 *  they take no params. */

const SANITY_CDN = 'https://cdn.sanity.io/images/';

export function isSanityImage(url: string | undefined | null): url is string {
  return !!url && url.startsWith(SANITY_CDN);
}

/** One sized URL: auto=format (AVIF/WebP where supported), fit=max (never
 *  upscales, never crops). */
export function imgUrl(url: string, w: number, q = 75): string {
  if (!isSanityImage(url)) return url;
  return `${url}?w=${w}&q=${q}&fit=max&auto=format`;
}

/** srcset across the given widths, dropping widths larger than the original
 *  (fit=max would just return the original again).
 *  SELF-CONTAINED ON PURPOSE (no imports, no closures): its source is also
 *  inlined into the /trash HTML (app/trash/page.tsx) to preload the first
 *  images, and the preload only helps if its URLs match React's exactly. */
export function imgSrcSet(url: string, widths: number[], originalWidth?: number, q = 75): string | undefined {
  if (!url || url.indexOf('https://cdn.sanity.io/images/') !== 0) return undefined;
  const ws = widths.filter(function (w) { return !originalWidth || w <= originalWidth; });
  if (originalWidth && (ws.length === 0 || ws[ws.length - 1] < originalWidth)) ws.push(originalWidth);
  return ws.map(function (w) { return url + '?w=' + w + '&q=' + q + '&fit=max&auto=format ' + w + 'w'; }).join(', ');
}

/** Tiny blurred stand-in shown behind an image until it loads. A ~24px
 *  request (a few hundred bytes) rather than inlining Sanity's base64 lqip
 *  for all ~110 works, which would add ~150 KB to the /trash HTML and push
 *  out the first image on a phone connection. */
export function placeholderUrl(url: string): string | undefined {
  if (!isSanityImage(url)) return undefined;
  return `${url}?w=24&q=30&blur=10&fit=max&auto=format`;
}

/** Social preview image: 1200x630, the whole work letterboxed on the page
 *  colour (never cropped), JPEG for messengers that ignore WebP (Zalo). */
export function ogImageUrl(url: string): string {
  if (!isSanityImage(url)) return url;
  return `${url}?w=1200&h=630&fit=fill&bg=f6f3ee&fm=jpg&q=80`;
}

/** Viewer source: up to 2400px, with a srcset so phones take less. Shares
 *  steps (800, 1200) and quality with the grid and work page, so on a phone
 *  the viewer usually reuses the image already in cache: instant zoom, and
 *  no second download when a shared link opens straight into the viewer. */
export const VIEWER_WIDTHS = [800, 1200, 1800, 2400];
export const GRID_SINGLE_WIDTHS = [400, 600, 800, 1200];
// dense: 2 columns on a phone (~180px), 3-4 on a desktop (~300-450px)
export const GRID_DENSE_WIDTHS = [240, 400, 600, 800, 1200];
