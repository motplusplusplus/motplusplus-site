'use client';
/** NO TRACKERS: third-party players load only after the visitor taps play.
 *  YouTube → youtube-nocookie.com, Vimeo → dnt=1, Bandcamp → its player, all
 *  inserted on tap. Until then: the video's still (YouTube) or a quiet card. */
import { useState } from 'react';
import { THIN } from '@/components/cat/Pieces';

function ytId(url: string): string | null {
  return url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null;
}
function vimeoId(url: string): string | null { return url.match(/vimeo\.com\/(?:video\/)?(\d{5,})/)?.[1] ?? null; }

export function playerSrc(url: string): string | null {
  const y = ytId(url); if (y) return `https://www.youtube-nocookie.com/embed/${y}?autoplay=1&rel=0&playsinline=1`;
  const v = vimeoId(url); if (v) return `https://player.vimeo.com/video/${v}?autoplay=1&dnt=1`;
  return null;
}

export default function ClickToPlay({ url, title, bandcampAlbumId, aspect = '16 / 9', height }: {
  url?: string; title: string; bandcampAlbumId?: string; aspect?: string; height?: number;
}) {
  const [on, setOn] = useState(false);
  const src = bandcampAlbumId
    ? `https://bandcamp.com/EmbeddedPlayer/album=${bandcampAlbumId}/size=large/bgcol=f6f3ee/linkcol=1c1a17/tracklist=false/artwork=small/transparent=true/`
    : url ? playerSrc(url) : null;
  if (!src) return null;
  const box: React.CSSProperties = height ? { height, maxWidth: 700 } : { aspectRatio: aspect };
  if (on) {
    return (
      <div style={{ position: 'relative', width: '100%', ...box }}>
        <iframe src={src} title={title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      </div>
    );
  }
  const y = url ? ytId(url) : null;
  return (
    <button type="button" onClick={() => setOn(true)} aria-label={`play ${title}`}
      style={{ position: 'relative', display: 'block', width: '100%', padding: 0, border: 0, cursor: 'pointer', background: 'var(--c-card, #ece7df)', ...box }}>
      {y
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={`https://i.ytimg.com/vi/${y}/hqdefault.jpg`} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span className="c-mono c-quiet" style={{ position: 'absolute', left: 14, bottom: 12 }}>{bandcampAlbumId ? 'listen: the recording on bandcamp' : 'play the video'}</span>}
      <span className="c-play" aria-hidden="true" style={{ left: '50%', top: '50%', bottom: 'auto', transform: 'translate(-50%, -50%)', width: 52, height: 52 }}>{THIN.play}</span>
    </button>
  );
}
