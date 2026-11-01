import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTrackRecord, type TrackRecordArtist } from "@/lib/sanity";
import { isJunkImage } from "@/lib/junk-images";
import { isExcludedPerson } from "@/lib/excludedPeople";
import { CONTACTS } from "@/lib/contacts";
import { FOUNDER_SLUGS, HOSTING_SLUGS } from "@/lib/badges";
import TrackRecordShell, { TrackRecordList, type TrackRecordEntry } from "./TrackRecordShell";

const OG_IMAGE = "https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/studios/hoang-nam-viet/ass05503.jpg";

export const metadata: Metadata = {
  title: "a.Farm track record",
  description:
    "Every artist a.Farm has hosted in Ho Chi Minh City since 2018, by country and year, with the partners, funders and press behind the residency.",
  openGraph: {
    title: "a.Farm track record",
    description: "Every artist a.Farm has hosted in Ho Chi Minh City since 2018, by country and year.",
    url: "https://motplusplusplus.com/afarm/track-record",
    images: [{ url: OG_IMAGE, width: 1600, height: 1067 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "a.Farm track record",
    description: "Every artist a.Farm has hosted in Ho Chi Minh City since 2018, by country and year.",
    images: [OG_IMAGE],
  },
  alternates: { canonical: "https://motplusplusplus.com/afarm/track-record" },
};

const FOUNDED = 2018;

const PARTNER_ROLE_LABEL: Record<string, string> = {
  "founding-partner": "founding partner",
  "funded-residency": "funded a residency",
  "co-presented": "co-presented",
  hosted: "hosted residents",
};

// "former founding partner, from 2018" / "former partner, hosted residents, 2023 to 2025"
function partnerLine(t: { role: string; former: boolean | null; fromYear: number | null; toYear: number | null }): string {
  const role = PARTNER_ROLE_LABEL[t.role] ?? t.role;
  const head = t.former ? (t.role === "founding-partner" ? `former ${role}` : `former partner, ${role}`) : role;
  const years = t.fromYear && t.toYear && t.toYear !== t.fromYear ? `${t.fromYear} to ${t.toYear}`
    : t.fromYear && t.toYear ? `${t.fromYear}`
    : t.fromYear ? `from ${t.fromYear}` : "";
  return years ? `${head}, ${years}` : head;
}

// House rule: no em dashes in page copy. Some stored values carry them (periods such as
// "July — December 2018", one press title), so data strings are shown with an en dash.
const noEmDash = (s: string) => s.replace(/\s*—\s*/g, " – ");

// Sanity image CDN urls take resize params; R2 archive urls are served as stored.
function thumb(url: string): string {
  return url.startsWith("https://cdn.sanity.io/") ? `${url}?w=480&h=480&fit=crop&auto=format` : url;
}

function toEntry(a: TrackRecordArtist): TrackRecordEntry {
  const image = a.images.find((u): u is string => !!u && !isJunkImage(u));
  const resident = a.isAfarmResident;
  const years = resident
    ? [a.residencyStartDate?.slice(0, 4)]
    : a.eventYears.map((d) => d?.slice(0, 4));
  const season = a.season?.trim() || null;
  const period = a.period?.trim() ? noEmDash(a.period.trim()) : null;
  return {
    id: a._id,
    name: a.name, // exactly as the artist writes it; search folds a copy (TrackRecordShell)
    href: a.slug ? `/profiles/${a.slug}` : null,
    image: image ? thumb(image) : null,
    nationalities: a.nationalities ?? [],
    heritageCodes: (a.heritage ?? []).flatMap((h) => (h._type === "heritageCountry" && h.code ? [h.code] : [])),
    heritageLabels: (a.heritage ?? []).flatMap((h) => (h._type === "heritageOther" && h.label ? [h.label] : [])),
    role: resident ? "resident" : "event",
    host: !!a.slug && HOSTING_SLUGS.has(a.slug),
    years: [...new Set(years.filter((y): y is string => !!y))].sort(),
    when: resident ? [season, period].filter(Boolean).join(" · ") || null : null,
    city: a.currentCity?.trim() || null,
  };
}

const label: React.CSSProperties = { fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "20px" };
const section: React.CSSProperties = { borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" };

export default async function TrackRecordPage() {
  const { artists, partners, press } = await getTrackRecord();

  const entries = artists
    .filter((a) => !isExcludedPerson(a.name))
    // An event artist is listed only if they actually appear on an event; a nationality
    // alone is not a track record.
    .filter((a) => a.isAfarmResident || a.eventYears.length > 0)
    // The event list is for visiting artists: MoT+++'s own team and the a.Farm host
    // artists are not listed as event artists (a host who was also a resident stays,
    // labelled "host artist").
    .filter((a) => a.isAfarmResident || !a.slug || (!HOSTING_SLUGS.has(a.slug) && !FOUNDER_SLUGS.has(a.slug)))
    .map(toEntry);
  const listedPartners = partners.filter((p) => !isExcludedPerson(p.name));

  // Every number on the page is computed from the data; none is typed in.
  const residents = entries.filter((e) => e.role === "resident").length;
  const countries = new Set(entries.flatMap((e) => e.nationalities)).size;
  const yearsRunning = new Date().getFullYear() - FOUNDED;

  const stats = [
    { n: residents, label: "residents hosted" },
    { n: countries, label: "countries and territories" },
    { n: yearsRunning, label: `years running, since ${FOUNDED}` },
  ];

  return (
    <div className="tr-shell" style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

      {/* header */}
      <div style={{ marginBottom: "48px" }}>
        <p style={{ fontSize: "13px", color: "#767676", marginBottom: "16px" }}>
          <Link href="/afarm" style={{ color: "#767676", borderBottom: "1px solid #e0e0e0" }}>+a.Farm</Link>
        </p>
        <h1 style={{
          fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 300, lineHeight: 1.05,
          letterSpacing: "-0.02em", color: "#111111",
        }}>
          a.Farm track record
        </h1>
      </div>

      {/* live counts */}
      <div className="tr-stats" style={{ borderTop: "1px solid #e5e5e5", paddingTop: "40px", marginBottom: "40px" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <p style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em", color: "#111111" }}>
              {s.n}
            </p>
            <p style={{ fontSize: "12px", color: "#767676", marginTop: "10px", letterSpacing: "0.02em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", maxWidth: "640px", marginBottom: "80px" }}>
        MoT+++ started in 2015, growing out of Dia Projects; a.Farm followed in {FOUNDED}.
        since then, a.Farm has brought artists from around the world to ho chi minh city to live
        and work inside the practice of a local artist. this is the record of who has come: every
        resident, and the international artists who joined our events, searchable by country and
        year. work made in residence may enter the +1 museum by any other name collection.
      </p>

      {/* artist list */}
      <div style={{ ...section, marginBottom: "96px" }}>
        <p style={label}>artists</p>
        <Suspense fallback={<TrackRecordList entries={entries} />}>
          <TrackRecordShell entries={entries} />
        </Suspense>
      </div>

      {/* partners and funders: only partners with a confirmed track record entry */}
      {listedPartners.length > 0 && (
        <div style={section}>
          <p style={label}>partners and funders</p>
          <div>
            {listedPartners.map((p) => (
              <div key={p._id} className="tr-partner-row">
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {p.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${p.logo}?h=64&auto=format`} alt="" style={{ height: "32px", width: "auto", display: "block" }} />
                  )}
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "16px", fontWeight: 300, color: "#111111" }}>
                      {p.name} ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: "16px", fontWeight: 300, color: "#111111" }}>{p.name}</span>
                  )}
                </div>
                <div style={{ fontSize: "13px", color: "#767676", lineHeight: 1.7 }}>
                  {p.trackRecord.map((t, i) => <p key={i}>{partnerLine(t)}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* press */}
      {press.length > 0 && (
        <div style={section}>
          <p style={label}>press</p>
          <div>
            {press.map((item) => (
              <a key={item._id} href={item.url} target="_blank" rel="noopener noreferrer"
                 className="tr-press-row" lang={item.language ?? undefined}>
                <div>
                  <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}>{item.outlet}</p>
                  <p style={{ fontSize: "11px", color: "#767676", marginTop: "4px" }}>
                    {[item.date, item.language].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p style={{ fontSize: "16px", fontWeight: 300, color: "#111111", lineHeight: 1.35 }}>
                  {noEmDash(item.title)} ↗
                </p>
              </a>
            ))}
          </div>
          <p style={{ marginTop: "24px" }}>
            <Link href="/press" style={{ fontSize: "13px", color: "#767676", borderBottom: "1px solid #cccccc", paddingBottom: "2px" }}>
              all press →
            </Link>
          </p>
        </div>
      )}

      {/* funded residencies */}
      <div style={{ ...section, maxWidth: "720px" }}>
        <p style={label}>funded residencies</p>
        <h2 style={{ fontSize: "24px", fontWeight: 300, lineHeight: 1.2, marginBottom: "20px" }}>
          sponsor a named residency
        </h2>
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", marginBottom: "24px" }}>
          funders and institutions can sponsor a residency in their name: a season at a.Farm for an
          artist from your country or community. we shape the call, the pairing with a hosting
          artist and the public program with you, and your support is credited on every event the
          residency produces.
        </p>
        <a
          href={`mailto:${CONTACTS.residency}?subject=${encodeURIComponent("a.Farm funded residency")}`}
          style={{
            display: "inline-block", fontSize: "15px", color: "#ffffff",
            backgroundColor: "#111111", padding: "14px 32px",
          }}
        >
          write to {CONTACTS.residency}
        </a>
      </div>
    </div>
  );
}
