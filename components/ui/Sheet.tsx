'use client';
/** A generic bottom sheet (phones) / small panel (desktop), the same mechanics
 *  and look as the +1 trash filter sheet (fs-* classes in globals.css): spring
 *  up, swipe down / backdrop / Esc to close, focus kept inside, focus returned. */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

const CLOSE_MS = 220;
export default function Sheet({ open, onClose, mode, anchor, title, headExtra, children, id }: {
  open: boolean; onClose: () => void; mode: 'sheet' | 'panel'; anchor?: RefObject<HTMLElement | null>;
  title: string; headExtra?: ReactNode; children: ReactNode; id: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) { setPrevOpen(open); if (open) setMounted(true); else setShown(false); }

  useEffect(() => {
    if (open) {
      back.current = document.activeElement as HTMLElement | null;
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    if (!mounted) return;
    const t = setTimeout(() => {
      const a = document.activeElement;
      const lost = !a || a === document.body || !!ref.current?.contains(a);
      setMounted(false);
      if (lost) back.current?.focus?.({ preventScroll: true });
    }, CLOSE_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  const panel = mode === 'panel';
  useEffect(() => {
    if (!shown) return;
    const el = ref.current;
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>('button, input, textarea'))?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    if (!panel) document.body.style.overflow = 'hidden';
    const onDown = (e: PointerEvent) => { const t = e.target as Node; if (el?.contains(t) || anchor?.current?.contains(t)) return; onClose(); };
    if (panel) document.addEventListener('pointerdown', onDown, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (panel || e.key !== 'Tab' || !el) return;
      const f = Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])')).filter(x => !x.hasAttribute('disabled'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown, true); if (!panel) document.body.style.overflow = prev; };
  }, [shown, panel, onClose, anchor]);

  if (!mounted) return null;
  const down = (e: React.PointerEvent) => {
    if (panel || !(e.target as HTMLElement).closest('.fs-handle, .fs-head') || (e.target as HTMLElement).closest('button')) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const move = (e: React.PointerEvent) => { const d = drag.current, s = ref.current; if (!d || !s) return; d.dy = Math.max(0, e.clientY - d.y); if (d.dy > 4) { s.style.transition = 'none'; s.style.transform = `translateY(${d.dy}px)`; } };
  const up = () => { const d = drag.current, s = ref.current; drag.current = null; if (!d || !s) return; s.style.transition = ''; s.style.transform = ''; const v = d.dy / Math.max(1, performance.now() - d.t); if (d.dy > 90 || (d.dy > 24 && v > 0.5)) onClose(); };
  const body = (
    <>
      {!panel && <div className="fs-handle" aria-hidden="true"><span /></div>}
      <div className="fs-head">
        <h2 id={`${id}-t`} className="mot-mono mot-label">{title}</h2>
        {headExtra}
      </div>
      {children}
    </>
  );
  if (panel) return <div ref={ref} className={`fs-panel${shown ? ' is-open' : ''}`} role="dialog" aria-modal="false" aria-labelledby={`${id}-t`}>{body}</div>;
  return (
    <div className={`fs-root${shown ? ' is-open' : ''}`}>
      <div className="fs-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="fs-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{body}</div>
    </div>
  );
}
