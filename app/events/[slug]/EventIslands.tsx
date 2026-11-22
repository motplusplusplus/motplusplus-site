'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useStored } from '@/lib/useStore';
import Prose from '@/components/ui/Prose';
import type { Para } from '@/lib/prose';
import { openGallery, preloadGallery, viewIndexFromHash, type GalleryItem } from '@/components/media/gallery';

const LANG = 'mot:events:lang';

/** E9 + E10: EN / VN switch (remembered for the session), text with "read more". */
export function EventText({ en, vn, titleEn, titleVn }: { en: Para[]; vn: Para[]; titleEn: string; titleVn: string | null }) {
  const both = en.length > 0 && vn.length > 0;
  const fallback: 'en' | 'vi' = en.length ? 'en' : 'vi';
  const stored = useStored(() => { try { return sessionStorage.getItem(LANG); } catch { return null; } }, 'mot:lang', null);
  const lang: 'en' | 'vi' = both && (stored === 'en' || stored === 'vi') ? stored : fallback;
  const pick = (l: 'en' | 'vi') => { try { sessionStorage.setItem(LANG, l); } catch { /* ignore */ } window.dispatchEvent(new Event('mot:lang')); };
  useEffect(() => {
    const h = document.querySelector<HTMLElement>('[data-ev-title]');
    if (h && titleVn) h.textContent = lang === 'vi' ? titleVn : titleEn;
  }, [lang, titleEn, titleVn]);
  if (!en.length && !vn.length) return null;
  const long = (ps: Para[]) => ps.reduce((n, p) => n + p.map(s => s.t).join('').length, 0) > 2400;
  return (
    <div>
      {both && (
        <div className="c-lang" role="group" aria-label="language" style={{ marginTop: 20 }}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => pick('en')} lang="en">EN</button>
          <button type="button" aria-pressed={lang === 'vi'} onClick={() => pick('vi')} lang="vi">VN</button>
        </div>
      )}
      {/* both languages are in the HTML; the other one is hidden, not absent */}
      {en.length > 0 && <div hidden={lang !== 'en'}><Prose paras={en} limit={150} className={`c-prose${long(en) ? ' is-essay' : ''}`} lang="en" /></div>}
      {vn.length > 0 && <div hidden={lang !== 'vi'}><Prose paras={vn} limit={150} className={`c-prose${long(vn) ? ' is-essay' : ''}`} lang="vi" /></div>}
    </div>
  );
}

/** E8: the large cover; tap opens the full gallery. A shared #view-N opens it on load. */
export function Hero({ items, title, children }: { items: GalleryItem[]; title: string; children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const i = viewIndexFromHash();
    if (i !== null && i < items.length) {
      history.replaceState(history.state, '', location.pathname + location.search);
      openGallery({ items, index: i, title, thumbFor: k => (k === 0 ? ref.current : null) });
    }
  }, [items, title]);
  return (
    <button ref={ref} type="button" className="c-ev-hero" onPointerEnter={preloadGallery} aria-label={`view ${items.length} image${items.length === 1 ? '' : 's'} of ${title}`}
      onClick={() => openGallery({ items, index: 0, title, thumbFor: k => (k === 0 ? ref.current : null) })}>
      {children}
    </button>
  );
}
