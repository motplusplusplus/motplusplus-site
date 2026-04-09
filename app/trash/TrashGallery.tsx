'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { TrashItem } from '@/lib/demoTrashItems';

function buildFallbackEmail(item: TrashItem) {
  const subject = encodeURIComponent(
    `+1 trash — inquiry: ${item.title} by ${item.artist}`
  );
  const body = encodeURIComponent(
    `Hello,\n\nI am writing to inquire about the following work:\n\n` +
    `Artist: ${item.artist}\n` +
    `Title: ${item.title}\n` +
    `Medium: ${item.medium}\n` +
    `Year: ${item.year}\n` +
    (item.dimensions ? `Dimensions: ${item.dimensions}\n` : '') +
    (item.edition ? `Edition: ${item.edition}\n` : '') +
    `\nI would like to learn more about its availability and price.\n\nThank you.`
  );
  return `mailto:motplusplusplus@gmail.com?subject=${subject}&body=${body}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type SortOption = 'random' | 'date' | 'artist';
type Props = { items: TrashItem[]; unlocked?: boolean };

type InquiryState = 'idle' | 'submitting' | 'success' | 'error';

function InquiryModal({ item, onClose }: { item: TrashItem; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<InquiryState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/submit-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trash',
          name,
          email,
          message,
          artworkTitle: item.title,
          artworkId: item._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        throw new Error(data.error || 'submission failed');
      }
    } catch (err) {
      // fallback to mailto
      window.location.href = buildFallbackEmail(item);
      setStatus('error');
      setErrorMsg('could not submit — opening email client instead');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #cccccc',
    padding: '10px 0',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: 'transparent',
    outline: 'none',
    color: '#111',
    borderRadius: 0,
    boxSizing: 'border-box',
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none', fontSize: '22px',
            cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: '4px',
          }}
        >×</button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '16px', color: '#111', marginBottom: '8px' }}>inquiry sent</p>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
              we'll be in touch about <em>{item.title}</em>.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '24px', fontSize: '13px', color: '#fff',
                backgroundColor: '#111', border: 'none', padding: '10px 28px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >close</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.06em', marginBottom: '4px' }}>
              {item.artist}
            </p>
            <p style={{ fontSize: '16px', color: '#111', marginBottom: '28px', lineHeight: 1.3 }}>
              {item.title}{item.year ? `, ${item.year}` : ''}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', color: '#999', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
                  your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="full name"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', color: '#999', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
                  your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email address"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '11px', color: '#999', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
                  message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="i am writing to inquire about this work…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {errorMsg && (
                <p style={{ fontSize: '12px', color: '#cc4444', marginBottom: '16px' }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  width: '100%', fontSize: '13px', color: '#fff',
                  backgroundColor: status === 'submitting' ? '#888' : '#111',
                  border: 'none', padding: '12px', cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', letterSpacing: '0.03em',
                }}
              >
                {status === 'submitting' ? 'sending…' : 'send inquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrashGallery({ items, unlocked = false }: Props) {
  const [shuffled, setShuffled] = useState<TrashItem[]>([]);
  const [sort, setSort] = useState<SortOption>('random');
  const [openId, setOpenId] = useState<string | null>(null);
  const [inquiryItem, setInquiryItem] = useState<TrashItem | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Shuffle once on mount
  useEffect(() => {
    setShuffled(shuffleArray(items));
  }, [items]);

  // Sorted display list — stable reference for lightbox nav
  const displayItems = useMemo(() => {
    if (sort === 'artist') return [...items].sort((a, b) => a.artist.localeCompare(b.artist));
    if (sort === 'date') return items;
    return shuffled; // random
  }, [sort, shuffled, items]);

  // Auto-open from URL param ?item=
  useEffect(() => {
    if (displayItems.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
    if (itemId && displayItems.some(i => i._id === itemId)) setOpenId(itemId);
  }, [displayItems]);

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

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (inquiryItem) return; // don't navigate lightbox while inquiry modal is open
      if (e.key === 'Escape') setOpenId(null);
      else if (e.key === 'ArrowRight') nav(1);
      else if (e.key === 'ArrowLeft') nav(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nav, inquiryItem]);

  return (
    <>
      {/* sort control */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#cccccc', letterSpacing: '0.06em' }}>sort</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{
              fontSize: '11px', color: '#999999', letterSpacing: '0.06em',
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

      {/* grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '40px 24px',
      }}>
        {displayItems.map((item) => (
          <div key={item._id}>
            {/* image — click to open lightbox */}
            <div
              onClick={() => setOpenId(item._id)}
              style={{ aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#f5f5f5', cursor: 'pointer', marginBottom: '12px' }}
            >
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ) : null}
            </div>

            {/* info */}
            <p style={{ fontSize: '11px', color: '#aaaaaa', letterSpacing: '0.06em', marginBottom: '4px' }}>
              {item.artist}
            </p>
            <button
              onClick={() => setOpenId(item._id)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', display: 'block', width: '100%',
                fontSize: '13px', color: '#333333', lineHeight: 1.4, marginBottom: '4px',
              }}
            >
              {item.title}{item.year ? `, ${item.year}` : ''}
            </button>
            <p style={{ fontSize: '11px', color: '#aaaaaa', lineHeight: 1.5, marginBottom: '12px' }}>
              {[item.medium, item.edition].filter(Boolean).join(' · ')}
            </p>
            {unlocked && item.price && !item.sold && (
              <p style={{ fontSize: '11px', color: '#888888', marginBottom: '10px', letterSpacing: '0.03em' }}>
                {item.price}
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
                <button
                  onClick={() => setInquiryItem(item)}
                  style={{ fontSize: '11px', color: '#fff', backgroundColor: '#111', padding: '5px 12px', border: 'none', cursor: 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit' }}
                >
                  inquire
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* lightbox */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) setOpenId(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          {/* prev / next arrows */}
          {displayItems.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); nav(-1); }}
                style={{
                  position: 'fixed', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: '22px', padding: '12px 14px', zIndex: 1201,
                  borderRadius: '2px', lineHeight: 1,
                }}
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); nav(1); }}
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
            style={{
              backgroundColor: '#fff', maxWidth: '720px', width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* counter + close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 0' }}>
              {displayItems.length > 1 ? (
                <span style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.08em' }}>
                  {openIdx + 1} / {displayItems.length}
                </span>
              ) : <span />}
              <button
                onClick={() => setOpenId(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#aaa', lineHeight: 1, padding: '4px' }}
              >×</button>
            </div>

            {/* image */}
            {open.images && open.images.length > 0 && (
              <div>
                <img
                  src={open.images[0]}
                  alt={open.title}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', backgroundColor: '#f5f5f5', display: 'block' }}
                />
              </div>
            )}

            {/* metadata */}
            <div style={{ padding: '24px 32px 32px' }}>
              <p style={{ fontSize: '11px', color: '#aaaaaa', letterSpacing: '0.07em', marginBottom: '6px', textTransform: 'uppercase' }}>
                {open.artist}
              </p>
              <p style={{ fontSize: '20px', fontWeight: 300, lineHeight: 1.2, marginBottom: '12px', color: '#111' }}>
                {open.title}{open.year ? `, ${open.year}` : ''}
              </p>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '16px' }}>
                {[open.medium, open.dimensions, open.edition].filter(Boolean).join(' · ')}
              </p>
              {open.neighbourhood && (
                <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
                  currently placed — {open.neighbourhood}
                </p>
              )}
              {open.description && (
                <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.8, marginBottom: '28px' }}>
                  {open.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {open.museumLocationId && (
                  <Link
                    href={`/museum?work=${open.museumLocationId}`}
                    onClick={() => setOpenId(null)}
                    style={{ fontSize: '12px', color: '#333', border: '1px solid #ccc', padding: '8px 18px', textDecoration: 'none', letterSpacing: '0.03em' }}
                  >
                    view on museum map
                  </Link>
                )}
                {open.sold ? (
                  <span style={{ fontSize: '14px', color: '#cc2222', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>●</span> sold
                  </span>
                ) : (
                  <button
                    onClick={() => setInquiryItem(open)}
                    style={{ fontSize: '12px', color: '#fff', backgroundColor: '#111', padding: '8px 18px', border: 'none', cursor: 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit' }}
                  >
                    inquire through +1 trash
                  </button>
                )}
                {unlocked && open.price && !open.sold && (
                  <span style={{ fontSize: '12px', color: '#888888', letterSpacing: '0.03em', marginLeft: 'auto' }}>
                    {open.price}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* inquiry modal */}
      {inquiryItem && (
        <InquiryModal item={inquiryItem} onClose={() => setInquiryItem(null)} />
      )}
    </>
  );
}
