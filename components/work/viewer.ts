'use client';

/** The one image viewer for +1 trash works: the /trash grid, the work page,
 *  profile works. PhotoSwipe v5 (pinch, double-tap, swipe-down close,
 *  keyboard, focus trap), loaded on first use, plus what it lacks:
 *
 *  - HISTORY. v5 has none. Opening pushes one entry whose address is the
 *    work's own page (/trash/<slug>/); back closes the viewer; ×, swipe-down,
 *    Esc and background taps pop that entry, so the next back leaves the
 *    page normally. Next's app router patches history.pushState and keeps its
 *    own state in the entry, so both entries restore the same page tree.
 *  - A caption: one monospace line that expands to the details (phone), or a
 *    slim side panel (desktop, >= 1024px).
 *  - Share (share sheet, or copy the link on desktop) and a once-per-session
 *    "pinch to zoom" hint on touch screens.
 *
 *  The viewer shows ONE work: its images side by side. */

import type PhotoSwipeType from 'photoswipe';
import { imgUrl, imgSrcSet, VIEWER_WIDTHS } from '@/lib/workImage';
import {
  captionLine, inquiryMailto, isAvailable, prefersReducedMotion, session, HINT_KEY, type Work,
} from '@/lib/trashWork';

type Pswp = PhotoSwipeType;

export type OpenViewerOptions = {
  work: Work;
  index?: number;
  /** Element whose image is the zoom origin and the placeholder (no flash). */
  thumbFor?: (index: number) => HTMLImageElement | null;
  /** Push the work's address and close on back. */
  history?: boolean;
  /** On the work page itself: no "view work page" link. */
  onWorkPage?: boolean;
  /** Client navigation (Next router). `replace` swaps the viewer's own
   *  history entry for the real page, so back skips straight past it. */
  navigate?: (href: string, opts: { replace: boolean }) => void;
  /** Unlocked price for an available work (seven-click gate), if any. */
  price?: string;
  onClosed?: () => void;
};

let pswpModule: Promise<typeof import('photoswipe')> | null = null;
/** Warm the viewer code on idle so the first tap opens instantly. */
export function preloadViewer(): void {
  pswpModule ??= import('photoswipe');
}

let current: Pswp | null = null;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const ICON = {
  close: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M9 9l14 14M23 9L9 23" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  prev: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M19 8l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // thin magnifier; the vertical bar hides when zoomed in (PhotoSwipe CSS: minus)
  zoom: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="14" cy="14" r="7"/><path d="M19.2 19.2l5.8 5.8"/><path class="pswp__zoom-icn-bar-h" d="M11 14h6"/><path class="pswp__zoom-icn-bar-v" d="M14 11v6"/></g></svg>',
  share: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M16 6v14M11 11l5-5 5 5M9 16v9h14v-9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevron: '<svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 7.5L6 4l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function safeAreaBottom(): number {
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
    document.body.appendChild(probe);
    const v = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    return v;
  } catch { return 0; }
}

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

function absoluteUrl(work: Work): string | null {
  return work.slug ? `https://motplusplusplus.com/trash/${work.slug}/` : null;
}

function statusText(work: Work): string | null {
  if (work.sold) return 'sold';
  if (work.notForSale) return null;
  return 'available';
}

function captionHtml(work: Work, opts: OpenViewerOptions, idBase: string): string {
  const rows: [string, string][] = [];
  if (work.medium) rows.push(['medium', work.medium]);
  if (work.dimensionsText) rows.push(['size', work.dimensionsText]);
  if (work.edition) rows.push(['edition', work.edition]);
  const status = statusText(work);
  if (status) rows.push(['status', status]);
  if (opts.price && isAvailable(work)) rows.push(['price', opts.price]);

  const href = work.slug ? `/trash/${work.slug}/` : null;
  const dot = work.sold ? '<span class="mot-dot" aria-hidden="true"></span><span class="mot-sr">, sold</span>' : '';
  return `
    <button type="button" class="mv-cap-line" aria-expanded="false" aria-controls="${idBase}-more">
      <span class="mv-cap-text">${esc(captionLine(work))}</span>${dot}
      <span class="mv-cap-chev">${ICON.chevron}</span>
    </button>
    <div class="mv-cap-more" id="${idBase}-more"><div class="mv-cap-inner">
      <p class="mv-cap-title">${esc(work.title)}${work.year ? `, ${work.year}` : ''}</p>
      <p class="mv-cap-artist">${esc(work.artist)}</p>
      <dl class="mv-cap-dl">
        ${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}${k === 'status' && work.sold ? ' <span class="mot-dot" aria-hidden="true"></span>' : ''}</dd></div>`).join('')}
      </dl>
      <div class="mv-cap-actions">
        ${isAvailable(work) ? `<a class="mot-btn mot-btn-solid" href="${esc(inquiryMailto(work))}">inquire</a>` : ''}
        ${href && !opts.onWorkPage ? `<a class="mot-link mv-cap-page" href="${href}">view work page</a>` : ''}
      </div>
    </div></div>`;
}

export async function openWorkViewer(opts: OpenViewerOptions): Promise<void> {
  const { work } = opts;
  if (!work.images.length) return;
  if (current) { current.destroy(); current = null; }

  preloadViewer();
  const { default: PhotoSwipe } = await pswpModule!;
  const reduced = prefersReducedMotion();
  const safeBottom = safeAreaBottom();
  const idBase = `mv-${work._id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Sizes come from Sanity's metadata or the build-time probe
  // (lib/mediaProbe.ts); 'loadComplete' below corrects any that are wrong.
  const dataSource = work.images.map(img => {
    const scale = Math.min(1, 2400 / Math.max(img.w, img.h));
    return {
      src: imgUrl(img.url, Math.round(Math.min(img.w, 2400))),
      srcset: imgSrcSet(img.url, VIEWER_WIDTHS, img.w),
      width: Math.round(img.w * scale),
      height: Math.round(img.h * scale),
      alt: img.alt,
    };
  });

  const pswp = new PhotoSwipe({
    dataSource,
    index: opts.index ?? 0,
    mainClass: 'mot-viewer',
    bgOpacity: 1,
    showHideAnimationType: reduced ? 'fade' : 'zoom',
    showAnimationDuration: reduced ? 180 : 280,
    hideAnimationDuration: reduced ? 160 : 240,
    closeOnVerticalDrag: true,
    pinchToClose: true,
    bgClickAction: 'close',
    imageClickAction: 'zoom-or-close',
    doubleTapAction: 'zoom',
    // A single tap on the photo does nothing (it would race double-tap
    // zoom); a tap anywhere else closes.
    tapAction: (_pt, e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.pswp__img, .mv-cap, .pswp__top-bar, .mv-hint')) return;
      pswp.close();
    },
    secondaryZoomLevel: 2,
    maxZoomLevel: 4,
    preload: [1, 2],
    // desktop: a zoom button (phones pinch and double-tap)
    zoom: !isTouch(),
    zoomTitle: 'zoom',
    zoomSVG: ICON.zoom,
    counter: work.images.length > 1,
    arrowPrev: work.images.length > 1,
    arrowNext: work.images.length > 1,
    closeTitle: 'close',
    arrowPrevTitle: 'previous image',
    arrowNextTitle: 'next image',
    errorMsg: 'this image could not be loaded',
    closeSVG: ICON.close,
    arrowPrevSVG: ICON.prev,
    arrowNextSVG: ICON.prev,
    paddingFn: () => isDesktop()
      ? { top: 40, bottom: 40, left: 40, right: 360 }
      : { top: 64, bottom: 64 + safeBottom, left: 0, right: 0 },
    returnFocus: true,
    trapFocus: true,
  });

  // the grid/work-page image is the zoom origin and the placeholder
  pswp.addFilter('thumbEl', (thumbEl, _data, index) => (opts.thumbFor?.(index) ?? thumbEl) as HTMLElement);
  pswp.addFilter('placeholderSrc', (src, slide) => {
    const el = opts.thumbFor?.(slide.index);
    return el?.currentSrc || el?.src || src;
  });

  // ── never stretched ──────────────────────────────────────────────────
  // If a loaded image's real shape differs from the size it was given, the
  // slide takes the real shape at once (same width; true height). For
  // single-file images (legacy URLs, YouTube stills) the real pixel size
  // is used outright, so zoom stops at 1:1.
  pswp.on('loadComplete', ({ content, slide }) => {
    const img = content.element;
    if (!(img instanceof HTMLImageElement) || !img.naturalWidth || !img.naturalHeight) return;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const real = nw / nh;
    if (!content.width || !content.height) return;
    if (Math.abs(content.width / content.height - real) / real <= 0.02) return;
    const single = !content.data.srcset;
    const w = single ? nw : content.width;
    const h = single ? nh : Math.round(content.width / real);
    content.width = w; content.height = h;
    content.data.width = w; content.data.height = h;
    const src = dataSource[slide.index];
    if (src) { src.width = w; src.height = h; }
    slide.width = w; slide.height = h;
    slide.calculateSize();
    slide.zoomAndPanToInitial();
    slide.applyCurrentZoomPan();
    slide.updateContentSize(true);
  });

  // ── history ──────────────────────────────────────────────────────────
  let pushed = false;
  let closedByPop = false;
  const onPop = () => {
    if (!pushed) return;
    pushed = false;
    closedByPop = true;
    pswp.close();
  };
  if (opts.history && work.slug) {
    const href = `/trash/${work.slug}/`;
    window.history.pushState({ ...(window.history.state ?? {}), motViewer: work._id }, '', href);
    pushed = true;
    window.addEventListener('popstate', onPop);
  }
  /** Leave the viewer for its work page (replacing the viewer's own entry). */
  const goToPage = (href: string) => {
    window.removeEventListener('popstate', onPop);
    const replace = pushed;
    pushed = false;
    pswp.destroy();
    if (opts.navigate) opts.navigate(href, { replace });
    else window.location.href = href;
  };

  pswp.on('close', () => {
    window.removeEventListener('popstate', onPop);
    if (pushed && !closedByPop) {
      pushed = false;
      window.history.back();
    }
  });
  pswp.on('destroy', () => {
    window.removeEventListener('popstate', onPop);
    if (current === pswp) current = null;
    opts.onClosed?.();
  });

  // ── ui ───────────────────────────────────────────────────────────────
  pswp.on('uiRegister', () => {
    if (work.slug) {
      pswp.ui!.registerElement({
        name: 'share',
        order: 9,
        isButton: true,
        title: 'share',
        ariaLabel: 'share this work',
        html: ICON.share,
        onClick: async () => {
          const url = absoluteUrl(work)!;
          const title = `${work.title}, ${work.artist}`;
          if (isTouch() && typeof navigator.share === 'function') {
            try { await navigator.share({ title, url }); } catch { /* dismissed */ }
            return;
          }
          let ok = false;
          try { await navigator.clipboard.writeText(url); ok = true; } catch { /* no permission */ }
          const toast = pswp.element?.querySelector('.mv-toast');
          if (toast) {
            toast.textContent = ok ? 'link copied' : url;
            toast.classList.add('is-on');
            setTimeout(() => toast.classList.remove('is-on'), 1800);
          }
        },
      });
    }

    pswp.ui!.registerElement({
      name: 'toast',
      appendTo: 'root',
      onInit: el => {
        el.className = 'mv-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
      },
    });

    pswp.ui!.registerElement({
      name: 'caption',
      appendTo: 'root',
      onInit: el => {
        el.classList.add('mv-cap');
        el.innerHTML = captionHtml(work, opts, idBase);
        const btn = el.querySelector<HTMLButtonElement>('.mv-cap-line')!;
        btn.addEventListener('click', () => {
          if (isDesktop()) return;
          const open = el.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(open));
        });
        // keep gestures inside the panel from dragging the image
        for (const ev of ['pointerdown', 'touchstart', 'wheel'] as const) {
          el.addEventListener(ev, e => e.stopPropagation(), { passive: true });
        }
        el.querySelector<HTMLAnchorElement>('.mv-cap-page')?.addEventListener('click', e => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          goToPage((e.currentTarget as HTMLAnchorElement).getAttribute('href')!);
        });
      },
    });

    if (isTouch() && !session.get(HINT_KEY)) {
      session.set(HINT_KEY, '1');
      pswp.ui!.registerElement({
        name: 'hint',
        appendTo: 'root',
        onInit: el => {
          el.className = 'mv-hint';
          el.setAttribute('aria-hidden', 'true');
          el.textContent = 'pinch to zoom';
          const hide = () => el.classList.add('is-gone');
          setTimeout(hide, 2600);
          pswp.on('zoomPanUpdate', hide);
          pswp.on('change', hide);
        },
      });
    }
  });

  pswp.on('firstUpdate', () => {
    pswp.element?.setAttribute('aria-label', `${work.title}, ${work.artist}`);
  });

  // desktop hover labels in words (globals.css): the native title tooltip
  // would double them, so the word moves to data-label / aria-label
  pswp.on('afterInit', () => {
    const labels: Record<string, string> = {
      close: 'close', zoom: 'zoom', share: 'share', 'arrow--prev': 'previous', 'arrow--next': 'next',
    };
    for (const [k, label] of Object.entries(labels)) {
      const b = pswp.element?.querySelector<HTMLElement>(`.pswp__button--${k}`);
      if (!b) continue;
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.getAttribute('title') || label);
      b.removeAttribute('title');
      b.setAttribute('data-label', label);
    }
  });

  current = pswp;
  pswp.init();
}

/** Close any open viewer (route changes). */
export function closeWorkViewer(): void {
  current?.close();
}
