'use client';

/** The viewer for profile and event photos and videos (2026-11-22). Same
 *  PhotoSwipe v5 setup and look as the +1 trash viewer (components/work/viewer.ts):
 *  pinch and double-tap zoom, swipe down to close, keyboard, focus trap, and
 *  hand-built history so back closes it. Plus:
 *
 *  - S4: zoom stops at 100% of the real pixels. Slides are given their native
 *    size (Sanity metadata, a build-time probe, or the loaded image), and the
 *    max zoom level is 1, so nothing is ever drawn larger than it is.
 *  - Videos (YouTube / Vimeo) play inside the viewer as an embedded player.
 *  - Captions: one monospace line with the caption and "photo: name" credit.
 *  - Share: the page address with #view-N, which opens straight into the viewer. */

import type PhotoSwipeType from 'photoswipe';
import { prefersReducedMotion } from '@/lib/trashWork';

export type GalleryItem = {
  url?: string;           // image (or a video's still)
  w?: number; h?: number;
  caption?: string | null;
  credit?: string | null;
  alt?: string | null;
  video?: string | null;  // YouTube / Vimeo page URL
};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const SANITY = 'https://cdn.sanity.io/images/';
const ICON_CLOSE = '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M9 9l14 14M23 9L9 23" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const ICON_ARROW = '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M19 8l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_ZOOM = '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="14" cy="14" r="7"/><path d="M19.2 19.2l5.8 5.8"/><path class="pswp__zoom-icn-bar-h" d="M11 14h6"/><path class="pswp__zoom-icn-bar-v" d="M14 11v6"/></g></svg>';
const ICON_SHARE = '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M16 6v14M11 11l5-5 5 5M9 16v9h14v-9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const yt = u.hostname.replace(/^www\.|^m\./, '');
    if (yt === 'youtube.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/\/(embed|live|shorts)\/([\w-]{11})/)?.[2];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (yt === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1, 12)}?autoplay=1&rel=0`;
    if (yt === 'vimeo.com' || yt === 'player.vimeo.com') {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` : null;
    }
  } catch { /* not a URL */ }
  return null;
}
export function youtubeStill(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\.|^m\./, '');
    const id = h === 'youtu.be' ? u.pathname.slice(1, 12) : h === 'youtube.com' ? (u.searchParams.get('v') ?? u.pathname.match(/\/(embed|live|shorts)\/([\w-]{11})/)?.[2]) : null;
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

let mod: Promise<typeof import('photoswipe')> | null = null;
export const preloadGallery = () => { mod ??= import('photoswipe'); };
let current: PhotoSwipeType | null = null;

export type OpenGallery = {
  items: GalleryItem[];
  index?: number;
  title: string;
  /** the grid element whose image zooms into the viewer */
  thumbFor?: (i: number) => HTMLElement | null;
  /** write #view-N into the address so back closes and links can be shared */
  history?: boolean;
};

export async function openGallery(o: OpenGallery): Promise<void> {
  if (!o.items.length) return;
  if (current) { current.destroy(); current = null; }
  preloadGallery();
  const { default: PhotoSwipe } = await mod!;
  const reduced = prefersReducedMotion();

  const dataSource = o.items.map(it => {
    if (it.video && embedUrl(it.video)) {
      return { html: `<div class="gv-video"><iframe src="${esc(embedUrl(it.video)!)}" title="${esc(it.caption || o.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`, gv: it };
    }
    const url = it.url!;
    const native = it.w && it.h ? { w: it.w, h: it.h } : null;
    const src = url.startsWith(SANITY) ? `${url}?w=${Math.min(native?.w ?? 2400, 2400)}&q=80&fit=max&auto=format` : url;
    // Sanity sends at most 2400px: the slide's size is what is actually delivered
    const scale = native ? Math.min(1, 2400 / native.w) : 1;
    return { src, width: native ? Math.round(native.w * scale) : 1600, height: native ? Math.round(native.h * scale) : 1200, alt: it.alt || it.caption || o.title, gv: it, sized: !!native };
  });

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const pswp = new PhotoSwipe({
    dataSource,
    index: o.index ?? 0,
    mainClass: 'mot-viewer',
    bgOpacity: 1,
    showHideAnimationType: reduced ? 'fade' : 'zoom',
    showAnimationDuration: reduced ? 160 : 260,
    hideAnimationDuration: reduced ? 140 : 220,
    closeOnVerticalDrag: true,
    pinchToClose: true,
    bgClickAction: 'close',
    imageClickAction: 'zoom-or-close',
    doubleTapAction: 'zoom',
    tapAction: (_pt, e) => { const t = e.target as HTMLElement | null; if (t?.closest('.pswp__img, .gv-cap, .pswp__top-bar, .gv-video')) return; pswp.close(); },
    // S4: 1 = the real pixels. 'fit' never exceeds 1 either, so small images stay small.
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 1,
    maxZoomLevel: 1,
    preload: [1, 2],
    zoom: !isTouch,
    zoomSVG: ICON_ZOOM, closeSVG: ICON_CLOSE, arrowPrevSVG: ICON_ARROW, arrowNextSVG: ICON_ARROW,
    counter: o.items.length > 1, arrowPrev: o.items.length > 1, arrowNext: o.items.length > 1,
    closeTitle: 'close', zoomTitle: 'zoom', arrowPrevTitle: 'previous', arrowNextTitle: 'next',
    errorMsg: 'this image could not be loaded',
    paddingFn: () => ({ top: 56, bottom: 72, left: 0, right: 0 }),
    returnFocus: true, trapFocus: true,
  });

  pswp.addFilter('thumbEl', (el, _d, i) => (o.thumbFor?.(i)?.querySelector('img') ?? el) as HTMLElement);
  pswp.addFilter('placeholderSrc', (src, slide) => {
    const img = o.thumbFor?.(slide.index)?.querySelector('img') as HTMLImageElement | null;
    return img?.currentSrc || img?.src || src;
  });

  // unknown sizes (legacy files): take the loaded image's real size, so zoom stops at 1:1
  pswp.on('loadComplete', ({ content, slide }) => {
    const img = content.element;
    if (!(img instanceof HTMLImageElement) || !img.naturalWidth) return;
    const d = dataSource[slide.index] as { sized?: boolean; width?: number; height?: number };
    if (d.sized) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    content.width = w; content.height = h; d.width = w; d.height = h; d.sized = true;
    slide.width = w; slide.height = h;
    slide.calculateSize(); slide.zoomAndPanToInitial(); slide.applyCurrentZoomPan(); slide.updateContentSize(true);
  });

  // history: #view-N; back closes
  let pushed = false, closedByPop = false;
  const base = window.location.pathname + window.location.search;
  const onPop = () => { if (!pushed) return; pushed = false; closedByPop = true; pswp.close(); };
  if (o.history !== false) {
    window.history.pushState({ ...(window.history.state ?? {}), motGallery: true }, '', `${base}#view-${(o.index ?? 0) + 1}`);
    pushed = true;
    window.addEventListener('popstate', onPop);
  }
  pswp.on('change', () => { if (pushed) window.history.replaceState(window.history.state, '', `${base}#view-${pswp.currIndex + 1}`); });
  pswp.on('close', () => {
    window.removeEventListener('popstate', onPop);
    if (pushed && !closedByPop) { pushed = false; window.history.back(); }
  });
  pswp.on('destroy', () => { window.removeEventListener('popstate', onPop); if (current === pswp) current = null; });

  pswp.on('uiRegister', () => {
    pswp.ui!.registerElement({
      name: 'share', order: 9, isButton: true, title: 'share', ariaLabel: 'share this image', html: ICON_SHARE,
      onClick: async () => {
        const url = `${window.location.origin}${base}#view-${pswp.currIndex + 1}`;
        if (isTouch && typeof navigator.share === 'function') { try { await navigator.share({ title: o.title, url }); } catch { /* dismissed */ } return; }
        let ok = false;
        try { await navigator.clipboard.writeText(url); ok = true; } catch { /* no permission */ }
        const t = pswp.element?.querySelector('.mv-toast');
        if (t) { t.textContent = ok ? 'link copied' : url; t.classList.add('is-on'); setTimeout(() => t.classList.remove('is-on'), 1800); }
      },
    });
    pswp.ui!.registerElement({ name: 'toast', appendTo: 'root', onInit: el => { el.className = 'mv-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); } });
    pswp.ui!.registerElement({
      name: 'gvcap', appendTo: 'root',
      onInit: el => {
        el.className = 'gv-cap';
        el.setAttribute('aria-live', 'polite');
        const render = () => {
          const it = o.items[pswp.currIndex];
          const parts = [it?.caption, it?.credit ? `photo: ${it.credit}` : null].filter(Boolean) as string[];
          el.innerHTML = parts.map(esc).join(' · ');
        };
        pswp.on('change', render);
        render();
      },
    });
  });
  pswp.on('afterInit', () => {
    pswp.element?.setAttribute('aria-label', o.title);
    for (const [k, label] of Object.entries({ close: 'close', zoom: 'zoom', share: 'share', 'arrow--prev': 'previous', 'arrow--next': 'next' })) {
      const b = pswp.element?.querySelector<HTMLElement>(`.pswp__button--${k}`);
      if (!b) continue;
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.getAttribute('title') || label);
      b.removeAttribute('title'); b.setAttribute('data-label', label);
    }
  });
  current = pswp;
  pswp.init();
}

/** Open from a shared #view-N link, once, after the page mounts. */
export function viewIndexFromHash(): number | null {
  const m = window.location.hash.match(/^#view-(\d+)$/);
  return m ? Math.max(0, +m[1] - 1) : null;
}
export function isGalleryOpen() { return !!current; }
export function galleryStep(dir: 1 | -1) { if (current) { if (dir > 0) current.next(); else current.prev(); } }
