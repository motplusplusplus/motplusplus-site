// Profile image fallback — what a profile shows in the portrait slot when the
// Sanity artist doc has no `portrait`.
//
// Display logic only: nothing here writes to Sanity. An explicit portrait (or a
// local artists-data.json photo, which the page already merges in) always wins;
// this is consulted only when neither exists.
//
// Order (owner, 2026-11-12):
//   1. a photo from an event that references the artist — solo events first
//      (they are the only credited person), then most recent; within an event,
//      uploadedImages in Studio order, then legacyImageUrls. Images ticked
//      isPoster are skipped unless no event has anything else.
//   2. an image of one of their own works (trashItem referencing them)
//   3. an image from their a.Farm host page (afarmHost with the same name:
//      images[], then imageUrls)
//   4. nothing.
//
// Deterministic: every tie is broken on slug/_id, so the same build always picks
// the same image. Cheap: the candidates come back in the one getArtistBySlug
// projection (profileImageFallbackFields); the choice is made here at build
// time, so the static page carries a single <img> and the browser makes no
// extra requests.
//
// Linking stays refs-only (ARCHITECTURE.md §4): events and works are found with
// references(^._id). The a.Farm host step is an exact, case-insensitive name
// equality because afarmHost has no artist reference — never fuzzy.
//
// This module is imported by the Node report script
// (scripts/report-profile-image-fallback.ts) as well as the page, so it must stay
// free of path aliases and other imports; the junk filter is passed in.

/** GROQ fields to splice into an artist projection (the artist is `^` inside the
 *  subqueries). Kept top-level, not nested in an object, so `^` resolves to the
 *  artist document.
 *  @param trashPagePredicate  the condition under which a trashItem has a live
 *         /trash/[slug] page — lib/sanity.ts passes the same TRASH_ITEM_PRICED +
 *         CONSIGNMENT_CURRENT rule getTrashItemBySlug uses, so a caption never
 *         links to a 404. */
export const profileImageFallbackFields = (trashPagePredicate: string) => `
  "fallbackEvents": *[_type == "event" && active == true && !(_id in path("drafts.**")) && references(^._id)] {
    "slug": slug.current,
    title,
    "dateISO": coalesce(dateISO, ""),
    "isBioPage": coalesce(isBioPage, false),
    "credited": count(array::unique(coalesce(artists[]._ref, []) + coalesce(credits[].person._ref, []))),
    "uploaded": uploadedImages[]{ "url": asset->url, "isPoster": coalesce(isPoster, false) },
    "legacy": coalesce(legacyImageUrls, []),
  },
  "fallbackWorks": *[_type == "trashItem" && active == true && !(_id in path("drafts.**")) && references(^._id)] {
    _id,
    title,
    "slug": slug.current,
    "year": coalesce(year, 0),
    "hasPage": defined(slug.current) && (${trashPagePredicate}),
    "images": images[].asset->url,
    "legacy": coalesce(legacyImageUrls, []),
  },
  "fallbackHosts": *[_type == "afarmHost" && !(_id in path("drafts.**")) && visibility != "hidden" && lower(name) == lower(^.name)] {
    _id,
    name,
    "slug": slug.current,
    "images": images[].asset->url,
    "imageUrls": coalesce(imageUrls, []),
  },
`;

export type FallbackEvent = {
  slug: string | null; title: string | null; dateISO: string; isBioPage: boolean;
  credited: number;
  uploaded: { url: string | null; isPoster: boolean }[] | null;
  legacy: string[];
};
export type FallbackWork = {
  _id: string; title: string | null; slug: string | null; year: number; hasPage: boolean;
  images: (string | null)[] | null; legacy: string[];
};
export type FallbackHost = {
  _id: string; name: string | null; slug: string | null;
  images: (string | null)[] | null; imageUrls: string[];
};
export type FallbackSources = {
  fallbackEvents?: FallbackEvent[] | null;
  fallbackWorks?: FallbackWork[] | null;
  fallbackHosts?: FallbackHost[] | null;
};

export type ProfileFallbackImage = {
  url: string;
  source: "event" | "work" | "afarm";
  /** caption text after "from: " */
  label: string;
  /** internal link for the caption, when that page is built; otherwise undefined */
  href?: string;
};

const byString = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Pick the fallback image, or null if there is nothing usable.
 * @param src     the fallback* fields from the artist projection
 * @param isJunk  junk/logo filename filter (lib/junk-images.ts isJunkImage)
 */
export function pickProfileFallbackImage(
  src: FallbackSources | null | undefined,
  isJunk: (url: string) => boolean,
): ProfileFallbackImage | null {
  if (!src) return null;
  const ok = (u: string | null | undefined): u is string => !!u && !isJunk(u);

  // 1. events — solo first, then newest, then slug for a stable tie-break.
  const events = [...(src.fallbackEvents ?? [])].sort((a, b) => {
    const soloA = a.credited <= 1 ? 0 : 1;
    const soloB = b.credited <= 1 ? 0 : 1;
    if (soloA !== soloB) return soloA - soloB;
    if (a.dateISO !== b.dateISO) return byString(b.dateISO, a.dateISO);
    return byString(a.slug ?? "", b.slug ?? "");
  });
  // Bio-page events are not built under /events/ (lib/events.ts BIO_SLUGS), so
  // there is no page to link to, and their title is usually just the person's
  // name — "from: <name>" would read as a portrait credit. Say what it is instead.
  const eventCaption = (e: FallbackEvent) => e.isBioPage
    ? { label: "documentation", href: undefined }
    : { label: e.title || "event", href: e.slug ? `/events/${e.slug}/` : undefined };
  // legacyImageUrls carry no isPoster flag; a migrated file named "...poster..."
  // (e.g. motsound/01-poster.jpg) is a poster all the same, so it waits with them.
  const posterName = (u: string) => /poster/i.test(u.split("/").pop() ?? "");
  for (const e of events) {
    const nonPoster = (e.uploaded ?? []).filter(u => !u.isPoster).map(u => u.url);
    const url = [...nonPoster, ...e.legacy.filter(u => !posterName(u))].find(ok);
    if (url) return { url, source: "event", ...eventCaption(e) };
  }
  // posters only when no event has any other image
  for (const e of events) {
    const posters = [...(e.uploaded ?? []).filter(u => u.isPoster).map(u => u.url), ...e.legacy.filter(posterName)];
    const url = posters.find(ok);
    if (url) return { url, source: "event", ...eventCaption(e) };
  }

  // 2. own works — newest first, then _id.
  const works = [...(src.fallbackWorks ?? [])].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : byString(a._id, b._id));
  for (const w of works) {
    const url = [...(w.images ?? []), ...w.legacy].find(ok);
    if (url) {
      return {
        url, source: "work", label: w.title || "work",
        href: w.slug && w.hasPage ? `/trash/${w.slug}/` : undefined,
      };
    }
  }

  // 3. a.Farm host page — by _id for a stable order if a name ever repeats.
  const hosts = [...(src.fallbackHosts ?? [])].sort((a, b) => byString(a._id, b._id));
  for (const h of hosts) {
    const url = [...(h.images ?? []), ...h.imageUrls].find(ok);
    if (url) {
      return {
        url, source: "afarm", label: `a.Farm studio — ${h.name ?? ""}`.trim(),
        href: h.slug ? `/afarm/studios/${h.slug}/` : undefined,
      };
    }
  }
  return null;
}
