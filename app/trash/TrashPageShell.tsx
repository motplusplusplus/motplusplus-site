'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { buildTrashInquiryEmail, type TrashItem } from '@/lib/demoTrashItems';
import ArtistCreditLinks from '@/components/ArtistCreditLinks';
import InquiryForm from '@/components/InquiryForm';
import { CONTACTS } from '@/lib/contacts';
import { compareNames } from '@/lib/sortName';
import { shuffleArray } from '@/lib/shuffle';

const CLICKS_NEEDED = 7;

type SortOption = 'random' | 'date' | 'artist';
type Props = { items: TrashItem[] };

const AVAILABILITY_FILTERS = ['all', 'available', 'sold'] as const;
type AvailabilityFilter = typeof AVAILABILITY_FILTERS[number];

function matchesAvailability(item: TrashItem, filter: AvailabilityFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'sold' ? !!item.sold : !item.sold;
}

/** CSS-ident-safe view-transition-name for a Sanity _id. */
function vtName(id: string): string {
  return `trash-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** Runs a state update inside a view transition when the browser supports it and
 *  the user hasn't asked for reduced motion; otherwise applies it instantly. The
 *  grid cells carry per-item view-transition-names, so filter/sort changes animate
 *  items to their new positions instead of snapping the whole grid. */
function withGridTransition(update: () => void) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  if (!reduced && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(update);
  } else {
    update();
  }
}

export default function TrashPageShell({ items }: Props) {
  // unlock state
  const [clicks, setClicks] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  // Prices are NOT in the static export (see page.tsx). They are fetched from the
  // worker only after the password is verified server-side, then held here keyed
  // by document _id. Kept separate from `items` so unlocking does not re-shuffle
  // or re-sort the gallery.
  const [prices, setPrices] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // gallery state — `randomOrder` starts as the build-time shuffle baked into the
  // static HTML (page.tsx), so the first paint already shows the full grid.
  // Tapping "random" again reshuffles client-side.
  const [randomOrder, setRandomOrder] = useState<TrashItem[]>(items);
  const [sort, setSort] = useState<SortOption>('random');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  // unlock handlers
  const handleTrashClick = () => {
    if (unlocked) return;
    const next = clicks + 1;
    if (next >= CLICKS_NEEDED) {
      setClicks(0);
      setShowModal(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setClicks(next);
    }
  };

  // Real gate: POST the password to the worker, which checks it against the
  // PRICELIST_PASSWORD secret and returns prices only on success. A wrong or
  // absent password gets a 401 and no price data ever reaches the browser.
  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/pricelist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: input}),
      });
      if (!res.ok) {
        setError(true);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      const data = await res.json();
      setPrices(data.prices || {});
      setUnlocked(true);
      setShowModal(false);
      setInput('');
      setError(false);
    } catch {
      setError(true);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setInput('');
    setError(false);
  };

  // sorted, then availability-filtered display list
  const sortedItems = useMemo(() => {
    if (sort === 'artist') return [...items].sort((a, b) => compareNames(a.artist, b.artist));
    if (sort === 'date') return [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return randomOrder;
  }, [sort, randomOrder, items]);

  const displayItems = useMemo(
    () => sortedItems.filter(i => matchesAvailability(i, availability)),
    [sortedItems, availability]
  );

  const counts = useMemo(() => ({
    all: items.length,
    available: items.filter(i => !i.sold).length,
    sold: items.filter(i => !!i.sold).length,
  }), [items]);

  const setAvailabilityAnimated = (f: AvailabilityFilter) => {
    if (f === availability) return;
    withGridTransition(() => setAvailability(f));
  };

  const setSortAnimated = (s: SortOption) => {
    if (s === sort) {
      // tapping "random" again reshuffles in place
      if (s === 'random') withGridTransition(() => setRandomOrder(shuffleArray(items)));
      return;
    }
    withGridTransition(() => setSort(s));
  };

  // scroll-triggered reveal for below-the-fold cards. Above-the-fold cards are
  // never hidden (no flash, no CLS); with reduced motion or no IO support the
  // grid simply stays fully visible.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let first = true;
    const observer = new IntersectionObserver((entries) => {
      if (first) {
        // initial callback covers every observed card: hide only the offscreen ones
        for (const e of entries) {
          if (!e.isIntersecting) e.target.classList.add('trash-card-pending');
        }
        first = false;
        // reveal anything already visible stays untouched
        return;
      }
      let i = 0;
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(i * 45, 180)}ms`;
          el.classList.add('trash-card-in');
          observer.unobserve(el);
          i++;
        }
      }
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    for (const child of Array.from(grid.children)) observer.observe(child);
    return () => observer.disconnect();
    // re-run when the rendered set changes so new cards get observed
  }, [displayItems]);

  // auto-open from URL param ?item=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
    if (itemId && items.some(i => i._id === itemId)) setOpenId(itemId);
  }, [items]);

  const open = openId ? displayItems.find(i => i._id === openId) ?? null : null;
  const openIdx = openId ? displayItems.findIndex(i => i._id === openId) : -1;

  const nav = useCallback((dir: 1 | -1) => {
    setOpenId(prev => {
      if (!prev) return null;
      const idx = displayItems.findIndex(i => i._id === prev);
      const next = (idx + dir + displayItems.length) % displayItems.length;
      return displayItems[next]._id;
    });
  }, [displayItems]);

  // keyboard nav (only while the lightbox is open)
  useEffect(() => {
    if (!openId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
      else if (e.key === 'ArrowRight') nav(1);
      else if (e.key === 'ArrowLeft') nav(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openId, nav]);

  // lightbox: lock background scroll, move focus in, restore focus on close
  const lightboxOpen = !!openId;
  useEffect(() => {
    if (!lightboxOpen) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => closeBtnRef.current?.focus(), 30);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      lastFocusRef.current?.focus?.();
    };
    // depend on open/closed only — navigating between works keeps focus state
  }, [lightboxOpen]);

  return (
    <>
      {/* quotes */}
      <p style={{ fontSize: '13px', color: '#767676', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '10px' }}>
        &ldquo;collecting trash is always an act to make the world a better place &nbsp;—&nbsp; thu gom rác luôn là một hành vi làm đẹp cho đời&rdquo;
        <br /><span style={{ fontSize: '11px', fontStyle: 'normal', color: '#767676' }}>— Cam Xanh</span>
      </p>
      <p style={{ fontSize: '13px', color: '#767676', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '0' }}>
        &ldquo;art is among few virtues of human{' '}
        <span onClick={handleTrashClick} style={{ cursor: 'default' }}>trash</span>
        {' '}&nbsp;—&nbsp; nghệ thuật là một trong số ít rác rưởi có đạo đức của loài người&rdquo;
        <br /><span style={{ fontSize: '11px', fontStyle: 'normal', color: '#767676' }}>— Cam Xanh</span>
      </p>

      {/* password modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#fff', padding: '32px 36px', width: '100%', maxWidth: '300px' }}
          >
            <p style={{ fontSize: '10px', color: '#767676', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              enter password
            </p>
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') closeModal();
              }}
              style={{
                width: '100%', border: 'none',
                borderBottom: `1px solid ${error ? '#cc2222' : '#dddddd'}`,
                fontSize: '14px', padding: '4px 0', outline: 'none',
                boxSizing: 'border-box', background: 'none',
                transition: 'border-color 0.15s',
              }}
            />
            {error && (
              <p style={{ fontSize: '10px', color: '#cc2222', marginTop: '10px', letterSpacing: '0.06em' }}>
                incorrect
              </p>
            )}
          </div>
        </div>
      )}

      {/* gallery */}
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '40px', marginTop: '32px' }}>

        {/* availability filter + sort control */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AVAILABILITY_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setAvailabilityAnimated(f)}
                aria-pressed={availability === f}
                className="trash-filter-btn"
                style={{
                  padding: '10px 18px', fontSize: '11px', letterSpacing: '0.06em',
                  border: '1px solid',
                  borderColor: availability === f ? '#111111' : '#dddddd',
                  backgroundColor: availability === f ? '#111111' : 'transparent',
                  color: availability === f ? '#ffffff' : '#767676',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {f}
                <span style={{
                  marginLeft: '7px', fontSize: '10px',
                  color: availability === f ? 'rgba(255,255,255,0.55)' : '#bbbbbb',
                }}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {unlocked && (
              <span style={{ fontSize: '11px', color: '#767676', fontWeight: 300, letterSpacing: '0.06em' }}>
                prices visible
              </span>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#767676', letterSpacing: '0.06em' }}>sort</span>
              <select
                value={sort}
                onChange={e => setSortAnimated(e.target.value as SortOption)}
                style={{
                  fontSize: '11px', color: '#767676', letterSpacing: '0.06em',
                  background: 'none', border: 'none', borderBottom: '1px solid #e8e8e8',
                  padding: '3px 0', cursor: 'pointer', outline: 'none',
                  appearance: 'none', WebkitAppearance: 'none',
                  paddingRight: '14px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\' viewBox=\'0 0 8 5\'%3E%3Cpath d=\'M0 0l4 5 4-5z\' fill=\'%23cccccc\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0 center',
                }}
              >
                <option value="random">random</option>
                <option value="date">date added</option>
                <option value="artist">artist</option>
              </select>
            </label>
          </div>
        </div>

        {/* grid */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '40px 24px',
          }}
        >
          {displayItems.map((item) => (
            <div
              key={item._id}
              className="trash-card"
              style={{ viewTransitionName: vtName(item._id) } as React.CSSProperties}
            >
              <button
                onClick={() => setOpenId(item._id)}
                aria-label={`view ${item.title || 'untitled'} by ${item.artist}`}
                className="trash-card-imgbtn"
                style={{
                  display: 'block', width: '100%', padding: 0, border: 'none',
                  aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#f5f5f5',
                  cursor: 'pointer', marginBottom: '12px',
                }}
              >
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[item.cardImageIndex ?? 0]}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      width: '100%', height: '100%',
                      // items with a multi-image set (e.g. wide/landscape dataset stills)
                      // show the full frame instead of cropping a random crop of it
                      objectFit: item.images.length > 1 ? 'contain' : 'cover',
                      display: 'block',
                    }}
                  />
                ) : null}
              </button>

              <p style={{ fontSize: '11px', color: '#767676', letterSpacing: '0.06em', marginBottom: '4px' }}>
                <ArtistCreditLinks artists={item.artists} artistSlug={item.artistSlug} fallback={item.artist} />
              </p>
              <button
                onClick={() => setOpenId(item._id)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  textAlign: 'left', display: 'block', width: '100%',
                  fontSize: '13px', color: '#333333', lineHeight: 1.4, marginBottom: '4px',
                  fontFamily: 'inherit',
                }}
              >
                {item.title}{item.year ? `, ${item.year}` : ''}
              </button>
              <p style={{ fontSize: '11px', color: '#767676', lineHeight: 1.5, marginBottom: '12px' }}>
                {[item.medium, item.edition].filter(Boolean).join(' · ')}
              </p>
              {unlocked && prices[item._id] && !item.sold && (
                <p style={{ fontSize: '11px', color: '#767676', marginBottom: '10px', letterSpacing: '0.03em' }}>
                  {prices[item._id]}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {item.museumLocationId && (
                  <Link
                    href={`/museum?work=${item.museumLocationId}`}
                    style={{ fontSize: '11px', color: '#666', border: '1px solid #ddd', padding: '5px 12px', textDecoration: 'none', letterSpacing: '0.03em' }}
                  >
                    +1 museum by any other name
                  </Link>
                )}
                {item.sold ? (
                  <span style={{ fontSize: '13px', color: '#cc2222', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>●</span> sold
                  </span>
                ) : (
                  <InquiryForm
                    type="trash"
                    recipient={CONTACTS.sales}
                    mailtoHref={buildTrashInquiryEmail(item)}
                    artworkTitle={item.title}
                    artworkId={item._id}
                    buttonLabel="inquire"
                    buttonStyle={{ fontSize: '11px', color: '#fff', backgroundColor: '#111', padding: '5px 12px', letterSpacing: '0.03em' }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '40px', marginTop: '48px' }}>
          <a
            href={`mailto:${CONTACTS.sales}?subject=+1%20trash%20%E2%99%BB%20inquiry`}
            style={{ display: 'inline-block', fontSize: '13px', color: '#ffffff', backgroundColor: '#111111', padding: '12px 28px', textDecoration: 'none' }}
          >
            general inquiry
          </a>
        </div>
      </div>

      {/* lightbox */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) setOpenId(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`${open.title || 'untitled'} by ${open.artist}`}
          className="trash-lightbox-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          {displayItems.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); nav(-1); }}
                aria-label="previous work"
                style={{
                  position: 'fixed', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: '22px', padding: '12px 14px', zIndex: 1201,
                  borderRadius: '2px', lineHeight: 1,
                }}
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); nav(1); }}
                aria-label="next work"
                style={{
                  position: 'fixed', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: '22px', padding: '12px 14px', zIndex: 1201,
                  borderRadius: '2px', lineHeight: 1,
                }}
              >›</button>
            </>
          )}

          <div
            onClick={e => e.stopPropagation()}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
            className="trash-lightbox-panel"
            style={{
              backgroundColor: '#fff', maxWidth: '720px', width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 0' }}>
              {displayItems.length > 1 ? (
                <span style={{ fontSize: '10px', color: '#767676', letterSpacing: '0.08em' }}>
                  {openIdx + 1} / {displayItems.length}
                </span>
              ) : <span />}
              <button
                ref={closeBtnRef}
                onClick={() => setOpenId(null)}
                aria-label="close"
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#767676', lineHeight: 1, padding: '4px 10px' }}
              >×</button>
            </div>

            {open.images && open.images.length > 0 && (
              <div>
                <img
                  src={open.images[open.cardImageIndex ?? 0]}
                  alt={open.title}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', backgroundColor: '#f5f5f5', display: 'block' }}
                />
              </div>
            )}

            <div style={{ padding: '24px 32px 32px' }}>
              <p style={{ fontSize: '11px', color: '#767676', letterSpacing: '0.07em', marginBottom: '6px', textTransform: 'uppercase' }}>
                <ArtistCreditLinks artists={open.artists} artistSlug={open.artistSlug} fallback={open.artist} />
              </p>
              <p style={{ fontSize: '20px', fontWeight: 300, lineHeight: 1.2, marginBottom: '12px', color: '#111' }}>
                {open.title}{open.year ? `, ${open.year}` : ''}
              </p>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '16px' }}>
                {[open.medium, open.dimensions, open.edition].filter(Boolean).join(' · ')}
              </p>
              {open.neighbourhood && (
                <p style={{ fontSize: '12px', color: '#767676', marginBottom: '16px' }}>
                  currently placed — {open.neighbourhood}
                </p>
              )}
              {open.description && (
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.8, marginBottom: '28px' }}>
                  {open.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {open.slug && (
                  <Link
                    href={`/trash/${open.slug}`}
                    style={{ fontSize: '12px', color: '#333', border: '1px solid #ccc', padding: '8px 18px', textDecoration: 'none', letterSpacing: '0.03em' }}
                  >
                    more information/share →
                  </Link>
                )}
                {open.museumLocationId && (
                  <Link
                    href={`/museum?work=${open.museumLocationId}`}
                    onClick={() => setOpenId(null)}
                    style={{ fontSize: '12px', color: '#333', border: '1px solid #ccc', padding: '8px 18px', textDecoration: 'none', letterSpacing: '0.03em' }}
                  >
                    +1 museum by any other name
                  </Link>
                )}
                {open.sold ? (
                  <span style={{ fontSize: '14px', color: '#cc2222', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>●</span> sold
                  </span>
                ) : (
                  <InquiryForm
                    type="trash"
                    recipient={CONTACTS.sales}
                    mailtoHref={buildTrashInquiryEmail(open)}
                    artworkTitle={open.title}
                    artworkId={open._id}
                    buttonLabel="inquire through +1 trash"
                    buttonStyle={{ fontSize: '12px', color: '#fff', backgroundColor: '#111', padding: '8px 18px', letterSpacing: '0.03em' }}
                  />
                )}
                {unlocked && prices[open._id] && !open.sold && (
                  <span style={{ fontSize: '12px', color: '#767676', letterSpacing: '0.03em', marginLeft: 'auto' }}>
                    {prices[open._id]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
