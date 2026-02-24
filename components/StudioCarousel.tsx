"use client";

import { useState } from "react";
import Link from "next/link";

type CarouselItem = {
  slug: string;
  name: string;
  tagline: string;
  neighborhood: string;
  href: string;
};

export default function StudioCarousel({ items }: { items: CarouselItem[] }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  const item = items[index];

  return (
    <div style={{ position: "relative" }}>
      {/* card */}
      <Link href={item.href} style={{ display: "block", textDecoration: "none" }}>
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
            marginBottom: "20px",
            position: "relative",
          }}
        >
          <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
            {item.name} — studio photo
          </p>
        </div>
      </Link>

      {/* meta */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "8px" }}>
          {item.neighborhood}
        </p>
        <Link href={item.href}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 300,
              marginBottom: "6px",
              lineHeight: 1.2,
              color: "#111111",
            }}
          >
            {item.name}
          </h3>
        </Link>
        <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.5 }}>
          {item.tagline}
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

        {/* dots */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {items.map((_, i) => (
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
          {index + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}
