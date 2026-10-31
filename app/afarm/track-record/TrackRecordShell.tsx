"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stripDiacritics } from "@/lib/events";
import { countryFlag, countryName } from "@/lib/countries";

export type TrackRecordEntry = {
  id: string;
  name: string;
  href: string | null;
  image: string | null;
  nationalities: string[];   // ISO codes
  heritageCodes: string[];   // ISO codes
  heritageLabels: string[];  // heritage that is not a country, e.g. "Mvskoke"
  role: "resident" | "event";
  host: boolean;             // a.Farm host artist (only ever listed if also a resident)
  years: string[];
  when: string | null;       // residents: season and period as entered
  city: string | null;
};

type Filters = { q: string; country: string; role: string; year: string; heritage: boolean };

const ROLES = [
  { value: "", label: "everyone" },
  { value: "resident", label: "a.Farm residents" },
  { value: "event", label: "MoT+++ event artists" },
];

const fold = (s: string) => stripDiacritics(s).replace(/[đĐ]/g, "d").toLowerCase();

function applyFilters(entries: TrackRecordEntry[], f: Filters): TrackRecordEntry[] {
  const q = fold(f.q.trim());
  return entries.filter((e) =>
    (!q || fold(e.name).includes(q)) &&
    (!f.country || e.nationalities.includes(f.country) || (f.heritage && e.heritageCodes.includes(f.country))) &&
    (!f.role || e.role === f.role) &&
    (!f.year || e.years.includes(f.year)));
}

/** Filters live in the URL (?country=CH&role=resident&year=2019&heritage=1&q=...) so an
 *  outreach email can link straight to a filtered view. Reads them with
 *  useSearchParams, so it renders inside <Suspense>; the fallback is the unfiltered list. */
export default function TrackRecordShell({ entries }: { entries: TrackRecordEntry[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const f: Filters = {
    q: params.get("q") ?? "",
    country: (params.get("country") ?? "").toUpperCase(),
    role: params.get("role") ?? "",
    year: params.get("year") ?? "",
    heritage: params.get("heritage") === "1",
  };
  // The search box keeps its own state so typing never waits on the router.
  const [q, setQ] = useState(f.q);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, q, ...patch };
    const sp = new URLSearchParams();
    if (next.q.trim()) sp.set("q", next.q.trim());
    if (next.country) sp.set("country", next.country);
    if (next.role) sp.set("role", next.role);
    if (next.year) sp.set("year", next.year);
    if (next.heritage) sp.set("heritage", "1");
    const s = sp.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Dropdowns are built only from values present in the data, so they never offer a
  // country or year with nobody in it. Heritage countries join the list only when the
  // heritage toggle is on, since only then can they match.
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of applyFilters(entries, { ...f, country: "", q: "" })) {
      const codes = new Set([...e.nationalities, ...(f.heritage ? e.heritageCodes : [])]);
      for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => countryName(a[0]).localeCompare(countryName(b[0]), "en"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, f.role, f.year, f.heritage]);

  const years = useMemo(
    () => [...new Set(entries.flatMap((e) => e.years))].sort().reverse(),
    [entries],
  );

  const visible = applyFilters(entries, { ...f, q });
  const filtered = !!(q.trim() || f.country || f.role || f.year);
  const heritageMatches = f.country && f.heritage
    ? visible.filter((e) => !e.nationalities.includes(f.country)).length
    : 0;

  return (
    <div>
      <div className="tr-filters">
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); update({ q: e.target.value }); }}
          placeholder="search by name"
          aria-label="search by name"
          className="tr-input"
        />
        <select
          value={f.country}
          onChange={(e) => update({ country: e.target.value })}
          aria-label="country"
          className="tr-input"
        >
          <option value="">all countries</option>
          {f.country && !countries.some(([c]) => c === f.country) && (
            <option value={f.country}>{countryName(f.country)} (0)</option>
          )}
          {countries.map(([c, n]) => (
            <option key={c} value={c}>{countryName(c)} ({n})</option>
          ))}
        </select>
        <select
          value={f.year}
          onChange={(e) => update({ year: e.target.value })}
          aria-label="year"
          className="tr-input"
        >
          <option value="">all years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "24px" }}>
        {ROLES.map((r) => (
          <button key={r.value} type="button" onClick={() => update({ role: r.value })}
                  aria-pressed={f.role === r.value} className="tr-chip">
            {r.label}
          </button>
        ))}
        <label className="tr-toggle">
          <input type="checkbox" checked={f.heritage} onChange={(e) => update({ heritage: e.target.checked })} />
          include heritage
        </label>
      </div>

      <p style={{ fontSize: "12px", color: "#767676", marginBottom: "28px" }} aria-live="polite">
        {filtered ? `showing ${visible.length} of ${entries.length}` : `${entries.length} artists`}
        {heritageMatches > 0 && `, ${heritageMatches} by heritage`}
        {filtered && (
          <>
            {" · "}
            <button type="button" className="tr-clear" onClick={() => { setQ(""); router.replace(pathname, { scroll: false }); }}>
              clear filters
            </button>
          </>
        )}
      </p>

      <TrackRecordList entries={visible} />
    </div>
  );
}

export function TrackRecordList({ entries }: { entries: TrackRecordEntry[] }) {
  if (!entries.length) {
    return <p style={{ fontSize: "14px", color: "#767676", padding: "32px 0" }}>no artists match these filters.</p>;
  }
  return (
    <ul className="tr-grid">
      {entries.map((e) => <li key={e.id}><Card e={e} /></li>)}
    </ul>
  );
}

function Card({ e }: { e: TrackRecordEntry }) {
  const meta = e.role === "resident"
    ? [e.host ? "host artist" : null, e.when ?? e.years.join(", ")].filter(Boolean).join(" · ")
    : `MoT+++ event artist${e.years.length ? `, ${e.years.join(", ")}` : ""}`;
  const heritage = [...e.heritageCodes.map(countryName), ...e.heritageLabels];
  const body = (
    <>
      <div className="tr-card-img">
        {e.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span aria-hidden="true">{e.name.slice(0, 1)}</span>
        )}
      </div>
      <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.35, marginTop: "12px" }}>
        {e.name}
      </p>
      {e.nationalities.length > 0 && (
        <p style={{ fontSize: "12px", color: "#444444", marginTop: "4px", lineHeight: 1.5 }}>
          {e.nationalities.map((c) => (
            <span key={c} style={{ whiteSpace: "nowrap", marginRight: "8px" }}>
              <span aria-hidden="true">{countryFlag(c)} </span>{countryName(c)}
            </span>
          ))}
        </p>
      )}
      {heritage.length > 0 && (
        <p style={{ fontSize: "11px", color: "#767676", marginTop: "2px", lineHeight: 1.5 }}>
          heritage: {heritage.join(", ")}
        </p>
      )}
      <p style={{ fontSize: "11px", color: "#767676", marginTop: "4px", lineHeight: 1.5 }}>
        {meta}
      </p>
    </>
  );
  return e.href
    ? <Link href={e.href} className="tr-card">{body}</Link>
    : <div className="tr-card">{body}</div>;
}
