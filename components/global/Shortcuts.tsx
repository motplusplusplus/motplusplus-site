'use client';
/** D5: desktop keyboard shortcuts, quiet, listed by "?". Never while typing.
 *  ← → move between items (viewer, or prev/next on a page), / search, f filter,
 *  g grid/list, r drift, h save to the wall, Esc close. Pages listen for the
 *  mot:search / mot:filter / mot:view events. */
import { useEffect, useState } from 'react';
import { drift } from './Drift';
import { galleryStep, isGalleryOpen } from '@/components/media/gallery';

const KEYS: [string, string][] = [['← →', 'previous / next'], ['/', 'search'], ['f', 'filter'], ['g', 'grid / list'], ['r', 'drift'], ['h', 'save to my wall'], ['esc', 'close'], ['?', 'this list']];
export default function Shortcuts() {
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'Escape') { setHelp(false); return; }
      if (e.key === '?') { e.preventDefault(); setHelp(h => !h); return; }
      if (document.querySelector('.fs-root, .c-keys') && e.key !== '?') return;
      if (isGalleryOpen()) return; // PhotoSwipe handles its own arrows and Esc
      const fire = (n: string) => window.dispatchEvent(new Event(n));
      switch (e.key) {
        case '/': e.preventDefault(); fire('mot:search'); break;
        case 'f': fire('mot:filter'); break;
        case 'g': fire('mot:view'); break;
        case 'r': drift(); break;
        case 'h': document.querySelector<HTMLButtonElement>('[data-wall-id]')?.click(); break;
        case 'ArrowLeft': case 'ArrowRight': {
          const a = document.querySelector<HTMLAnchorElement>(`[data-nav="${e.key === 'ArrowLeft' ? 'prev' : 'next'}"]`);
          if (a) { e.preventDefault(); a.click(); }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  void galleryStep;
  if (!help) return null;
  return (
    <div className="c-keys" role="dialog" aria-modal="true" aria-label="keyboard shortcuts" onClick={() => setHelp(false)}>
      <div className="c-keys-box" onClick={e => e.stopPropagation()}>
        <p className="c-mono c-quiet" style={{ margin: 0 }}>keyboard</p>
        <dl>{KEYS.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>)}</dl>
      </div>
    </div>
  );
}
