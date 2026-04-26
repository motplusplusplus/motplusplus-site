"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";

type CarouselItem = {
  slug: string;
  name: string;
  artistName?: string;
  tagline?: string;
  neighborhood: string;
  href: string;
  image?: string;
  pinned?: boolean;
};

function shuffleUnpinned(items: CarouselItem[]): CarouselItem[] {
  const free = items.filter((i) => !i.pinned);
  const pinned = items.filter((i) => i.pinned);
  const arr = [...free];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return [...arr, ...pinned];
}

export default function StudioCarousel({ items }: { items: CarouselItem[] }) {
  const ordered = useMemo(() => shuffleUnpinned(items), [items]);
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Responsive spread - tighter on mobile to prevent horizontal overflow
  const SPREAD_X = isMobile ? 20 : 48;
  const SPREAD_Y = isMobile ? 10 : 14;

  const total = ordered.length;

  const goTo = (newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const next = () => goTo((index + 1) % total);
  const prev = () => goTo((index - 1 + total) % total);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum swipe distance
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        next(); // swipe left = next
      } else {
        prev(); // swipe right = prev
      }
    }
  };

  const i0 = index;
  const i1 = (index + 1) % total;
  const i2 = (index + 2) % total;
  const i3 = (index + 3) % total;

  const front = ordered[i0];
  const mid1  = ordered[i1];
  const mid2  = ordered[i2];
  const back  = ordered[i3];

  const cardTransition = "transform 0.3s ease, opacity 0.3s ease";

  return (
    <div>
      {/* hidden preload — triggers browser fetch for all images immediately */}
      <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        {ordered.map((item) =>
          item.image ? <img key={item.slug} src={item.image} alt="" /> : null
        )}
      </div>

      {/* stack with touch support */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: "relative",
          paddingBottom: `${SPREAD_Y * 3 + 8}px`,
          marginBottom: "0",
          overflow: "visible",
          touchAction: "pan-y pinch-zoom",
        }}
      >
        {/* back card — furthest behind, smallest */}
        <div
          style={{
            position: "absolute",
            top: `${SPREAD_Y * 3}px`,
            left: `${SPREAD_X * 3}px`,
            width: "88%",
            aspectRatio: "3/2",
            backgroundColor: "#c8c8c8",
            border: "1px solid #c0c0c0",
            overflow: "hidden",
            transition: cardTransition,
          }}
        >
          {back.image && (
            <img
              src={back.image}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.25 }}
            />
          )}
        </div>

        {/* mid2 card */}
        <div
          style={{
            position: "absolute",
            top: `${SPREAD_Y * 2}px`,
            left: `${SPREAD_X * 2}px`,
            width: "92%",
            aspectRatio: "3/2",
            backgroundColor: "#d8d8d8",
            border: "1px solid #d0d0d0",
            overflow: "hidden",
            transition: cardTransition,
          }}
        >
          {mid2.image && (
            <img
              src={mid2.image}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.38 }}
            />
          )}
        </div>

        {/* mid1 card */}
        <div
          style={{
            position: "absolute",
            top: `${SPREAD_Y}px`,
            left: `${SPREAD_X}px`,
            width: "96%",
            aspectRatio: "3/2",
            backgroundColor: "#e8e8e8",
            border: "1px solid #e0e0e0",
            overflow: "hidden",
            transition: cardTransition,
          }}
        >
          {mid1.image && (
            <img
              src={mid1.image}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.58 }}
            />
          )}
        </div>

        {/* front card — clickable */}
        <Link href={front.href} style={{ display: "block", textDecoration: "none", position: "relative" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "3/2",
              backgroundColor: "#f0f0f0",
              border: "1px solid #e5e5e5",
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
              transition: cardTransition,
            }}
          >
            {front.image ? (
              <img
                src={front.image}
                alt={front.name}
                loading="eager"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                  {front.name}
                </p>
              </div>
            )}
          </div>
        </Link>

        {/* hover arrows - desktop only */}
        {!isMobile && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev(); }}
              aria-label="previous studio"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                opacity: isHovering ? 1 : 0,
                transition: "opacity 0.2s ease",
                pointerEvents: isHovering ? "auto" : "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#111111" strokeWidth="2">
                <polyline points="9,2 4,7 9,12" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next(); }}
              aria-label="next studio"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                opacity: isHovering ? 1 : 0,
                transition: "opacity 0.2s ease",
                pointerEvents: isHovering ? "auto" : "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#111111" strokeWidth="2">
                <polyline points="5,2 10,7 5,12" />
              </svg>
            </button>
          </>
        )}

      </div>

      {/* front card meta */}
      <div style={{ marginBottom: "28px", transition: "opacity 0.2s ease" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "8px" }}>
          {front.neighborhood}
        </p>
        <Link href={front.href}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 300,
              marginBottom: front.artistName && front.artistName !== front.name ? "4px" : "6px",
              lineHeight: 1.2,
              color: "#111111",
            }}
          >
            {front.name}
          </h3>
        </Link>
        {front.artistName && front.artistName !== front.name && (
          <p style={{ fontSize: "14px", color: "#888888", fontWeight: 300, marginBottom: "6px" }}>
            {front.artistName}
          </p>
        )}
        {front.tagline && (
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.5 }}>
            {front.tagline}
          </p>
        )}
      </div>

      {/* controls - compact on mobile */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? "12px" : "20px",
        flexWrap: "wrap",
      }}>
        <button
          onClick={prev}
          aria-label="previous studio"
          style={{
            background: "none",
            border: "1px solid #cccccc",
            cursor: "pointer",
            width: isMobile ? "40px" : "44px",
            height: isMobile ? "40px" : "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#111111" strokeWidth="1.5">
            <polyline points="9,2 4,7 9,12" />
          </svg>
        </button>

        {/* dots - smaller touch targets on mobile, scrollable if many */}
        <div style={{
          display: "flex",
          gap: isMobile ? "2px" : "4px",
          alignItems: "center",
          overflow: "hidden",
          maxWidth: isMobile ? "180px" : "none",
        }}>
          {ordered.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`go to studio ${i + 1}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: isMobile ? "24px" : "44px",
                minHeight: isMobile ? "24px" : "44px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
              }}
            >
              <span style={{
                width: i === index ? (isMobile ? "14px" : "20px") : "6px",
                height: "6px",
                backgroundColor: i === index ? "#111111" : "#cccccc",
                display: "block",
                transition: "width 0.2s, background-color 0.2s",
                borderRadius: "3px",
              }} />
            </button>
          ))}
        </div>

        <button
          onClick={next}
          aria-label="next studio"
          style={{
            background: "none",
            border: "1px solid #cccccc",
            cursor: "pointer",
            width: isMobile ? "40px" : "44px",
            height: isMobile ? "40px" : "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#111111" strokeWidth="1.5">
            <polyline points="5,2 10,7 5,12" />
          </svg>
        </button>

        <span style={{ fontSize: "12px", color: "#aaaaaa", marginLeft: isMobile ? "0" : "4px" }}>
          {index + 1} / {total}
        </span>
      </div>
    </div>
  );
}
