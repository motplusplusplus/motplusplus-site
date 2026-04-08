'use client';

import { useState, useEffect, useCallback } from 'react';

type Props = {
  images: string[];
  studioName: string;
};

export default function StudioGallery({ images, studioName }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(() => setOpen(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const next = useCallback(() => setOpen(i => i !== null ? (i + 1) % images.length : null), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, close, prev, next]);

  return (
    <>
      {/* grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '4px',
        }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '3/2',
              overflow: 'hidden',
              backgroundColor: '#111',
              border: 'none',
              padding: 0,
              cursor: 'zoom-in',
              position: 'relative',
            }}
            aria-label={`${studioName} — image ${i + 1}`}
          >
            <img
              src={img}
              alt={`${studioName} — ${i + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.3s ease, opacity 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLImageElement).style.opacity = '0.88'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
            />
          </button>
        ))}
      </div>

      {/* lightbox */}
      {open !== null && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* close */}
          <button
            onClick={close}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '28px',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 1001,
            }}
            aria-label="close"
          >
            ×
          </button>

          {/* counter */}
          <div style={{
            position: 'absolute',
            top: '22px',
            left: '24px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.08em',
          }}>
            {open + 1} / {images.length}
          </div>

          {/* prev */}
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{
              position: 'absolute',
              left: '16px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '16px',
              zIndex: 1001,
              lineHeight: 1,
            }}
            aria-label="previous"
          >
            ‹
          </button>

          {/* image */}
          <img
            src={images[open]}
            alt={`${studioName} — ${open + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 'calc(100vw - 120px)',
              maxHeight: 'calc(100vh - 80px)',
              objectFit: 'contain',
              display: 'block',
              boxShadow: '0 4px 40px rgba(0,0,0,0.6)',
            }}
          />

          {/* next */}
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '16px',
              zIndex: 1001,
              lineHeight: 1,
            }}
            aria-label="next"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
