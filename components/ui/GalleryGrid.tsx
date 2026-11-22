'use client';
/** Thumbnails that open the gallery viewer; a shared #view-N link opens it on load. */
import { useEffect, useRef } from 'react';
import { toGalleryItems, type GItem } from '@/lib/galleryItems';
import { CImg, THIN } from '@/components/cat/Pieces';
import { openGallery, preloadGallery, viewIndexFromHash, youtubeStill } from '@/components/media/gallery';


export default function GalleryGrid({ items, title, className = 'c-gallery', offset = 0, all, autoOpen = true, captions = false }: {
  items: GItem[]; title: string; className?: string; captions?: boolean;
  /** index of items[0] within `all` (when the hero is a separate button) */
  offset?: number; all?: GItem[]; autoOpen?: boolean;
}) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const full = all ?? items;
  useEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
    if (idle) idle(preloadGallery); else setTimeout(preloadGallery, 1500);
    if (!autoOpen) return;
    const i = viewIndexFromHash();
    if (i !== null && i < full.length) {
      history.replaceState(history.state, '', location.pathname + location.search);
      openGallery({ items: toGalleryItems(full), index: i, title, thumbFor: k => refs.current[k - offset] ?? null });
    }
  }, [autoOpen, full, offset, title]);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map((it, i) => {
        const still = it.video && !it.url ? youtubeStill(it.video) : null;
        const img = it.url ? it : still ? { url: still, w: 480, h: 360 } : null;
        const cap = captions ? [it.caption, it.credit ? `photo: ${it.credit}` : null].filter(Boolean).join(' · ') : '';
        const btn = (
          <button
            key={(it.url ?? it.video ?? '') + i}
            type="button"
            ref={el => { refs.current[i] = el; }}
            aria-label={`${it.video ? 'play' : 'view'} ${it.caption || title}, ${i + 1 + offset} of ${full.length}`}
            onClick={() => openGallery({ items: toGalleryItems(full), index: i + offset, title, thumbFor: k => refs.current[k - offset] ?? null })}
          >
            {img ? <CImg img={img} sizes="(min-width: 1100px) 22vw, (min-width: 720px) 30vw, 46vw" minFill={120} alt="" /> : <span className="c-type" style={{ aspectRatio: '1' }}><span className="c-type-name">video</span></span>}
            {it.video && <span className="c-play" aria-hidden="true">{THIN.play}</span>}
          </button>
        );
        return captions ? <figure key={(it.url ?? it.video ?? '') + i} style={{ margin: 0 }}>{btn}{cap && <figcaption className="c-mono c-quiet" style={{ marginTop: 5, lineHeight: 1.45 }}>{cap}</figcaption>}</figure> : btn;
      })}
    </div>
  );
}
