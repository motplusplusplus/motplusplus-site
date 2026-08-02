// ─── Profile badge taxonomy ───────────────────────────────────────────────────
// Single source of truth for who gets which badge. Badges are DERIVED at build
// time from existing signals (Sanity `role` / `residencyStartDate` / event refs,
// JSON flags, and the curated sets below) — there is no Sanity enum field.

/** Current a.Farm studio hosts. nguyen-thuy-hang confirmed active host (2026-06). */
export const HOSTING_SLUGS = new Set([
  "andrew-newell-walther", "karlie-ho", "le-phi-long", "quoc-anh-le",
  "hoang-nam-viet", "nguyen-thuy-hang", "thom-nguyen",
]);

/** MoT+++ collective members — authoritative list is the /collective page (7). */
export const COLLECTIVE_SLUGS = new Set([
  "aliansyah-caniago", "cam-xanh", "cian-duggan", "kim-duy",
  "le-phi-long", "matthew-brannon", "wu-chi-tsung",
]);

/** Founder / director — Cam Xanh only (Sanity role "Founder"). */
export const FOUNDER_SLUGS = new Set(["cam-xanh"]);

// +1 residency — the 2018 "performance plus 2018" inaugural residency, distinct
// from a.Farm (which also starts 2018 — these are two separate programs, not an
// a.Farm alias). Sourced from a passing mention in the WP export's
// "performance-plus-2019-introduction" post (2026-08): "the inaugural six-month
// 2018 programme... artists that joined as a resident included Phu Luc,
// Aliansyah Caniago, Enkhbold Togmidshiirev and Lai Dieu Ha." No dedicated 2018
// program post exists in this WP export — it lived on the pre-migration site
// (motplus.xyz) and is only reachable via a Wayback Machine link, not migrated
// content, so these 4 have no bio/photo source available here.
// wu-chi-tsung and kim-duy are included on information from outside this WP
// export (confirmed by Andrew, 2026-08) — same "uncertain/external" pattern as
// the tran-minh-duc/dao-tung note that used to live here for PLUS1_MUSEUM_SLUGS.
export const PLUS1_RESIDENCY_SLUGS = new Set<string>([
  "phu-luc", "aliansyah-caniago", "enkhbold-togmidshiirev", "lai-dieu-ha",
  "wu-chi-tsung", "kim-duy",
]);

// +1 museum — artists with work placed in the decentralized "+1 museum by any
// other name" collection. Sourced from the WP export's "1-museum-by-any-
// other-name" category (2026-08): tran-minh-duc, cian-duggan, dao-tung.
export const PLUS1_MUSEUM_SLUGS = new Set<string>([
  "tran-minh-duc", "cian-duggan", "dao-tung",
]);

/** Sanity `role` values that denote a non-artist primary identity. */
const CURATOR_ROLES = new Set(["curator", "writer", "researcher"]);

const norm = (r?: string | null) => (r || "").trim().toLowerCase();

/** Returns "curator" | "writer" | "researcher" if the Sanity role matches, else null. */
export function roleCategory(role?: string | null): string | null {
  const r = norm(role);
  return CURATOR_ROLES.has(r) ? r : null;
}

// ─── JSON-flag → Sanity migration status (audited 2026-06-14, ISSUE-006) ──────────
// computeBadges still depends on three artists-data.json flags because Sanity does NOT
// yet reliably cover them. Verified by cross-referencing every JSON flag against live
// Sanity (`role` / `residencyStartDate` / `isAfarmResident`):
//   • resident        — 72 JSON-flagged; 60 covered by Sanity, but 12 have NO Sanity
//                       residencyStartDate AND no isAfarmResident: perrine-lievens,
//                       celina-huynh, lai-dieu-ha, maxime-brygo, phuong-gio,
//                       bang-nhat-linh, ngo-thanh-bac, weston-teruya, baby-reni,
//                       enkhbold-togmidshiirev, lap-xuan, duong-tu-que. Dropping the
//                       JSON fallback would remove their a.Farm badge → KEEP until those
//                       12 get a residencyStartDate (or isAfarmResident) set in Sanity.
//   • performancePlus — 43 JSON-flagged; Sanity has NO equivalent field at all → KEEP
//                       until a Sanity boolean (e.g. isPerformancePlus) is added (§ISSUE-005-ish).
//   • curator         — 3 JSON-flagged (karlie-ho, linh-le, david-willis); Sanity `role`
//                       covers linh-le + david-willis, but karlie-ho's Sanity role is
//                       empty and her curator status can't be independently verified →
//                       KEEP until her Sanity role is set.
// Retire each flag from the assembly sites (app/profiles/page.tsx and
// app/profiles/[slug]/page.tsx) only AFTER the matching Sanity gap above is closed.
export type PersonSignals = {
  slug: string;
  role?: string | null;        // Sanity free-text role (JSON `curator` flag is the fallback — see audit above)
  hasResidency: boolean;       // defined(residencyStartDate) || isAfarmResident || JSON resident (12 rely only on JSON)
  isPerformancePlus: boolean;  // JSON performancePlus only — no Sanity field exists
  motsoundEditions?: number[]; // editions performed at (from Sanity event refs — fully Sanity-sourced)
};

export type BadgeResult = {
  primary: string;        // single primary identity (listing sub-label + grouping)
  isFounder: boolean;     // for red founder styling
  isPlus1Museum: boolean; // has work in the +1 museum collection
  filters: string[];      // every filter tag this person matches
  bioBadges: string[];    // ordered badges for the bio-page hero
};

export function computeBadges(p: PersonSignals): BadgeResult {
  const isHost = HOSTING_SLUGS.has(p.slug);
  const isFounder = FOUNDER_SLUGS.has(p.slug);
  const isCollective = COLLECTIVE_SLUGS.has(p.slug);
  const isPlus1Residency = PLUS1_RESIDENCY_SLUGS.has(p.slug);
  const isPlus1Museum = PLUS1_MUSEUM_SLUGS.has(p.slug);
  const editions = p.motsoundEditions ?? [];
  const roleCat = roleCategory(p.role);

  // Primary identity, highest priority first. +1 residency is checked before
  // a.Farm: it's the rarer, more specific program (6 people vs. the much
  // larger a.Farm cohort), and some people (e.g. wu-chi-tsung, kim-duy) have
  // both a residencyStartDate (a.Farm) AND a +1 residency slug — without this
  // ordering their card would only ever say "a.Farm" and the +1 residency
  // distinction would never surface on the listing.
  let primary = "artist";
  if (isFounder) primary = "founder/director";
  else if (isHost) primary = "hosting artist";
  else if (roleCat && !p.hasResidency) primary = roleCat;       // curator/writer/researcher
  else if (isPlus1Residency) primary = "+1 residency";
  else if (p.hasResidency) primary = "a.Farm";
  else if (p.isPerformancePlus) primary = "+1 performance";

  // Filterable tags — a person can match several. "founder/director" is
  // intentionally excluded: it has only one member (the badge still renders
  // via primary/bioBadges), so it isn't a useful filter.
  const filters: string[] = [];
  if (isHost) filters.push("hosting artist");
  if (p.hasResidency) filters.push("a.Farm");
  if (isPlus1Residency) filters.push("+1 residency");
  if (isPlus1Museum) filters.push("+1 museum");
  if (p.isPerformancePlus) filters.push("+1 performance");
  if (editions.length) filters.push("MoTSound");
  if (roleCat) filters.push(roleCat);
  if (isCollective) filters.push("+1 collective");

  // Bio-page badges (ordered). +1 collective shows here, not on the listing card.
  const bioBadges: string[] = [];
  if (isFounder) bioBadges.push("founder/director");
  if (isHost) bioBadges.push("hosting artist");
  if (p.hasResidency) bioBadges.push("a.Farm resident");
  if (isPlus1Residency) bioBadges.push("+1 residency");
  if (isPlus1Museum) bioBadges.push("+1 museum");
  if (p.isPerformancePlus) bioBadges.push("+1 performance");
  for (const n of editions) bioBadges.push(`MoTSound #${n}`);
  if (roleCat) bioBadges.push(roleCat);
  if (isCollective) bioBadges.push("+1 collective");

  return { primary, isFounder, isPlus1Museum, filters, bioBadges };
}
