// Client-side search index for the header typeahead dropdown.
//
// Approach (see ARCHITECTURE.md §10): the site is a static export with no server
// runtime, but search must stay fresh within minutes of a Sanity publish without
// a rebuild. So the browser fetches a compact index DIRECTLY from Sanity's public,
// CDN-cached query API the first time the user searches (≈54 KB gzipped), caches
// it for the session, and filters it client-side. This gives always-fresh content
// (no build, no webhook, no extra Worker) while keeping the existing
// diacritic-stripped substring matching that the /search page uses.
//
// IMPORTANT: every result href produced here is INTERNAL to motplusplusplus.com.
// News/press items carry an external `url` but are deliberately linked to /press;
// `isInternalHref` is enforced again at filter time so nothing external can leak.

import { pressItems } from "./press";

// ─── Sanity public read endpoint (no token — dataset ACL is `public`) ──────────
const PROJECT_ID = "t5nsm79o";
const DATASET = "production";
const API_VERSION = "2026-03-20";

// Combined GROQ query — one round trip. Only publicly visible docs:
//  - artist: active == true (drafts are excluded automatically by the public API)
//  - event:  active == true && not a bio-page stub
//  - afarmHost: visibility == "visible"
//  - trashItem / museumLocation: active == true
const INDEX_QUERY = `{
  "profiles": *[_type == "artist" && active == true && defined(slug.current)]{
    "slug": slug.current, name,
    "bio": coalesce(pt::text(bio), bio),
    "vnBio": coalesce(pt::text(vnBio), vnBio),
    role
  },
  "events": *[_type == "event" && active == true && !coalesce(isBioPage, false) && defined(slug.current)]{
    "slug": slug.current, title, vnTitle,
    "category": coalesce(category, ""),
    "displayDate": coalesce(displayDate, "")
  },
  "studios": *[_type == "afarmHost" && visibility == "visible" && defined(slug.current)]{
    "slug": slug.current, name, studioName, neighbourhood
  },
  "trash": *[_type == "trashItem" && active == true && count(images) > 0]{
    title, artist, medium
  },
  "museum": *[_type == "museumLocation" && active == true]{
    title, artist, medium
  }
}`;

export type SearchType = "profile" | "event" | "studio" | "trash" | "museum" | "news";

export type SearchDoc = {
  type: SearchType;
  title: string;
  badge: string;
  href: string; // always internal
  subtitle?: string;
  haystack: string; // diacritic-stripped, lowercased EN + VN text
  rank: number; // ordering tier — see TIER below
};

export type SearchResult = SearchDoc & { score: number };

// Ordering tiers: profiles first, then events, then program entries, then news.
const TIER: Record<SearchType, number> = {
  profile: 0,
  event: 1,
  studio: 2,
  trash: 2,
  museum: 2,
  news: 3,
};

// Event category → badge. Generic MoT+++ events read "Event"; program-associated
// events get the program's own name (per the badge spec).
const EVENT_BADGE: Record<string, string> = {
  "MoT+++": "Event",
  "+a.Farm": "+a.Farm",
  "+a.farm": "+a.Farm",
  MoTsound: "MoTsound",
  "+1 contemporary project": "+1 contemporary project",
  "+1 performance": "+1 performance",
  "+1 nice place for experimentation": "+1 nice place for experimentation",
};

function eventBadge(category: string): string {
  return EVENT_BADGE[category] ?? "Event";
}

/** Strip diacritics + lowercase — same normalization as the /search page. */
export function strip(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** True only for same-site relative paths. No protocol, no host, no protocol-relative. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.includes("://");
}

// ─── Raw Sanity shapes ─────────────────────────────────────────────────────────
type RawIndex = {
  profiles?: { slug: string; name: string; bio?: string; vnBio?: string; role?: string }[];
  events?: { slug: string; title: string; vnTitle?: string; category: string; displayDate: string }[];
  studios?: { slug: string; name: string; studioName?: string; neighbourhood?: string }[];
  trash?: { title?: string; artist?: string; medium?: string }[];
  museum?: { title?: string; artist?: string; medium?: string }[];
};

function buildDocs(raw: RawIndex): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const p of raw.profiles ?? []) {
    if (!p.slug || !p.name) continue;
    docs.push({
      type: "profile",
      title: p.name,
      badge: "MoTcyclopedia",
      href: `/profiles/${p.slug}`,
      subtitle: p.role || undefined,
      haystack: strip([p.name, p.bio, p.vnBio, p.role].filter(Boolean).join(" ")),
      rank: TIER.profile,
    });
  }

  for (const e of raw.events ?? []) {
    if (!e.slug || !e.title) continue;
    docs.push({
      type: "event",
      title: e.title,
      badge: eventBadge(e.category),
      href: `/events/${e.slug}`,
      subtitle: e.displayDate || undefined,
      haystack: strip([e.title, e.vnTitle, e.category].filter(Boolean).join(" ")),
      rank: TIER.event,
    });
  }

  for (const s of raw.studios ?? []) {
    if (!s.slug) continue;
    const title = s.studioName || `${s.name} studio`;
    docs.push({
      type: "studio",
      title,
      badge: "+a.Farm",
      href: `/afarm/studios/${s.slug}`,
      subtitle: s.neighbourhood || undefined,
      haystack: strip([s.studioName, s.name, s.neighbourhood].filter(Boolean).join(" ")),
      rank: TIER.studio,
    });
  }

  for (const t of raw.trash ?? []) {
    const title = t.title || t.artist || "untitled";
    if (!t.artist && !t.title) continue;
    docs.push({
      type: "trash",
      title,
      badge: "+1 trash",
      href: "/trash", // no per-item route; link to the internal listing
      subtitle: t.artist || undefined,
      haystack: strip([t.title, t.artist, t.medium].filter(Boolean).join(" ")),
      rank: TIER.trash,
    });
  }

  for (const m of raw.museum ?? []) {
    const title = m.title || m.artist || "untitled";
    if (!m.artist && !m.title) continue;
    docs.push({
      type: "museum",
      title,
      badge: "+1 museum",
      href: "/museum", // no per-item route; link to the internal map
      subtitle: m.artist || undefined,
      haystack: strip([m.title, m.artist, m.medium].filter(Boolean).join(" ")),
      rank: TIER.museum,
    });
  }

  // News/press — not in Sanity. Linked to the internal /press page, never the
  // external source URL.
  for (const n of pressItems) {
    docs.push({
      type: "news",
      title: n.title,
      badge: "News",
      href: "/press",
      subtitle: n.outlet || undefined,
      haystack: strip([n.title, n.outlet, n.excerpt, n.tag].filter(Boolean).join(" ")),
      rank: TIER.news,
    });
  }

  // Static one-off: /luke-tramy is not in Sanity — add it here so name searches
  // surface it. Intentional; do not copy this pattern for CMS-managed content.
  docs.push({
    type: "news",
    title: "Public Statement",
    badge: "Statement",
    href: "/luke-tramy",
    subtitle: "Luke Schneider · Nguyễn Trà My · Rare Sea",
    haystack: strip(
      "Luke Schneider Schneider Tra My Nguyen Trà My Nguyễn Trà My Tra My Nguyen Rare Sea Cong ty Rare Sea public statement former staff"
    ),
    rank: TIER.news,
  });

  return docs;
}

async function fetchIndex(): Promise<SearchDoc[]> {
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(INDEX_QUERY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  const json = (await res.json()) as { result?: RawIndex };
  return buildDocs(json.result ?? {});
}

// Module-level cache + in-flight dedupe so the index is fetched at most once per
// session, even if several keystrokes race the first request.
let cache: SearchDoc[] | null = null;
let inflight: Promise<SearchDoc[]> | null = null;

export function loadSearchIndex(): Promise<SearchDoc[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetchIndex()
    .then((docs) => {
      cache = docs;
      inflight = null;
      return docs;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/**
 * Filter + rank the index for a query.
 *  - AND across whitespace-separated terms (matches the /search page).
 *  - Tier dominates ordering (profiles → events → program entries → news);
 *    within a tier, title-prefix/word-prefix/substring quality breaks ties.
 *  - Hard internal-href guard: any non-internal href is dropped.
 */
export function searchIndex(docs: SearchDoc[], query: string, limit = 7): SearchResult[] {
  const terms = strip(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const out: SearchResult[] = [];
  for (const d of docs) {
    if (!isInternalHref(d.href)) continue; // enforced, not just by convention
    if (!terms.every((t) => d.haystack.includes(t))) continue;

    const titleNorm = strip(d.title);
    const words = titleNorm.split(/[^a-z0-9]+/).filter(Boolean);
    const first = terms[0];

    let quality = 0; // lower = better match
    if (titleNorm.startsWith(first)) quality = 0;
    else if (words.some((w) => w.startsWith(first))) quality = 1;
    else if (titleNorm.includes(first)) quality = 2;
    else quality = 3; // matched only in body text

    out.push({ ...d, score: d.rank * 10 + quality });
  }

  out.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));
  return out.slice(0, limit);
}
