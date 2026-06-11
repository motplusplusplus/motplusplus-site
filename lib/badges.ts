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

// +1 museum residency residents — manually curated. The data does NOT cleanly
// identify these: "+1 a nice place for experimentation" is a 2017–2025 program
// series (presenters, not residents) and no bio/record says "+1 residency".
// Uncertain candidates exhibited in the "+1 museum by any other name" collection
// (NOT confirmed residents): "dao-tung", "tran-minh-duc". Populate as confirmed.
export const PLUS1_MUSEUM_SLUGS = new Set<string>([]);

/** Sanity `role` values that denote a non-artist primary identity. */
const CURATOR_ROLES = new Set(["curator", "writer", "researcher"]);

const norm = (r?: string | null) => (r || "").trim().toLowerCase();

/** Returns "curator" | "writer" | "researcher" if the Sanity role matches, else null. */
export function roleCategory(role?: string | null): string | null {
  const r = norm(role);
  return CURATOR_ROLES.has(r) ? r : null;
}

export type PersonSignals = {
  slug: string;
  role?: string | null;        // Sanity free-text role
  hasResidency: boolean;       // defined(residencyStartDate) || isAfarmResident || JSON resident
  isPerformancePlus: boolean;  // JSON performancePlus
  motsoundEditions?: number[]; // editions performed at (from event refs)
};

export type BadgeResult = {
  primary: string;     // single primary identity (listing sub-label + grouping)
  isFounder: boolean;  // for red founder styling
  filters: string[];   // every filter tag this person matches
  bioBadges: string[]; // ordered badges for the bio-page hero
};

export function computeBadges(p: PersonSignals): BadgeResult {
  const isHost = HOSTING_SLUGS.has(p.slug);
  const isFounder = FOUNDER_SLUGS.has(p.slug);
  const isCollective = COLLECTIVE_SLUGS.has(p.slug);
  const isPlus1 = PLUS1_MUSEUM_SLUGS.has(p.slug);
  const editions = p.motsoundEditions ?? [];
  const roleCat = roleCategory(p.role);

  // Primary identity, highest priority first.
  let primary = "artist";
  if (isFounder) primary = "founder/director";
  else if (isHost) primary = "hosting artist";
  else if (roleCat && !p.hasResidency) primary = roleCat;       // curator/writer/researcher
  else if (p.hasResidency) primary = "a.Farm";
  else if (isPlus1) primary = "+1";
  else if (p.isPerformancePlus) primary = "+1 performance";

  // Filterable tags — a person can match several.
  const filters: string[] = [];
  if (isFounder) filters.push("founder/director");
  if (isHost) filters.push("hosting artist");
  if (p.hasResidency) filters.push("a.Farm");
  if (isPlus1) filters.push("+1");
  if (p.isPerformancePlus) filters.push("+1 performance");
  if (editions.length) filters.push("MoTSound");
  if (roleCat) filters.push(roleCat);
  if (isCollective) filters.push("+1 collective");

  // Bio-page badges (ordered). +1 collective shows here, not on the listing card.
  const bioBadges: string[] = [];
  if (isFounder) bioBadges.push("founder/director");
  if (isHost) bioBadges.push("hosting artist");
  if (p.hasResidency) bioBadges.push("a.Farm resident");
  if (isPlus1) bioBadges.push("+1");
  if (p.isPerformancePlus) bioBadges.push("+1 performance");
  for (const n of editions) bioBadges.push(`MoTSound #${n}`);
  if (roleCat) bioBadges.push(roleCat);
  if (isCollective) bioBadges.push("+1 collective");

  return { primary, isFounder, filters, bioBadges };
}
