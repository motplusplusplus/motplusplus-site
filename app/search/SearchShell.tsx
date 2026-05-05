"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export type ArtistResult = {
  slug: string;
  name: string;
  hasBio: boolean;
};

export type StudioResult = {
  slug: string;
  name: string;
  neighborhood: string;
};

export type EventResult = {
  slug: string;
  title: string;
  displayDate: string;
};

type Props = {
  artists: ArtistResult[];
  studios: StudioResult[];
  events: EventResult[];
};

function strip(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matches(haystack: string, terms: string[]): boolean {
  const h = strip(haystack);
  return terms.every(t => h.includes(t));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function SearchShell({ artists, studios, events }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("q") || "";
  const [input, setInput] = useState(urlQuery);

  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  const terms = useMemo(
    () => strip(urlQuery).split(/\s+/).filter(t => t.length >= 2),
    [urlQuery]
  );

  const hasQuery = terms.length > 0;

  const matchedArtists = useMemo(
    () => hasQuery ? artists.filter(a => matches(a.name, terms)) : [],
    [artists, terms, hasQuery]
  );

  const matchedStudios = useMemo(
    () => hasQuery ? studios.filter(s => matches(s.name + " " + s.neighborhood, terms)) : [],
    [studios, terms, hasQuery]
  );

  const matchedEvents = useMemo(
    () => hasQuery ? events.filter(e => matches(e.title, terms)).slice(0, 20) : [],
    [events, terms, hasQuery]
  );

  const totalResults = matchedArtists.length + matchedStudios.length + matchedEvents.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 24px" }}>

      {/* search bar */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #111111", paddingBottom: "12px" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#999999" strokeWidth="1.5" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" />
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
          </svg>
          <input
            autoFocus
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="search artists, studios, events..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "20px",
              fontWeight: 300,
              color: "#111111",
              fontFamily: "inherit",
              background: "transparent",
            }}
          />
          {input && (
            <button
              type="button"
              onClick={() => { setInput(""); router.push("/search"); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#999999", fontFamily: "inherit" }}
            >
              clear
            </button>
          )}
        </div>
      </form>

      {/* no query state */}
      {!hasQuery && (
        <p style={{ fontSize: "14px", color: "#999999" }}>
          search across artists, studios, and events
        </p>
      )}

      {/* no results */}
      {hasQuery && totalResults === 0 && (
        <p style={{ fontSize: "14px", color: "#999999" }}>
          no results for &ldquo;{urlQuery}&rdquo;
        </p>
      )}

      {/* artists */}
      {matchedArtists.length > 0 && (
        <Section title="artists">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {matchedArtists.map(a => (
              <Link
                key={a.slug}
                href={a.hasBio ? `/residents/${a.slug}` : `/profiles`}
                style={{
                  display: "block",
                  padding: "14px 0",
                  borderBottom: "1px solid #f0f0f0",
                  color: "#111111",
                  fontSize: "18px",
                  fontWeight: 300,
                }}
              >
                {a.name}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* studios */}
      {matchedStudios.length > 0 && (
        <Section title="studios">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {matchedStudios.map(s => (
              <Link
                key={s.slug}
                href={`/afarm/studios/${s.slug}`}
                style={{
                  display: "block",
                  padding: "14px 0",
                  borderBottom: "1px solid #f0f0f0",
                  color: "#111111",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "18px", fontWeight: 300 }}>{s.name}</span>
                {s.neighborhood && (
                  <span style={{ fontSize: "12px", color: "#999999", marginLeft: "12px" }}>{s.neighborhood}</span>
                )}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* events */}
      {matchedEvents.length > 0 && (
        <Section title="events">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {matchedEvents.map(e => (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                style={{
                  display: "block",
                  padding: "14px 0",
                  borderBottom: "1px solid #f0f0f0",
                  color: "#111111",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: 300 }}>{e.title}</span>
                {e.displayDate && (
                  <span style={{ fontSize: "12px", color: "#999999", marginLeft: "12px" }}>{e.displayDate}</span>
                )}
              </Link>
            ))}
          </div>
          {matchedEvents.length === 20 && (
            <Link
              href={`/events?q=${encodeURIComponent(urlQuery)}`}
              style={{ fontSize: "13px", color: "#888888", display: "block", marginTop: "16px" }}
            >
              see all event results →
            </Link>
          )}
        </Section>
      )}

    </div>
  );
}
