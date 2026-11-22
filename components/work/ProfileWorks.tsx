'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import WorkImg from './WorkImg';
import ScaleDrawing from './ScaleDrawing';
import { openWorkViewer, preloadViewer } from './viewer';
import { navigateWithMorph } from './morph';
import { GRID_DENSE_WIDTHS } from '@/lib/workImage';
import type { Work } from '@/lib/trashWork';

/** A profile's works in the /trash caption style: real proportions, the
 *  image opens the shared viewer, the title opens the work page. Works with
 *  no photo yet show their scale drawing in its place. */
export default function ProfileWorks({ title, works }: { title: string; works: Work[] }) {
  const router = useRouter();
  const imgs = useRef(new Map<string, HTMLImageElement | null>());
  if (works.length === 0) return null;

  return (
    <section className="pw" aria-labelledby={`pw-${title.replace(/\W+/g, '-')}`} onPointerEnter={preloadViewer}>
      <h2 id={`pw-${title.replace(/\W+/g, '-')}`} className="mot-mono mot-label">{title}</h2>
      <ul className="pw-grid">
        {works.map(w => {
          const img = w.images[0];
          const href = w.slug ? `/trash/${w.slug}/` : null;
          const toPage = (e: React.MouseEvent) => {
            if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            navigateWithMorph(router.push, href, imgs.current.get(w._id) ?? null);
          };
          return (
            <li key={w._id} className="pw-card">
              {img ? (
                <button
                  type="button"
                  className="tg-media"
                  aria-label={`view ${w.title}, ${w.artist}`}
                  onClick={() => openWorkViewer({
                    work: w, history: true,
                    thumbFor: i => (i === 0 ? imgs.current.get(w._id) ?? null : null),
                    navigate: (h, { replace }) => (replace ? router.replace(h) : router.push(h)),
                  })}
                >
                  <WorkImg
                    img={img}
                    widths={GRID_DENSE_WIDTHS}
                    sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw"
                    defaultWidth={400}
                    imgRef={el => { imgs.current.set(w._id, el); }}
                  />
                </button>
              ) : href && w.dims ? (
                <a href={href} onClick={toPage} className="pw-noimg" aria-label={`${w.title}, ${w.artist}: no photo yet, open the work page`}>
                  <ScaleDrawing dims={w.dims} />
                </a>
              ) : null}
              <div className="tg-cap">
                {href ? <a href={href} onClick={toPage} className="tg-title">{w.title}</a> : <span className="tg-title">{w.title}</span>}
                <p className="mot-mono tg-meta">
                  <span>{[w.year, w.medium].filter(Boolean).join(', ')}</span>
                  {w.sold && <><span className="mot-dot" aria-hidden="true" /><span className="mot-sr">, sold</span></>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
