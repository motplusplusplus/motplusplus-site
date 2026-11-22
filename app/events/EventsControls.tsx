'use client';

/** The events index's only client code. Works on the server-rendered archive:
 *  - grid / list toggle (a class on #ev-archive; the choice is kept for the session)
 *  - search across titles (EN and VN), people, venues, descriptions; matches are
 *    highlighted on the original title text (S5, E6)
 *  - now & next: hides anything that has ended since the build
 *  - on this day (today ±3 days, past years), rendered from the embedded list
 *  - the year strip: current year marked; tap or drag along it to scrub (D6)
 *  - list view: the cover beside the cursor on desktop */

import { useEffect, useRef, useState } from 'react';
import { THIN } from '@/components/cat/Pieces';
import { highlightRanges, matchesAll, queryTerms, fold } from '@/lib/fold';

const VIEW = 'mot:events:view';
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // Ho Chi Minh City
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function setView(v: 'grid' | 'list') {
  const a = document.getElementById('ev-archive');
  a?.classList.remove('is-grid', 'is-list');
  a?.classList.add(`is-${v}`);
  try { sessionStorage.setItem(VIEW, v); } catch { /* ignore */ }
}
const currentView = (): 'grid' | 'list' => (document.getElementById('ev-archive')?.classList.contains('is-list') ? 'list' : 'grid');

export default function EventsControls({ total }: { total: number }) {
  const [view, setViewState] = useState<'grid' | 'list'>('grid');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(total);
  const index = useRef<Record<string, string> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = () => { const n = currentView() === 'grid' ? 'list' : 'grid'; setView(n); setViewState(n); };

  // one-time upkeep of the server-rendered page
  useEffect(() => {
    queueMicrotask(() => setViewState(currentView()));
    // ?now=YYYY-MM-DD shows the page as on that day (for review screenshots only)
    const override = new URLSearchParams(location.search).get('now');
    const t = override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : today();
    // now & next: drop anything that ended after the build
    const now = document.getElementById('ev-now');
    if (now) {
      let left = 0;
      for (const card of Array.from(now.querySelectorAll<HTMLElement>('[data-end]'))) { const on = (card.dataset.end ?? '') >= t; card.hidden = !on; if (on) left++; }
      now.hidden = !left;
    }
    // on this day in MoT+++ (D2)
    try {
      const mini = JSON.parse(document.getElementById('ev-mini')?.textContent || '[]') as [string, string, string, string][];
      const md = (iso: string) => { const d = new Date(iso + 'T00:00:00Z'); return d.getUTCMonth() * 31 + d.getUTCDate(); };
      const y = +t.slice(0, 4), m0 = md(t);
      const hits = mini.filter(([, , s]) => s && +s.slice(0, 4) < y && Math.abs(md(s) - m0) <= 3).sort((a, b) => b[2].localeCompare(a[2]));
      const sec = document.getElementById('ev-otd'), list = document.getElementById('ev-otd-list');
      if (hits.length && sec && list) {
        list.innerHTML = hits.map(([slug, title, start, img]) => `<a href="/events/${esc(slug)}/">${img
          ? `<span class="c-img"><img src="${esc(img)}" alt="" loading="lazy"></span>`
          : `<span class="c-type"><span class="c-type-name">${esc(title)}</span></span>`}<span class="c-mono" style="display:block;margin-top:6px">${start.slice(0, 4)}</span><span style="display:block;font-size:13px;line-height:1.35">${esc(title)}</span></a>`).join('');
        sec.hidden = false;
      }
    } catch { /* leave it hidden */ }
    // a shared ?q=
    const qq = new URLSearchParams(location.search).get('q');
    if (qq) queueMicrotask(() => { setOpen(true); setQ(qq); });
  }, []);

  // keyboard (components/global/Shortcuts)
  useEffect(() => {
    const s = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 20); };
    const v = () => toggle();
    window.addEventListener('mot:search', s);
    window.addEventListener('mot:view', v);
    return () => { window.removeEventListener('mot:search', s); window.removeEventListener('mot:view', v); };
  }, []);

  // search: show matching items, highlight on the original titles
  useEffect(() => {
    const terms = queryTerms(q);
    const apply = () => {
      let n = 0;
      for (const g of Array.from(document.querySelectorAll<HTMLElement>('#ev-archive [data-year]'))) {
        let gn = 0;
        for (const li of Array.from(g.querySelectorAll<HTMLElement>('li[data-slug]'))) {
          const title = li.querySelector<HTMLElement>('.c-ev-title')!;
          title.dataset.orig ??= title.textContent ?? '';
          const orig = title.dataset.orig;
          const hay = index.current?.[li.dataset.slug!] ?? fold([orig, li.querySelector('.c-ev-cat')?.textContent, li.querySelector('.c-ev-venue')?.textContent].join(' '));
          const ok = !terms.length || matchesAll(hay, terms);
          li.hidden = !ok;
          if (ok) { gn++; n++; }
          if (!terms.length) { if (title.innerHTML !== esc(orig)) title.textContent = orig; continue; }
          let html = '', at = 0;
          for (const [s, e] of highlightRanges(orig, terms)) { html += esc(orig.slice(at, s)) + `<mark class="mot-mark">${esc(orig.slice(s, e))}</mark>`; at = e; }
          title.innerHTML = html + esc(orig.slice(at));
        }
        g.hidden = gn === 0;
        const c = g.querySelector('[data-count]'); if (c) c.textContent = String(gn);
      }
      setCount(n);
      const empty = document.getElementById('ev-empty'); if (empty) empty.hidden = n > 0;
      for (const id of ['ev-now', 'ev-otd']) { const el = document.getElementById(id); if (el) el.style.display = terms.length ? 'none' : ''; }
    };
    if (terms.length && !index.current) {
      fetch('/events/search.json').then(r => r.json()).then(j => { index.current = j; apply(); }).catch(() => apply());
    }
    apply();
    const url = new URL(location.href);
    if (q.trim()) url.searchParams.set('q', q.trim()); else url.searchParams.delete('q');
    history.replaceState(history.state, '', url);
  }, [q]);

  // year strip: the year on screen, and scrubbing
  useEffect(() => {
    const strip = document.getElementById('ev-years');
    const groups = Array.from(document.querySelectorAll<HTMLElement>('#ev-archive [data-year]'));
    if (!strip || !groups.length) return;
    const mark = (y: string) => strip.querySelectorAll<HTMLElement>('[data-jump]').forEach(b => b.classList.toggle('is-on', b.dataset.jump === y));
    const io = new IntersectionObserver(es => {
      const vis = es.filter(x => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) mark((vis.target as HTMLElement).dataset.year!);
    }, { rootMargin: '-80px 0px -60% 0px' });
    groups.forEach(g => io.observe(g));
    let down = false;
    const jump = (x: number, y: number) => {
      const a = document.elementFromPoint(x, y)?.closest<HTMLAnchorElement>('a[data-jump][href]');
      if (!a) return;
      const target = document.getElementById(`y-${a.dataset.jump}`);
      if (target && !target.hidden) target.scrollIntoView({ block: 'start' });
    };
    const pd = (e: PointerEvent) => { if (e.pointerType === 'mouse') { down = true; } };
    const pm = (e: PointerEvent) => { if (down || e.pointerType !== 'mouse') jump(e.clientX, e.clientY); };
    const pu = () => { down = false; };
    strip.addEventListener('pointerdown', pd);
    strip.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    return () => { io.disconnect(); strip.removeEventListener('pointerdown', pd); strip.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
  }, []);

  // list view: the cover beside the cursor (desktop)
  useEffect(() => {
    const arch = document.getElementById('ev-archive');
    if (!arch || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const box = document.createElement('div');
    box.className = 'c-hover-tile';
    box.style.width = '220px';
    box.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box);
    let cur: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const li = arch.classList.contains('is-list') ? (e.target as HTMLElement).closest<HTMLElement>('li[data-cover]') : null;
      if (!li || !li.dataset.cover) { box.classList.remove('is-on'); cur = null; return; }
      if (li !== cur) { cur = li; box.innerHTML = `<span class="c-img c-hover-wide"><img src="${esc(li.dataset.cover)}" alt=""></span>`; }
      box.style.left = `${Math.min(e.clientX + 18, window.innerWidth - 240)}px`;
      box.style.top = `${Math.min(e.clientY + 12, window.innerHeight - 170)}px`;
      box.classList.add('is-on');
    };
    const leave = () => { box.classList.remove('is-on'); cur = null; };
    arch.addEventListener('pointermove', move);
    arch.addEventListener('pointerleave', leave);
    return () => { arch.removeEventListener('pointermove', move); arch.removeEventListener('pointerleave', leave); box.remove(); };
  }, []);

  return (
    <>
      <div className="c-controls" role="toolbar" aria-label="browse events">
        <span className="c-mono c-quiet c-count" aria-live="polite">{q.trim() ? `${count} of ${total}` : `${total} events`}</span>
        <button type="button" className="mot-icon-btn" onClick={toggle} aria-pressed={view === 'list'} aria-label={view === 'grid' ? 'show as a list' : 'show as a grid'} data-label={view === 'grid' ? 'list view' : 'grid view'}>
          {view === 'grid' ? THIN.list : THIN.grid}
        </button>
        <button type="button" className="mot-icon-btn" aria-expanded={open} aria-controls="ev-search" aria-label={open ? 'close search' : 'search events'} data-label={open ? 'close search' : 'search'}
          onClick={() => { const n = !open; setOpen(n); if (n) setTimeout(() => inputRef.current?.focus(), 20); else setQ(''); }}>{THIN.search}</button>
      </div>
      {open && (
        <div className="c-search" id="ev-search">
          <input ref={inputRef} type="search" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setQ(''); setOpen(false); } }}
            placeholder="title, artist, venue, words" aria-label="search event titles, artists, venues and descriptions" autoComplete="off" enterKeyHint="search" />
        </div>
      )}
    </>
  );
}
