"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type CarouselItem = {
  slug: string;
  name: string;
  tagline: string;
  neighborhood: string;
  href: string;
  pinned?: boolean; // pinned items stay at bottom of stack
};

function shuffleUnpinned(items: CarouselItem[]): CarouselItem[] {
  const free = items.filter((i) => !i.pinned);
  const pinned = items.filter((i) => i.pinned);
  // Fisher-Yates on free items
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

  const total = ordered.length;
  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  // indices of the 3 visible layers: front, mid, back
  const i0 = index;
  const i1 = (index + 1) % total;
  const i2 = (index + 2) % total;

  const front = ordered[i0];
  const mid = ordered[i1];
  const back = ordered[i2];

  return (
    <div>
      {/* stack */}
      <div
        style={{
          position: "relative",
          // extra padding so peeking cards aren't clipped
          paddingBottom: "36px",
          paddingRight: "36px",
          marginBottom: "24px",
        }}
      >
        {/* back card — furthest behind */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "28px",
            right: "-28px",
            aspectRatio: "3/2",
            backgroundColor: "#e2e2e2",
            border: "1px solid #d8d8d8",
          }}
        />

        {/* mid card */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            right: "-14px",
            aspectRatio: "3/2",
            backgroundColor: "#ebebeb",
            border: "1px solid #e0e0e0",
          }}
        />

        {/* front card — clickable */}
        <Link href={front.href} style={{ display: "block", textDecoration: "none", position: "relative" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "3/2",
              backgroundColor: "#f0f0f0",
              border: "1px solid #e5e5e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
            }}
          >
            <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
              {front.name} — studio photo
            </p>
          </div>
        </Link>

        {/* peek labels on back cards */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "-24px",
            fontSize: "10px",
            color: "#bbbbbb",
            letterSpacing: "0.05em",
            zIndex: 1,
            textAlign: "right",
            lineHeight: 1.6,
          }}
        >
          <div>{back.name}</div>
          <div style={{ color: "#cccccc" }}>{mid.name}</div>
        </div>
      </div>

      {/* front card meta */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "8px" }}>
          {front.neighborhood}
        </p>
        <Link href={front.href}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 300,
              marginBottom: "6px",
              lineHeight: 1.2,
              color: "#111111",
            }}
          >
            {front.name}
          </h3>
        </Link>
        <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.5 }}>
          {front.tagline}
        </p>
      </div>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button
          onClick={prev}
          aria-label="previous studio"
          style={{
            background: "none",
            border: "1px solid #cccccc",
            cursor: "pointer",
            width: "36px",
            height: "36px",
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

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {ordered.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`go to studio ${i + 1}`}
              style={{
                width: i === index ? "20px" : "6px",
                height: "6px",
                backgroundColor: i === index ? "#111111" : "#cccccc",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s, background-color 0.2s",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="next studio"
          style={{
            background: "none",
            border: "1px solid #cccccc",
            cursor: "pointer",
            width: "36px",
            height: "36px",
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

        <span style={{ fontSize: "12px", color: "#aaaaaa", marginLeft: "4px" }}>
          {index + 1} / {total}
        </span>
      </div>
    </div>
  );
}
