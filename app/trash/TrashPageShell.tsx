'use client';

/** The /trash grid (2026-11-22 rework). The work comes first; everything else
 *  is quiet monospace that recedes.
 *
 *  ORDER. Random, frozen per visitor for the session (seed in sessionStorage).
 *  The static HTML lists every work in the canonical Sanity order; an inline
 *  script right after it (page.tsx) applies this visitor's seeded order with
 *  CSS `order` and hides all but the first batch, BEFORE first paint, so the
 *  first image a phone paints is already the right one (no reshuffle after
 *  hydration, which used to cost the largest-paint metric). On hydration
 *  React renders the same order for real and the inline styles are cleared.
 *
 *  STATE. Filters, search, view and how many are shown are kept in
 *  sessionStorage when leaving for a work page, and restored (with the scroll
 *  position) on the way back. ?type= stays in the address, shareable.
 *
 *  PRICES. Never in the static export. The seven-click gate on the word
 *  "trash" asks the worker (/api/pricelist), as before. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CONTACTS } from '@/lib/contacts';
import { compareNames } from '@/lib/sortName';
import { TRASH_WORK_TYPES, isTrashWorkType, type TrashWorkType } from '@/lib/trashWorkTypes';
import {
  isTimeBased, matchesSearch, prefersReducedMotion, trashOrder, session,
  RETURN_KEY, SEED_KEY, VIEW_KEY, type Work,
} from '@/lib/trashWork';
import { GRID_DENSE_WIDTHS, GRID_SINGLE_WIDTHS } from '@/lib/workImage';
import WorkImg from '@/components/work/WorkImg';
import { openWorkViewer, preloadViewer } from '@/components/work/viewer';
import { navigateWithMorph } from '@/components/work/morph';
import FilterSheet from './FilterSheet';

import {
  BATCH, DENSE_DEFAULT_QUERY, GRID_DENSE_SIZES, GRID_ID, GRID_SINGLE_SIZES, ORDER_STYLE_ID, PANEL_QUERY, PRE_DENSE_CLASS,
} from '@/lib/trashGrid';
const CLICKS_NEEDED = 7;

/** The always-visible two-state switch: "available / all works". */
export type Availability = 'all' | 'available';
export type SortOption = 'random' | 'date' | 'artist';
export type TypeFilter = 'all' | TrashWorkType;
type View = 'single' | 'dense';

type Saved = {
  availability: Availability; sort: SortOption; type: TypeFilter; q: string;
  shown: number; scrollY: number; t: number;
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function readSeed(): number {
  const w = window as Window & { __motTrashSeed?: number };
  if (typeof w.__motTrashSeed === 'number') return w.__motTrashSeed;
  const stored = Number(session.get(SEED_KEY));
  if (stored > 0) return stored;
  const fresh = Math.floor(Math.random() * 4294967295) + 1;
  session.set(SEED_KEY, String(fresh));
  return fresh;
}

function readReturn(): Saved | null {
  const raw = session.get(RETURN_KEY);
  if (!raw) return null;
  session.remove(RETURN_KEY);
  try {
    const s = JSON.parse(raw) as Saved;
    return Date.now() - s.t < 60 * 60 * 1000 ? s : null;
  } catch { return null; }
}

function typeFromUrl(): TypeFilter {
  const t = new URLSearchParams(window.location.search).get('type');
  return isTrashWorkType(t) ? t : 'all';
}

function columnsFor(width: number): number {
  if (width >= 1200) return 4;
  if (width >= 720) return 3;
  return 2;
}

/** Shortest-column masonry from known aspect ratios: real proportions, never
 *  cropped, reading order kept as far as heights allow. */
function toColumns(items: Work[], cols: number): Work[][] {
  const out: Work[][] = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  for (const w of items) {
    const img = w.images[0];
    const ratio = img ? img.h / img.w : 1;
    let c = 0;
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.01) c = i;
    out[c].push(w);
    heights[c] += ratio + 0.28; // + caption
  }
  return out;
}

export default function TrashPageShell({ items }: { items: Work[] }) {
  const router = useRouter();

  // ── first render ─────────────────────────────────────────────────────
  // While hydrating the static HTML, React must render exactly what the
  // server did: every work, canonical order. A client-side mount (back from
  // a work page) has no such constraint and renders the final state at once.
  const [hydrating] = useState(() => typeof document !== 'undefined' && !!document.getElementById(GRID_ID));
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability>('all');
  const [sort, setSort] = useState<SortOption>('random');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<View>('single');
  const [shown, setShown] = useState(BATCH);
  const [cols, setCols] = useState(2);
  const [sheetOpen, setSheetOpen] = useState(false);
  // desktop: a small panel under the pill; phone: the bottom sheet
  const [sheetMode, setSheetMode] = useState<'sheet' | 'panel'>('sheet');
  const pillRef = useRef<HTMLButtonElement>(null);
  const pendingScroll = useRef<number | null>(null);
  const prevShown = useRef(BATCH);

  // price gate
  const [clicks, setClicks] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const imgRefs = useRef(new Map<string, HTMLImageElement | null>());
  const flipRects = useRef<Map<string, DOMRect> | null>(null);

  // Restore everything before the first client paint.
  useIsoLayoutEffect(() => {
    // React now renders this visitor's order itself: drop the inline
    // script's pre-paint ordering (page.tsx)
    document.getElementById(ORDER_STYLE_ID)?.remove();
    document.documentElement.classList.remove(PRE_DENSE_CLASS);
    setSeed(readSeed());
    const saved = readReturn();
    const urlType = typeFromUrl();
    const storedView = session.get(VIEW_KEY);
    if (storedView === 'dense' || storedView === 'single') setView(storedView);
    else setView(window.matchMedia(DENSE_DEFAULT_QUERY).matches ? 'dense' : 'single');
    setCols(columnsFor(window.innerWidth));
    if (saved) {
      setAvailability(saved.availability === 'available' ? 'available' : 'all');
      setSort(saved.sort);
      setTypeFilter(urlType !== 'all' ? urlType : saved.type);
      setQ(saved.q);
      if (saved.q) setSearchOpen(true);
      setShown(Math.max(BATCH, saved.shown));
      prevShown.current = Math.max(BATCH, saved.shown);
      pendingScroll.current = saved.scrollY;
    } else {
      setTypeFilter(urlType);
    }
    setReady(true);
  }, [hydrating]);

  // scroll back to where the visitor left, once the restored list is laid out
  useIsoLayoutEffect(() => {
    if (!ready || pendingScroll.current === null) return;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [ready]);

  useEffect(() => {
    const onResize = () => setCols(columnsFor(window.innerWidth));
    window.addEventListener('resize', onResize, { passive: true });
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(preloadViewer); else setTimeout(preloadViewer, 1500);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── derived lists ────────────────────────────────────────────────────
  const randomOrder = useMemo(() => {
    if (seed === null) return items;
    const byId = new Map(items.map(i => [i._id, i]));
    return trashOrder(items.map(i => [i._id, i.sold ? 1 : 0] as [string, number]), seed).map(id => byId.get(id)!);
  }, [items, seed]);

  const sorted = useMemo(() => {
    if (sort === 'artist') return [...items].sort((a, b) => compareNames(a.artist, b.artist));
    if (sort === 'date') return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
    return randomOrder;
  }, [sort, items, randomOrder]);

  const matching = useMemo(() => sorted.filter(w =>
    (availability === 'all' || !w.sold) &&
    (typeFilter === 'all' || w.workType.includes(typeFilter)) &&
    matchesSearch(w, q)
  ), [sorted, availability, typeFilter, q]);

  // Until restored, render what the server did: every work, canonical order
  // (the inline script orders and trims it before paint).
  const visible = !ready ? items : matching.slice(0, shown);

  const typeOptions = useMemo(() => TRASH_WORK_TYPES
    .filter(t => items.some(w => w.workType.includes(t.value)))
    .map(t => ({
      ...t,
      count: items.filter(w =>
        w.workType.includes(t.value) &&
        (availability === 'all' || !w.sold) &&
        matchesSearch(w, q)).length,
    })), [items, availability, q]);

  // ── motion: works glide to their new places ──────────────────────────
  /** Record where the on-screen cards are, just before a change. */
  const captureFlip = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const rects = new Map<string, DOMRect>();
    const vh = window.innerHeight;
    for (const el of Array.from(grid.querySelectorAll<HTMLElement>('[data-id]'))) {
      const r = el.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) rects.set(el.dataset.id!, r);
    }
    flipRects.current = rects;
  }, []);

  useIsoLayoutEffect(() => {
    const before = flipRects.current;
    flipRects.current = null;
    const grid = gridRef.current;
    if (!before || !grid) return;
    const reduced = prefersReducedMotion();
    const vh = window.innerHeight;
    for (const el of Array.from(grid.querySelectorAll<HTMLElement>('[data-id]'))) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const prev = before.get(el.dataset.id!);
      if (prev && !reduced) {
        const dx = prev.left - r.left, dy = prev.top - r.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
        );
      } else if (!prev) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
    }
  }, [visible, view, cols]);

  const change = (fn: () => void) => { captureFlip(); fn(); setShown(BATCH); prevShown.current = BATCH; };

  const setAvailabilityF = (a: Availability) => change(() => setAvailability(a));
  const setSortF = (s: SortOption) => change(() => setSort(s));
  const setQF = (v: string) => change(() => setQ(v));
  const setTypeF = (t: TypeFilter) => change(() => {
    setTypeFilter(t);
    const url = new URL(window.location.href);
    if (t === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', t);
    window.history.replaceState(window.history.state, '', url);
  });
  // "clear filters" (empty state) clears everything; the sheet's "clear"
  // leaves the availability switch alone, since it lives outside the sheet
  const clearAll = () => change(() => {
    setAvailability('all'); setTypeFilter('all'); setQ('');
    const url = new URL(window.location.href);
    url.searchParams.delete('type');
    window.history.replaceState(window.history.state, '', url);
  });
  const toggleView = () => {
    captureFlip();
    const next: View = view === 'single' ? 'dense' : 'single';
    setView(next);
    session.set(VIEW_KEY, next);
  };

  // ── loading: two batches on their own, then a quiet button ───────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || shown >= BATCH * 2 || shown >= matching.length) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        prevShown.current = shown;
        setShown(s => Math.max(s, BATCH * 2));
      }
    }, { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, matching.length]);

  const showMore = () => { prevShown.current = shown; setShown(s => s + BATCH); };

  // ── leaving for a work page: remember where we were ──────────────────
  const rememberReturn = useCallback(() => {
    const s: Saved = { availability, sort, type: typeFilter, q, shown, scrollY: window.scrollY, t: Date.now() };
    session.set(RETURN_KEY, JSON.stringify(s));
  }, [availability, sort, typeFilter, q, shown]);

  const goToWork = (w: Work, img: HTMLImageElement | null) => {
    if (!w.slug) return;
    rememberReturn();
    navigateWithMorph(router.push, `/trash/${w.slug}/`, img);
  };

  const openViewer = (w: Work) => {
    openWorkViewer({
      work: w,
      history: true,
      price: prices[w._id],
      thumbFor: i => (i === 0 ? imgRefs.current.get(w._id) ?? null : null),
      navigate: (href, { replace }) => {
        rememberReturn();
        if (replace) router.replace(href); else router.push(href);
      },
    });
  };

  // ?item=<id> deep links (older shares) open that work's viewer
  useEffect(() => {
    if (!ready) return;
    const id = new URLSearchParams(window.location.search).get('item');
    const w = id ? items.find(i => i._id === id) : undefined;
    if (!w) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('item');
    window.history.replaceState(window.history.state, '', url);
    openViewer(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── price gate ───────────────────────────────────────────────────────
  const onTrashWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unlocked) return;
    const next = clicks + 1;
    if (next >= CLICKS_NEEDED) {
      setClicks(0); setShowModal(true);
      setTimeout(() => pwRef.current?.focus(), 50);
    } else setClicks(next);
  };
  const submitPw = async () => {
    try {
      const res = await fetch('/api/pricelist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error('denied');
      const data = await res.json();
      setPrices(data.prices || {});
      setUnlocked(true);
      setShowModal(false); setPw(''); setPwError(false);
    } catch {
      setPwError(true); setPw('');
      setTimeout(() => pwRef.current?.focus(), 50);
    }
  };

  // ── render ───────────────────────────────────────────────────────────
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (typeFilter !== 'all') {
    chips.push({ key: 't', label: TRASH_WORK_TYPES.find(t => t.value === typeFilter)?.label ?? typeFilter, clear: () => setTypeF('all') });
  }
  if (q.trim()) chips.push({ key: 'q', label: `“${q.trim()}”`, clear: () => setQF('') });
  const activeCount = (typeFilter !== 'all' ? 1 : 0) + (sort !== 'random' ? 1 : 0);
  const clearSheet = () => change(() => {
    setSort('random'); setTypeFilter('all');
    const url = new URL(window.location.href);
    url.searchParams.delete('type');
    window.history.replaceState(window.history.state, '', url);
  });
  const toggleSheet = () => {
    if (sheetOpen) { setSheetOpen(false); return; }
    setSheetMode(window.matchMedia(PANEL_QUERY).matches ? 'panel' : 'sheet');
    setSheetOpen(true);
  };
  const sheet = (mode: 'sheet' | 'panel') => (
    <FilterSheet
      mode={mode}
      open={sheetOpen && sheetMode === mode}
      onClose={() => setSheetOpen(false)}
      anchor={pillRef}
      sort={sort}
      setSort={setSortF}
      typeFilter={typeFilter}
      setType={setTypeF}
      typeOptions={typeOptions}
      resultCount={matching.length}
      onClear={clearSheet}
    />
  );

  const renderCard = (w: Work, i: number, dense: boolean) => {
    const img = w.images[0];
    const timeBased = isTimeBased(w);
    const isNew = ready && i >= prevShown.current && prevShown.current > 0 && i < shown;
    const media = img ? (
      <WorkImg
        img={img}
        widths={dense ? GRID_DENSE_WIDTHS : GRID_SINGLE_WIDTHS}
        sizes={dense ? GRID_DENSE_SIZES : GRID_SINGLE_SIZES}
        defaultWidth={dense ? 400 : 800}
        // The first two cards in this visitor's order are the largest paint.
        // On a fresh load the inline script already preloads them (the
        // server cannot know the order); on a client-side return React does.
        priority={ready && i < 2}
        imgRef={el => { imgRefs.current.set(w._id, el); }}
      />
    ) : <span className="mot-img mot-img-empty" />;

    return (
      <article
        key={w._id}
        data-id={w._id}
        className={`tg-card${isNew ? ' tg-new' : ''}`}
        style={isNew ? ({ '--i': i - prevShown.current } as React.CSSProperties) : undefined}
      >
        {timeBased && w.slug ? (
          <a
            href={`/trash/${w.slug}/`}
            className="tg-media"
            aria-label={`${w.title}, ${w.artist}: open the work page to play`}
            onPointerEnter={() => router.prefetch(`/trash/${w.slug}/`)}
            onClick={e => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              goToWork(w, imgRefs.current.get(w._id) ?? null);
            }}
          >
            {media}
            <span className="tg-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
            </span>
          </a>
        ) : (
          <button
            type="button"
            className="tg-media"
            aria-label={`view ${w.title}, ${w.artist}`}
            onClick={() => openViewer(w)}
          >
            {media}
          </button>
        )}
        <div className="tg-cap">
          {w.slug ? (
            <a
              href={`/trash/${w.slug}/`}
              className="tg-title"
              onPointerEnter={() => router.prefetch(`/trash/${w.slug}/`)}
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                goToWork(w, imgRefs.current.get(w._id) ?? null);
              }}
            >
              {w.title}
            </a>
          ) : <span className="tg-title">{w.title}</span>}
          <p className="mot-mono tg-meta">
            <span>{w.artist}{w.year ? `, ${w.year}` : ''}</span>
            {w.sold && <><span className="mot-dot" aria-hidden="true" /><span className="mot-sr">, sold</span></>}
          </p>
          {prices[w._id] && !w.sold && <p className="mot-mono tg-meta">{prices[w._id]}</p>}
        </div>
      </article>
    );
  };

  const dense = ready && view === 'dense';

  return (
    <>
      <div className="tg-quotes">
        <Quote>
          &ldquo;collecting trash is always an act to make the world a better place — thu gom rác luôn là một hành vi làm đẹp cho đời&rdquo; <span className="tg-quote-by">cam xanh</span>
        </Quote>
        <Quote>
          &ldquo;art is among few virtues of human{' '}
          <span onClick={onTrashWord}>trash</span>
          {' '}— nghệ thuật là một trong số ít rác rưởi có đạo đức của loài người&rdquo; <span className="tg-quote-by">cam xanh</span>
        </Quote>
      </div>

      <div className="tg-controls" role="toolbar" aria-label="browse works">
        <div className="tg-switch" role="radiogroup" aria-label="show">
          {([['available', 'available'], ['all', 'all works']] as [Availability, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={availability === v}
              className="tg-switch-opt mot-mono"
              onClick={() => { if (availability !== v) setAvailabilityF(v); }}
            >
              {label}
            </button>
          ))}
          <span className={`tg-switch-thumb${availability === 'all' ? ' is-right' : ''}`} aria-hidden="true" />
        </div>
        <div className="tg-filter-anchor">
          <button
            ref={pillRef}
            type="button"
            className="mot-pill"
            onClick={toggleSheet}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            data-label="filter and order"
          >
            filter{activeCount > 0 && <span className="mot-pill-n">{activeCount}</span>}
          </button>
          {sheet('panel')}
        </div>
        <span className="mot-mono mot-quiet tg-count" aria-live="polite">
          {ready ? `${matching.length} works` : `${items.length} works`}
        </span>
        <button
          type="button"
          className="mot-icon-btn"
          onClick={toggleView}
          aria-label={view === 'single' ? 'show a dense grid' : 'show one work per row'}
          aria-pressed={view === 'dense'}
          data-label={view === 'single' ? 'grid view' : 'one per row'}
        >
          {view === 'single' ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="4" y="4" width="7" height="9" /><rect x="13" y="4" width="7" height="6" /><rect x="4" y="15" width="7" height="5" /><rect x="13" y="12" width="7" height="8" /></g></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="14" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
          )}
        </button>
        <button
          type="button"
          className="mot-icon-btn"
          onClick={() => {
            const next = !searchOpen;
            setSearchOpen(next);
            if (next) setTimeout(() => searchRef.current?.focus(), 30);
            else if (q) setQF('');
          }}
          aria-label={searchOpen ? 'close search' : 'search works'}
          aria-expanded={searchOpen}
          aria-controls="tg-search"
          data-label={searchOpen ? 'close search' : 'search'}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="5.5" /><path d="M15 15l4.5 4.5" /></g></svg>
        </button>
      </div>
      {unlocked && <p className="mot-mono mot-quiet tg-unlocked">prices visible</p>}

      {searchOpen && (
        <div className="tg-search" id="tg-search">
          <input
            ref={searchRef}
            type="search"
            className="mot-mono"
            value={q}
            onChange={e => setQF(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setQF(''); setSearchOpen(false); } }}
            placeholder="title, artist, medium"
            aria-label="search by title, artist or medium"
            enterKeyHint="search"
            autoComplete="off"
          />
        </div>
      )}

      {chips.length > 0 && (
        <ul className="tg-chips" aria-label="active filters">
          {chips.map(c => (
            <li key={c.key} className="mot-chip">
              <span className="mot-mono">{c.label}</span>
              <button type="button" onClick={c.clear} aria-label={`remove filter ${c.label}`} data-label="remove">
                <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {ready && matching.length === 0 ? (
        <p className="mot-mono tg-empty">
          nothing matches. <button type="button" className="mot-link" onClick={clearAll}>clear filters</button>
        </p>
      ) : dense ? (
        <div ref={gridRef} id={GRID_ID} className="tg-grid tg-dense" style={{ '--cols': cols } as React.CSSProperties}>
          {toColumns(visible, cols).map((col, ci) => (
            <div key={ci} className="tg-col">
              {col.map(w => renderCard(w, visible.indexOf(w), true))}
            </div>
          ))}
        </div>
      ) : (
        <div ref={gridRef} id={GRID_ID} className="tg-grid tg-single">
          {visible.map((w, i) => renderCard(w, i, false))}
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" />
      {ready && shown < matching.length && shown >= BATCH * 2 && (
        <div className="tg-more">
          <button type="button" className="mot-pill" onClick={showMore}>
            show more · {Math.min(shown, matching.length)} of {matching.length}
          </button>
        </div>
      )}

      <p className="tg-general mot-mono">
        <a className="mot-link" href={`mailto:${CONTACTS.sales}?subject=${encodeURIComponent('+1 trash inquiry')}`}>
          general inquiry
        </a>
      </p>

      {sheet('sheet')}

      {showModal && (
        <div className="tg-pw-backdrop" onClick={() => { setShowModal(false); setPw(''); setPwError(false); }}>
          <div className="tg-pw" role="dialog" aria-modal="true" aria-label="enter password" onClick={e => e.stopPropagation()}>
            <label className="mot-mono mot-label" htmlFor="tg-pw-input">enter password</label>
            <input
              id="tg-pw-input"
              ref={pwRef}
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') submitPw();
                if (e.key === 'Escape') { setShowModal(false); setPw(''); }
              }}
              aria-invalid={pwError}
            />
            {pwError && <p className="mot-mono tg-pw-err">incorrect</p>}
          </div>
        </div>
      )}
    </>
  );
}

/** A quote cut to two lines; tap to read it all. */
function Quote({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <p
      className={`tg-quote${open ? ' is-open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen(o => !o)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
    >
      {children}
    </p>
  );
}
