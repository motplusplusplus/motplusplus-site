'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Img } from '@/lib/catalogue';
import { CImg } from '@/components/cat/Pieces';
import { openGallery, preloadGallery, viewIndexFromHash } from '@/components/media/gallery';
import { toGalleryItems } from '@/lib/galleryItems';
import { visit, type PathItem } from '@/lib/path';

/** P4: tap the portrait to open it with all their photos (captions and credits) in the viewer. */
export function PortraitButton({ photos, name, children }: { photos: Img[]; name: string; children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const i = viewIndexFromHash();
    if (i !== null && i < photos.length) {
      history.replaceState(history.state, '', location.pathname + location.search);
      openGallery({ items: toGalleryItems(photos), index: i, title: name, thumbFor: k => (k === 0 ? ref.current : null) });
    }
  }, [photos, name]);
  return (
    <button
      ref={ref} type="button" className="c-prof-portrait" onPointerEnter={preloadGallery}
      aria-label={photos.length > 1 ? `view ${photos.length} photos of ${name}` : `view the photo of ${name}`}
      onClick={() => openGallery({ items: toGalleryItems(photos), index: 0, title: name, thumbFor: k => (k === 0 ? ref.current : null) })}
    >
      {children}
    </button>
  );
}

type Row = { slug: string; year: number; title: string; role: string; thumb: Img | null };
/** P7: year · title · role, with the event's cover beside the cursor on desktop. */
export function Timeline({ rows }: { rows: Row[] }) {
  const [hover, setHover] = useState<{ r: Row; x: number; y: number } | null>(null);
  return (
    <>
      <ol className="c-tl">
        {rows.map(r => (
          <li key={r.slug}>
            <a href={`/events/${r.slug}/`} onPointerMove={e => { if (e.pointerType === 'mouse' && r.thumb) setHover({ r, x: e.clientX, y: e.clientY }); }} onPointerLeave={() => setHover(null)}>
              <span className="c-mono c-quiet">{r.year || ''}</span>
              <span className="c-tl-title">{r.title}</span>
              <span className="c-mono c-quiet">{r.role}</span>
            </a>
          </li>
        ))}
      </ol>
      {hover?.r.thumb && (
        <div className="c-hover-tile is-on" aria-hidden="true" style={{ width: 200, left: Math.min(hover.x + 18, window.innerWidth - 220), top: Math.min(hover.y + 12, window.innerHeight - 160) }}>
          <CImg img={hover.r.thumb} sizes="200px" alt="" className="" />
        </div>
      )}
    </>
  );
}

export function Visited({ item }: { item: PathItem }) {
  useEffect(() => { visit(item); }, [item]);
  return null;
}
