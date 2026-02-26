"use client";

import { useState } from "react";
import Link from "next/link";
import { allEvents, categories, isPast, type Event } from "@/lib/events";

const ALL = "all";

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const filtered =
    activeCategory === ALL
      ? allEvents
      : allEvents.filter(e => e.category === activeCategory);

  const upcoming = filtered.filter(e => !isPast(e));
  const past     = filtered.filter(e => isPast(e));

  // Hero: use the most recent upcoming event thumbnail, or first past event
  const heroEvent = allEvents.find(e => !isPast(e)) || allEvents[0];

  return (
    <>
      {/* hero */}
      <div style={{
        position: "relative",
        width: "100%", height: "55vh", minHeight: "360px",
        overflow: "hidden", backgroundColor: "#111111",
        borderBottom: "1px solid #222222",
      }}>
        {heroEvent?.thumbnail && (
          <img
            src={heroEvent.thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.45 }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}>
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 82px)",
            fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em",
            color: "#ffffff",
          }}>
            news & events
          </h1>
          <p style={{
            fontSize: "12px", color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.08em", marginTop: "18px",
          }}>
            MoT+++ — Ho Chi Minh City
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* category filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "64px" }}>
          {[ALL, ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 18px", fontSize: "11px", letterSpacing: "0.06em",
                border: "1px solid",
                borderColor: activeCategory === cat ? "#111111" : "#dddddd",
                backgroundColor: activeCategory === cat ? "#111111" : "transparent",
                color: activeCategory === cat ? "#ffffff" : "#888888",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
              upcoming
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "48px 32px",
            }}>
              {upcoming.map(e => <EventCard key={e.slug} event={e} />)}
            </div>
          </div>
        )}

        {/* archive */}
        {past.length > 0 && (
          <div style={{
            borderTop: upcoming.length ? "1px solid #e5e5e5" : "none",
            paddingTop: upcoming.length ? "56px" : 0,
          }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
              archive
            </p>
            <div>
              {past.map(e => <PastRow key={e.slug} event={e} />)}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.slug}`} className="evt-card">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div className="evt-card-img" style={{ width: "100%", aspectRatio: "4/3", backgroundColor: "#f0f0f0" }}>
          {event.thumbnail
            ? <img src={event.thumbnail} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "11px", color: "#cccccc" }}>—</span>
              </div>
          }
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {event.category}
          </p>
          <p style={{ fontSize: "16px", fontWeight: 300, color: "#111111", lineHeight: 1.35, marginBottom: "10px" }}>
            {event.title}
          </p>
          <p style={{ fontSize: "12px", color: "#999999" }}>{event.displayDate || event.dateISO}</p>
          {event.location && (
            <p style={{ fontSize: "12px", color: "#cccccc", marginTop: "2px" }}>{event.location}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function PastRow({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.slug}`} className="evt-row" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr auto",
        gap: "0 20px",
        alignItems: "center",
        padding: "16px 8px",
        borderBottom: "1px solid #f2f2f2",
      }}>
        <div style={{ width: "80px", height: "60px", overflow: "hidden", backgroundColor: "#f0f0f0", flexShrink: 0 }}>
          {event.thumbnail && (
            <img src={event.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "#bbbbbb", letterSpacing: "0.06em", marginBottom: "4px" }}>
            {event.category}
          </p>
          <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.35 }}>
            {event.title}
          </p>
        </div>
        <p style={{ fontSize: "12px", color: "#aaaaaa", whiteSpace: "nowrap", flexShrink: 0 }}>
          {event.displayDate || event.dateISO}
        </p>
      </div>
    </Link>
  );
}
