"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { categories, isPast, normalizeDisplayDate, stripDiacritics, type Event } from "@/lib/events";

const ALL = "all";

function searchEvents(events: Event[], query: string): Event[] {
  if (!query.trim()) return events;
  const terms = stripDiacritics(query.toLowerCase()).split(/\s+/).filter(t => t.length >= 2);
  if (terms.length === 0) return events;
  return events.filter(e => {
    const haystack = stripDiacritics(
      [e.title, e.vnTitle, e.description, e.category, e.location].filter(Boolean).join(" ")
    ).toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

export function EventsShell({ events }: { events: Event[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [tagsOpen, setTagsOpen] = useState(false);

  // Filter by search query from URL
  const searchFiltered = useMemo(() => searchEvents(events, urlQuery), [events, urlQuery]);

  const clearSearch = () => {
    setSearchInput("");
    router.push("/events");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/events?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push("/events");
    }
  };

  // Hero: random event with image (only when not searching)
  const eventsWithImg = useRef(events.filter(e => e.thumbnail));
  const pickRandom = (exclude?: Event) => {
    const pool = eventsWithImg.current.filter(e => e !== exclude);
    return pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : eventsWithImg.current[0] ?? events[0];
  };
  const [heroEvent, setHeroEvent] = useState<Event>(() => pickRandom());
  const [heroHovered, setHeroHovered] = useState(false);

  const randomizeHero = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeroEvent(prev => pickRandom(prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show events with real documentation (thumbnail)
  // When searching, use searchFiltered; otherwise use all events
  const baseEvents = urlQuery ? searchFiltered : events;
  const documented = baseEvents.filter(e => e.thumbnail);

  const filtered =
    activeCategory === ALL
      ? documented
      : documented.filter(e => e.category === activeCategory);

  const upcoming = filtered.filter(e => !isPast(e));
  const past     = filtered.filter(e => isPast(e));

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
      {/* hero — random event, click to view, button to randomize (hidden when searching) */}
      {!urlQuery && (
        <Link
          href={`/events/${heroEvent.slug}`}
          style={{ display: "block", textDecoration: "none" }}
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
        >
        <div style={{
          position: "relative",
          width: "100%", height: "55vh", minHeight: "360px",
          overflow: "hidden", backgroundColor: "#111111",
          cursor: "pointer",
        }}>
          {heroEvent.thumbnail && (
            <img
              src={heroEvent.thumbnail}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: heroHovered ? "saturate(0.15)" : "saturate(1)",
                opacity: heroHovered ? 0.7 : 0.82,
                transition: "filter 0.4s ease, opacity 0.4s ease",
              }}
            />
          )}
          {/* title + date overlay — always on mobile, on hover desktop */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.75) 100%)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: "clamp(24px, 4vw, 48px)",
          }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", marginBottom: "10px" }}>
              {heroEvent.category}
            </p>
            <p style={{
              fontSize: "clamp(18px, 2.5vw, 32px)",
              fontWeight: 300, lineHeight: 1.2, color: "#ffffff",
              maxWidth: "640px",
            }} className="evt-hero-title">
              {heroEvent.title}
            </p>
            {heroEvent.vnTitle && (
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }} className="evt-hero-title">
                {heroEvent.vnTitle}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "10px" }} className="evt-hero-title">
              {normalizeDisplayDate(heroEvent.displayDate || heroEvent.dateISO)}
            </p>
          </div>

          {/* randomize button */}
          <button
            onClick={randomizeHero}
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)", fontSize: "11px", letterSpacing: "0.06em",
              padding: "8px 14px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ↻ random
          </button>
        </div>
      </Link>
      )}

      <div className="evt-shell-body" style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* search bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "480px" }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: "10px",
              border: "1px solid #e0e0e0", padding: "10px 14px", backgroundColor: "#fafafa",
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#999999" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                <circle cx="6.5" cy="6.5" r="5" />
                <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
              </svg>
              <input
                type="text"
                placeholder="search events, artists..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: "14px",
                  fontWeight: 300, color: "#111111", fontFamily: "inherit",
                  background: "transparent",
                }}
              />
              {urlQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "12px", color: "#999999", fontFamily: "inherit", padding: 0,
                  }}
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </form>

        {/* search results indicator */}
        {urlQuery && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", color: "#666666" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{urlQuery}"
            </p>
          </div>
        )}

        {/* page label + collapsible category filters */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: tagsOpen ? "16px" : "0" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em" }}>
              {urlQuery ? "search results" : "news & events"}
            </p>
            {!urlQuery && (
              <button
                onClick={() => setTagsOpen(o => !o)}
                style={{
                  fontSize: "11px", color: "#bbbbbb", letterSpacing: "0.06em",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "inherit", padding: 0,
                  display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                filter
                <span style={{
                  display: "inline-block",
                  transform: tagsOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.18s",
                }}>↓</span>
              </button>
            )}
            {activeCategory !== ALL && !urlQuery && (
              <span style={{ fontSize: "11px", color: "#888888", letterSpacing: "0.04em" }}>
                {activeCategory}
                <button
                  onClick={() => setActiveCategory(ALL)}
                  style={{ marginLeft: "6px", fontSize: "11px", color: "#bbbbbb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  ×
                </button>
              </span>
            )}
          </div>
          {tagsOpen && !urlQuery && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
          )}
        </div>

        {/* search results — flat grid when searching */}
        {urlQuery ? (
          filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "48px 32px",
            }}>
              {filtered.map(e => <EventCard key={e.slug} event={e} />)}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#999999" }}>
              no events found matching "{urlQuery}"
            </p>
          )
        ) : (
          <>
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
          </>
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
          cursor: "pointer", padding: "16px 12px", textAlign: "left",
          minHeight: "48px",
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
        <div className="evt-card-img" style={{ width: "100%", aspectRatio: "4/3", backgroundColor: "#111111" }}>
          <img
            src={event.thumbnail || (event.category?.toLowerCase().includes('a.farm')
              ? 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/events/michael-atavar/a.farmlogo_500x500-1-2.jpg'
              : '/motpluspluspluslogo.jpg')}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
          <p style={{ fontSize: "12px", color: "#999999" }}>{normalizeDisplayDate(event.displayDate || event.dateISO)}</p>
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
          <img
            src={event.thumbnail || (event.category?.toLowerCase().includes('a.farm')
              ? 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/events/michael-atavar/a.farmlogo_500x500-1-2.jpg'
              : '/motpluspluspluslogo.jpg')}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.5)" }}
          />
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
          {normalizeDisplayDate(event.displayDate || event.dateISO)}
        </p>
      </div>
    </Link>
  );
}
