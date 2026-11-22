'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkImg from './WorkImg';
import { openWorkViewer, preloadViewer } from './viewer';
import { morphArrived } from './morph';
import { GRID_SINGLE_WIDTHS } from '@/lib/workImage';
import type { Work, WorkImage } from '@/lib/trashWork';
import { youtubeId } from '@/lib/youtube';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The work page's images, full width; each opens the viewer at itself.
 *  A video work's YouTube still (no photo in Sanity) plays the video in
 *  place instead, so the page never shows a still above its own player.
 *  Arriving from outside the site (a shared link) opens the viewer at once,
 *  over the page, so the link lands on the work; closing it shows the page. */
export default function WorkPageImages({ work }: { work: Work }) {
  const router = useRouter();
  const refs = useRef<(HTMLImageElement | null)[]>([]);
  const heroWrap = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    morphArrived(heroWrap.current?.querySelector('img:not(.mot-img-ph)') ?? null);
  }, []);

  useEffect(() => {
    preloadViewer();
    // A landing = this document was loaded AT this work's address, from
    // outside the site. document.referrer alone is not enough: it never
    // changes on client-side navigation, so an in-site visit to a work page
    // would still look "external".
    let landed = false;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const loadedHere = !!nav && new URL(nav.name).pathname.replace(/\/?$/, '/') === window.location.pathname.replace(/\/?$/, '/');
      const fromOutside = !document.referrer || new URL(document.referrer).origin !== window.location.origin;
      landed = loadedHere && fromOutside && nav?.type !== 'back_forward' && nav?.type !== 'reload';
    } catch { /* not a landing */ }
    if (!landed || work.images.length === 0) return;
    // once per landing: a reload or back to this entry should not reopen it
    const key = `mot:landed:${work._id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage off: still open once */ }
    const hero = refs.current[0];
    const go = () => openWorkViewer({
      work, index: 0, history: true, onWorkPage: true,
      thumbFor: i => refs.current[i] ?? null,
      navigate: (href, { replace }) => (replace ? router.replace(href) : router.push(href)),
    });
    if (hero && !hero.complete) hero.addEventListener('load', go, { once: true });
    else go();
  }, [work, router]);

  if (work.images.length === 0) return null;
  return (
    <div className="wp-images">
      {work.images.map((img, i) => img.video ? (
        <div key={img.url + i} ref={i === 0 ? heroWrap : undefined}>
          <VideoStill
            img={img}
            title={`${work.title}, ${work.artist}`}
            priority={i === 0}
            imgRef={el => { refs.current[i] = el; }}
          />
        </div>
      ) : (
        <div key={img.url + i} ref={i === 0 ? heroWrap : undefined}>
          <button
            type="button"
            className="wp-img-btn"
            aria-label={`view image ${i + 1} of ${work.images.length} full screen`}
            onClick={() => openWorkViewer({
              work, index: i, history: true, onWorkPage: true,
              thumbFor: j => refs.current[j] ?? null,
              navigate: (href, { replace }) => (replace ? router.replace(href) : router.push(href)),
            })}
          >
            <WorkImg
              img={img}
              widths={GRID_SINGLE_WIDTHS}
              sizes="(min-width: 900px) 860px, 100vw"
              priority={i === 0}
              imgRef={el => { refs.current[i] = el; }}
              defaultWidth={1200}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

/** The still, with a play mark; a tap swaps in the YouTube player, playing. */
function VideoStill({ img, title, priority, imgRef }: {
  img: WorkImage; title: string; priority: boolean; imgRef: (el: HTMLImageElement | null) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const id = img.video ? youtubeId(img.video) : null;
  if (playing && id) {
    return (
      <div className="wp-yt-frame" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" className="wp-yt" aria-label={`play ${title}`} onClick={() => setPlaying(true)}>
      <WorkImg img={img} widths={GRID_SINGLE_WIDTHS} sizes="(min-width: 900px) 860px, 100vw" priority={priority} imgRef={imgRef} defaultWidth={1280} />
      <span className="wp-yt-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
      </span>
    </button>
  );
}
