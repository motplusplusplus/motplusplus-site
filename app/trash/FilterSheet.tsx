'use client';

import { useEffect, useRef, useState } from 'react';
import type { Availability, SortOption, TypeFilter } from './TrashPageShell';

type Props = {
  open: boolean;
  onClose: () => void;
  availability: Availability;
  setAvailability: (a: Availability) => void;
  counts: Record<Availability, number>;
  sort: SortOption;
  setSort: (s: SortOption) => void;
  typeFilter: TypeFilter;
  setType: (t: TypeFilter) => void;
  typeOptions: { value: string; label: string; count: number }[];
  resultCount: number;
  onClear: () => void;
};

const CLOSE_MS = 220;

/** Bottom sheet: slides up with a gentle spring, closes with a swipe down,
 *  a tap on the backdrop, Esc, or "done". Focus stays inside while open and
 *  returns to the filter pill after. Padded for the iPhone home indicator. */
export default function FilterSheet(p: Props) {
  const [mounted, setMounted] = useState(p.open);
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);

  // mount on open, start the slide-out on close (adjusting state during
  // render, React's recommended alternative to setState in an effect)
  const [prevOpen, setPrevOpen] = useState(p.open);
  if (p.open !== prevOpen) {
    setPrevOpen(p.open);
    if (p.open) setMounted(true); else setShown(false);
  }

  useEffect(() => {
    if (p.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      // two frames: the sheet must paint off-screen once before sliding in
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    if (!mounted) return;
    const t = setTimeout(() => { setMounted(false); returnFocus.current?.focus?.(); }, CLOSE_MS);
    return () => clearTimeout(t);
  }, [p.open, mounted]);

  useEffect(() => {
    if (!shown) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); p.onClose(); return; }
      if (e.key !== 'Tab' || !sheet) return;
      const f = Array.from(sheet.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled'));
      if (f.length === 0) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [shown, p]);

  if (!mounted) return null;

  // Swipe down to close, from the handle and header. Those carry
  // touch-action: none (CSS) so the browser never claims the gesture as a
  // scroll mid-drag; the options below keep normal scrolling.
  const onPointerDown = (e: React.PointerEvent) => {
    const sheet = sheetRef.current;
    if (!sheet || !(e.target as HTMLElement).closest('.fs-handle, .fs-head')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current, sheet = sheetRef.current;
    if (!d || !sheet) return;
    d.dy = Math.max(0, e.clientY - d.y);
    if (d.dy > 4) {
      sheet.style.transition = 'none';
      sheet.style.transform = `translateY(${d.dy}px)`;
    }
  };
  const onPointerUp = () => {
    const d = drag.current, sheet = sheetRef.current;
    drag.current = null;
    if (!d || !sheet) return;
    sheet.style.transition = '';
    sheet.style.transform = '';
    const velocity = d.dy / Math.max(1, performance.now() - d.t);
    if (d.dy > 90 || (d.dy > 24 && velocity > 0.5)) p.onClose();
  };

  return (
    <div className={`fs-root${shown ? ' is-open' : ''}`}>
      <div className="fs-backdrop" onClick={p.onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="fs-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fs-title"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="fs-handle" aria-hidden="true"><span /></div>
        <div className="fs-head">
          <h2 id="fs-title" className="mot-mono mot-label">filter</h2>
          <button type="button" className="mot-link mot-mono" onClick={p.onClear}>clear</button>
        </div>

        <fieldset className="fs-group">
          <legend className="mot-mono mot-label">show</legend>
          <div className="fs-options">
            {(['all', 'available', 'sold'] as Availability[]).map((a, i) => (
              <button
                key={a}
                type="button"
                className="mot-opt"
                aria-pressed={p.availability === a}
                onClick={() => p.setAvailability(a)}
                data-autofocus={i === 0 ? '' : undefined}
              >
                {a}<span className="mot-opt-n">{p.counts[a]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs-group">
          <legend className="mot-mono mot-label">order</legend>
          <div className="fs-options">
            {([['random', 'random'], ['date', 'date added'], ['artist', 'artist']] as [SortOption, string][]).map(([v, label]) => (
              <button key={v} type="button" className="mot-opt" aria-pressed={p.sort === v} onClick={() => p.setSort(v)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {p.typeOptions.length > 0 && (
          <fieldset className="fs-group">
            <legend className="mot-mono mot-label">work type</legend>
            <div className="fs-options">
              <button type="button" className="mot-opt" aria-pressed={p.typeFilter === 'all'} onClick={() => p.setType('all')}>
                all
              </button>
              {p.typeOptions.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className="mot-opt"
                  aria-pressed={p.typeFilter === t.value}
                  onClick={() => p.setType(t.value as TypeFilter)}
                >
                  {t.label}<span className="mot-opt-n">{t.count}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <button type="button" className="mot-btn mot-btn-solid fs-done" onClick={p.onClose}>
          show {p.resultCount} {p.resultCount === 1 ? 'work' : 'works'}
        </button>
      </div>
    </div>
  );
}
