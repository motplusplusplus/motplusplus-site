/** Shared, server-renderable pieces for the MoTcyclopedia and events pages.
 *  No hooks: usable from server and client components alike. */

import type { Img } from '@/lib/catalogue';

const SANITY = 'https://cdn.sanity.io/images/';
const isSanity = (u: string) => u.startsWith(SANITY);

/** Sanity widths no larger than the original: fit=max never upscales (S4). */
function srcset(img: Img, widths: number[]): string | undefined {
  if (!isSanity(img.url)) return undefined;
  const ws = widths.filter(w => !img.w || w <= img.w);
  if (img.w && (!ws.length || ws[ws.length - 1] < img.w)) ws.push(img.w);
  return ws.map(w => `${img.url}?w=${w}&q=75&fit=max&auto=format ${w}w`).join(', ');
}
export function imgSrc(img: Img, w: number): string {
  if (!isSanity(img.url)) return img.url;
  return `${img.url}?w=${img.w ? Math.min(w, img.w) : w}&q=75&fit=max&auto=format`;
}

/** A cropped image box. Crops on the hotspot; an image smaller than the box
 *  is shown at its real size on the card tone instead of being stretched. */
export function CImg({ img, sizes, widths = [320, 480, 640, 960, 1280], alt = '', className = '', minFill = 360, priority = false, contain = false }: {
  img: Img; sizes: string; widths?: number[]; alt?: string; className?: string;
  /** below this native width the image is not stretched to fill */
  minFill?: number; priority?: boolean; contain?: boolean;
}) {
  const small = !!img.w && img.w < minFill;
  const pos = img.fx != null && img.fy != null ? `${(img.fx * 100).toFixed(1)}% ${(img.fy * 100).toFixed(1)}%` : '50% 40%';
  return (
    <span className={`c-img${small ? ' is-small' : ''}${contain ? ' is-contain' : ''} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc(img, 640)}
        srcSet={srcset(img, widths)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        width={img.w}
        height={img.h}
        style={small ? { maxWidth: img.w, maxHeight: img.h } : { objectPosition: pos }}
      />
    </span>
  );
}

/** S3: the deliberate catalogue card for anything without an image. */
export function TypeCard({ name, facts, big = false, className = '' }: { name: string; facts?: string; big?: boolean; className?: string }) {
  return (
    <span className={`c-type${big ? ' c-type-big' : ''} ${className}`} role="img" aria-label={name}>
      <span className="c-type-name" aria-hidden="true">{name}</span>
      {facts ? <span className="c-type-facts" aria-hidden="true">{facts}</span> : null}
    </span>
  );
}

export const THIN = {
  heart: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  grid: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></g></svg>,
  list: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  search: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="5.5" /><path d="M15 15l4.5 4.5" /></g></svg>,
  drift: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M3 15c3-5 6-5 9 0s6 5 9 0M3 9c3-5 6-5 9 0s6 5 9 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  share: <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M12 4v11M8 8l4-4 4 4M6 12v8h12v-8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  play: <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>,
};
