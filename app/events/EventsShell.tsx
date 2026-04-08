"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories, isPast, type Event } from "@/lib/events";

const ALL = "all";

export function EventsShell({ events }: { events: Event[] }) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const router = useRouter();

  const filtered =
    activeCategory === ALL
      ? events
      : events.filter(e => e.category === activeCategory);

  const upcoming = filtered.filter(e => !isPast(e));
  const past     = filtered.filter(e => isPast(e));
  const heroEvent = events.find(e => !isPast(e)) || events[0];

  const goRandom = useCallback(() => {
    if (!past.length && !upcoming.length) return;
    const pool = [...upcoming, ...past];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/events/${pick.slug}`);
  }, [past, upcoming, router]);

  // Group past events by year
  const pastByYear: Record<string, Event[]> = {};
  for (const e of past) {
    const year = e.sortDate ? e.sortDate.slice(0, 4) : "unknown";
    if (!pastByYear[year]) pastByYear[year] = [];
    pastByYear[year].push(e);
  }
  const years = Object.keys(pastByYear).sort((a, b) => b.localeCompare(a));

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

        {/* category filters + random button */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "64px", alignItems: "center" }}>
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
          <button
            onClick={goRandom}
            style={{
              marginLeft: "auto",
              padding: "8px 18px", fontSize: "11px", letterSpacing: "0.06em",
              border: "1px solid #dddddd",
              backgroundColor: "transparent",
              color: "#888888",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            random event
          </button>
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

        {/* archive — grouped by year with collapsible rows */}
        {years.length > 0 && (
          <div style={{
            borderTop: upcoming.length ? "1px solid #e5e5e5" : "none",
            paddingTop: upcoming.length ? "56px" : 0,
          }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
              archive
            </p>
            {years.map(year => (
              <YearGroup key={year} year={year} events={pastByYear[year]} />
            ))}
          </div>
        )}

      </div>
    </>
  );
}

function YearGroup({ year, events }: { year: string; events: Event[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderTop: "1px solid #e5e5e5" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", background: "none", border: "none",
          cursor: "pointer", padding: "14px 8px", textAlign: "left",
        }}
      >
        <span style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.1em", fontFamily: "inherit" }}>
          {year}
        </span>
        <span style={{
          fontSize: "11px", color: "#cccccc", fontFamily: "inherit",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.18s",
          display: "inline-block",
        }}>
          ↓
        </span>
        <span style={{ fontSize: "10px", color: "#cccccc", fontFamily: "inherit" }}>
          {events.length}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: "8px" }}>
          {events.map(e => <PastRow key={e.slug} event={e} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.slug}`} className="evt-card">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div className="evt-card-img" style={{ width: "100%", aspectRatio: "4/3", backgroundColor: "#f0f0f0" }}>
          {event.thumbnail
            ? <img src={event.thumbnail} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111111" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>MoT+++</span>
              </div>
          }
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {event.category}
          </p>
          <p style={{ fontSize: "16px", fontWeight: 300, color: "#111111", lineHeight: 1.35, marginBottom: event.vnTitle ? "4px" : "10px" }}>
            {event.title}
          </p>
          {event.vnTitle && (
            <p style={{ fontSize: "12px", color: "#bbbbbb", marginBottom: "10px" }}>{event.vnTitle}</p>
          )}
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
      <div className="evt-past-inner" style={{ padding: "16px 8px", borderBottom: "1px solid #f2f2f2" }}>
        <div style={{ width: "80px", height: "60px", overflow: "hidden", backgroundColor: "#111111", flexShrink: 0 }}>
          {event.thumbnail
            ? <img src={event.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.5)" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>MoT+++</span>
              </div>
          }
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "#bbbbbb", letterSpacing: "0.06em", marginBottom: "4px" }}>
            {event.category}
          </p>
          <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.35 }}>
            {event.title}
          </p>
          {event.vnTitle && (
            <p style={{ fontSize: "11px", color: "#cccccc", marginTop: "2px" }}>{event.vnTitle}</p>
          )}
        </div>
        <p className="evt-past-date" style={{ fontSize: "12px", color: "#aaaaaa" }}>
          {event.displayDate || event.dateISO}
        </p>
      </div>
    </Link>
  );
}
