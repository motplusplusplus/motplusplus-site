"use client";

import { useState } from "react";
import Link from "next/link";
import { allArtists, type Artist } from "@/lib/artists";

const FILTERS = ["all", "collective", "residents", "other"] as const;
type Filter = typeof FILTERS[number];

function applyFilter(artists: Artist[], filter: Filter): Artist[] {
  if (filter === "collective") return artists.filter(a => a.collective);
  if (filter === "residents")  return artists.filter(a => a.resident);
  if (filter === "other")      return artists.filter(a => !a.collective && !a.resident);
  return artists;
}

export default function ArtistsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = applyFilter(allArtists, filter);

  // Group alphabetically
  const groups: Record<string, Artist[]> = {};
  for (const a of visible) {
    const letter = a.name[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(a);
  }
  const letters = Object.keys(groups).sort();

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* header */}
      <div style={{ maxWidth: "720px", marginBottom: "64px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          artists
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8, marginBottom: "12px" }}>
          everyone MoT+++ has worked with — residents, collective members, exhibition artists, performers, collaborators.
        </p>
        <p style={{ fontSize: "12px", color: "#aaaaaa" }}>
          {allArtists.length} artists
        </p>
      </div>

      {/* filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "56px" }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px", fontSize: "11px", letterSpacing: "0.06em",
              border: "1px solid",
              borderColor: filter === f ? "#111111" : "#dddddd",
              backgroundColor: filter === f ? "#111111" : "transparent",
              color: filter === f ? "#ffffff" : "#888888",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* A–Z listing */}
      <div style={{ borderTop: "1px solid #e5e5e5" }}>
        {letters.map(letter => (
          <div key={letter} style={{
            borderBottom: "1px solid #f0f0f0", padding: "32px 0",
            display: "grid", gridTemplateColumns: "40px 1fr", gap: "0 32px", alignItems: "start",
          }}>
            <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.08em", paddingTop: "2px" }}>
              {letter}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "10px 32px",
            }}>
              {groups[letter].map(a => (
                <Link
                  key={a.slug}
                  href={`/artists/${a.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <p style={{
                    fontSize: "14px", fontWeight: 300, color: "#111111",
                    lineHeight: 1.4,
                    fontStyle: a.slug === "lan-anh-le" ? "italic" : "normal",
                  }}>
                    {a.name}
                    {a.slug === "lan-anh-le" && (
                      <span style={{ fontSize: "11px", color: "#aaaaaa", marginLeft: "6px" }}>1993–2020</span>
                    )}
                  </p>
                  {(a.collective || a.studioHost) && (
                    <p style={{ fontSize: "10px", color: "#cccccc", letterSpacing: "0.04em", marginTop: "2px" }}>
                      {[a.collective && "collective", a.studioHost && "hosting artist"].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
