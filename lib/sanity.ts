import { createClient } from '@sanity/client';
// events-data.json is now a LEGACY ARCHIVE — all public events have been migrated
// into Sanity (the source of truth). It is retained only as a backup snapshot and
// to supply legacy image URLs for slug-merging. Do not edit it manually.
// (A comment cannot live inside the JSON itself — it is a top-level array that is
// imported and iterated — so the archive notice lives here and in events-data.ARCHIVE.md.)
import eventsDataRaw from '../events-data.json';
import { isJunkImage } from './junk-images';

export const sanityClient = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: true, // cached reads — fast for public map data
});

// Fresh (non-CDN) client for build-time event queries — avoids stale CDN cache
// causing events to fall back to events-data.json instead of Sanity data
const buildClient = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: false,
});

/** An UNSOLD trashItem must have a non-empty price to appear anywhere on the
 *  public site. A SOLD work bypasses this entirely -- it's part of the sales
 *  record, and a missing price there is a data-completeness gap, not a
 *  reason to hide it. Single source of truth, used by every trashItem query
 *  (the /trash grid, /trash/[slug], /pricelist, and the artist profile's
 *  embedded work-history list). Independent of and additional to each call
 *  site's own active/sold filters -- does not replace them. */
const TRASH_ITEM_PRICED = `(sold == true || (defined(price) && price != ""))`;

const TRASH_ITEM_FIELDS = `
  _id,
  artist,
  "artistSlug": artistRef->slug.current,
  "artists": artists[]->{_id, name, "slug": slug.current},
  "slug": slug.current,
  title,
  medium,
  year,
  dimensions,
  edition,
  description,
  "directImageUrls": images[].asset->url,
  legacyImageUrls,
  youtubeUrls,
  "museumLocationId": museumLocationRef->._id,
  "neighbourhood": museumLocationRef->neighbourhood,
  sold,
  price,
  workLocation,
  accessContact,
  accessNotes,
`;

export async function getTrashItems() {
  return buildClient.fetch(`
    *[_type == "trashItem" && active == true && ${TRASH_ITEM_PRICED} && (count(images) > 0 || count(legacyImageUrls) > 0) && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] | order(sortOrder asc, artist asc) { ${TRASH_ITEM_FIELDS} }
  `);
}

/** All currently available (active, unsold) trash items, for the internal
 *  /pricelist sales tool. Unlike getTrashItems(), does not require an image
 *  -- Karlie needs every sellable work, not just publicly gallery-ready ones. */
export async function getPricelistItems() {
  return buildClient.fetch(`
    *[_type == "trashItem" && active == true && ${TRASH_ITEM_PRICED} && sold != true && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] | order(artist asc) { ${TRASH_ITEM_FIELDS} }
  `);
}

/** Single trash item by slug, for the shareable /trash/[slug] page */
export async function getTrashItemBySlug(slug: string) {
  return buildClient.fetch(
    `*[_type == "trashItem" && slug.current == $slug && active == true && ${TRASH_ITEM_PRICED} && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])][0] { ${TRASH_ITEM_FIELDS} }`,
    { slug }
  );
}

/** All trash item slugs — for generateStaticParams */
export async function getAllTrashItemSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await buildClient.fetch(
    `*[_type == "trashItem" && active == true && ${TRASH_ITEM_PRICED} && defined(slug.current)]{ "slug": slug.current }`
  );
  return results.map(r => r.slug).filter(Boolean);
}


const ARTIST_FIELDS = `
  _id,
  "slug": slug.current,
  name,
  alternateNames,
  pronouns,
  birthYear,
  deathYear,
  nationality,
  originCity,
  currentCity,
  isAfarmResident,
  season,
  period,
  residencyStartDate,
  role,
  bio,
  vnBio,
  instagram,
  links,
  "portrait": portrait.asset->url,
  "images": uploadedImages[].asset->url,
  legacyImageUrls,
  // The artist's own writable side of collective membership — which group(s) they
  // belong to. See "collectiveRoster" below for the other direction (derived, never
  // stored) and schemaTypes/artistMembership.ts for why there is no members[] field.
  "collectives": memberOf[]{
    role,
    since,
    "collective": collective->{_id, name, "slug": slug.current, active, "portrait": portrait.asset->url},
  },
  // DERIVED roster for a collective's own page — never stored, always queried, so it
  // can't drift the way artists[]/credits[] did. NOTE ON THE ^ DEPTH: this field sits
  // two projection levels below the artist document it belongs to (this whole block is
  // itself substituted into a *[_type=="artist"]{ ...ARTIST_FIELDS... } query), so
  // matching the current artist's _id requires "^.^._id", not "^._id" — verified
  // empirically against the live dataset (a single ^ silently returns zero rows here,
  // because count(memberOf[...]) already pushes one scope frame on its own).
  "collectiveRoster": *[_type == "artist" && count(memberOf[collective._ref == ^.^._id]) > 0] | order(name asc) {
    _id, name, "slug": slug.current, active, "portrait": portrait.asset->url,
    "membership": memberOf[collective._ref == ^.^._id][0]{role, since},
  },
  "trashItems": *[_type == "trashItem" && references(^._id) && active == true && ${TRASH_ITEM_PRICED} && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] {
    _id,
    title,
    medium,
    year,
    sold,
    "slug": slug.current,
    "images": images[].asset->url,
    "museumLocationId": museumLocationRef->._id,
  },
  "museumItems": *[_type == "museumLocation" && references(^._id) && active == true && (!defined(locationEnd) || locationEnd >= string::split(now(), "T")[0])] {
    _id,
    title,
    medium,
    year,
    isPast,
    "mainImage": mainImage.asset->url,
  },
`;

export async function getArtists() {
  return buildClient.fetch(`*[_type == "artist" && active == true] | order(name asc) { ${ARTIST_FIELDS} }`);
}

export async function getArtistBySlug(slug: string) {
  return buildClient.fetch(
    `*[_type == "artist" && slug.current == $slug][0] { ${ARTIST_FIELDS} }`,
    { slug }
  );
}

export async function getAllSanityArtistSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await buildClient.fetch(
    `*[_type == "artist" && active == true]{ "slug": slug.current }`
  );
  return results.map(r => r.slug).filter(Boolean);
}

// ─── Events ──────────────────────────────────────────────────────────────────

const EVENT_FIELDS = `
  "slug": slug.current,
  title,
  vnTitle,
  "dateISO": coalesce(dateISO, ""),
  endDateISO,
  "displayDate": coalesce(displayDate, ""),
  "category": coalesce(category, ""),
  "location": coalesce(location, ""),
  "description": coalesce(description, ""),
  "vnDescription": coalesce(vnDescription, ""),
  "uploadedImages": uploadedImages[]{ "url": asset->url, "isPoster": coalesce(isPoster, false) },
  "legacyImageUrls": coalesce(legacyImageUrls, []),
  videoUrl,
  bandcampAlbumId,
  "wpLink": coalesce(wpLink, ""),
  "isBioPage": coalesce(isBioPage, false),
  "artists": artists[]->{_id, name, "slug": slug.current},
  "credits": credits[]{ role, "person": person->{_id, name, "slug": slug.current} },
`;

export type LinkedArtist = { _id: string; name: string; slug: string };

/**
 * A credit as the public site needs it: who, and what they did.
 *
 * WHY BOTH THIS AND artists[]. artists[] is the derived mirror
 * (scripts/resync-artists-from-credits.ts in the Studio repo), and it mirrors EVERY
 * credit regardless of role — so the curator/artist distinction is destroyed at
 * derivation, not merely unread here. Reading credits[] is the only way to recover it.
 *
 * artists[] stays because ~26 events come from events-data.json and have no credits[]
 * at all; they keep rendering off the mirror exactly as before.
 */
export type EventCredit = { role: string; person: LinkedArtist | null };

// Shape returned by Sanity before JS transformation
type RawEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  endDateISO?: string; displayDate: string; category: string;
  location: string; description: string; vnDescription?: string;
  uploadedImages: { url: string | null; isPoster: boolean }[] | null; legacyImageUrls: string[];
  videoUrl?: string; bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
  artists?: LinkedArtist[] | null;
  credits?: EventCredit[] | null;
};

// Shape compatible with lib/events.ts Event type
export type SanityEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  sortDate: string; pubDate: string; endDateISO?: string; displayDate: string;
  category: string; location: string; description: string; vnDescription?: string;
  images: string[]; thumbnail: string; videoUrl?: string;
  bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
  artists: LinkedArtist[];
  credits: EventCredit[];
};

// Junk/logo filename filtering lives in lib/junk-images.ts (isJunkImage), shared
// with the event/profile pages.

// Slug → ALL images from events-data.json (R2 CDN URLs), junk filtered
const legacyImages: Record<string, string[]> = {};
for (const e of eventsDataRaw as Array<{ slug: string; images?: string[] }>) {
  if (e.slug && e.images?.length) {
    legacyImages[e.slug] = e.images.filter(u => !isJunkImage(u));
  }
}

// Merge images from duplicate-slug JSON entries into their canonical counterparts
const SLUG_ALIASES: Record<string, string> = {
  'nuoc-water-resistance-a-solo-exhibition-by-thom-nguyen': 'nuoc-water-resistance',
  'giua-nhung-chop-bong-toi-mo-tiep-nhung-giac-mo-in-between-frames-i-dream-the-dreams-i-have-been-dreaming': 'in-between-frames-i-dream-the-dreams-i-have-been-dreaming',
};
for (const [alias, canonical] of Object.entries(SLUG_ALIASES)) {
  if (legacyImages[alias]?.length) {
    legacyImages[canonical] = [...(legacyImages[canonical] ?? []), ...legacyImages[alias]];
    delete legacyImages[alias];
  }
}

/** Deduplicate image URLs: exact URL match first, then filename match (handles same photo in EN/VN folders) */
function dedupImages(urls: string[]): string[] {
  const seenUrls = new Set<string>();
  const seenFilenames = new Set<string>();
  return urls.filter(url => {
    const fname = url.split('/').pop() ?? '';
    if (seenUrls.has(url) || seenFilenames.has(fname)) return false;
    seenUrls.add(url);
    seenFilenames.add(fname);
    return true;
  });
}

function toSanityEvent(e: RawEvent): SanityEvent {
  // Poster-flagged uploads first (stable order within each group) so an editor
  // ticking "isPoster" in Studio pins that image as the cover/thumbnail --
  // images[0] after the merge is what every listing and OG image uses.
  const uploadedEntries = (e.uploadedImages ?? []).filter(u => u && u.url);
  const uploaded = [
    ...uploadedEntries.filter(u => u.isPoster).map(u => u.url as string),
    ...uploadedEntries.filter(u => !u.isPoster).map(u => u.url as string),
  ];
  // Filter junk from Sanity legacyImageUrls (logos, brand assets mixed in during migration)
  const legacy   = (e.legacyImageUrls ?? []).filter(u => !isJunkImage(u));
  const jsonImages = legacyImages[e.slug] ?? [];
  // Merge all sources then deduplicate — handles same photo uploaded to EN+VN folders in R2
  const images = dedupImages([...uploaded, ...legacy, ...jsonImages]);
  const thumbnail    = images[0] ?? '';
  return {
    slug:            e.slug,
    title:           e.title,
    vnTitle:         e.vnTitle,
    dateISO:         e.dateISO,
    sortDate:        e.dateISO,
    pubDate:         e.dateISO,
    endDateISO:      e.endDateISO,
    displayDate:     e.displayDate,
    category:        e.category === '+a.farm' ? '+a.Farm' : e.category,
    location:        e.location,
    description:     e.description,
    vnDescription:   e.vnDescription,
    images,
    thumbnail,
    videoUrl:        e.videoUrl,
    bandcampAlbumId: e.bandcampAlbumId,
    wpLink:          e.wpLink,
    isBioPage:       e.isBioPage,
    artists:         (e.artists ?? []).filter(Boolean) as LinkedArtist[],
    credits:         (e.credits ?? []).filter(c => c && c.person) as EventCredit[],
  };
}

/** All active events from Sanity, in newest-first order, as Event-compatible objects */
export async function getAllEvents(): Promise<SanityEvent[]> {
  const raw: RawEvent[] = await buildClient.fetch(
    `*[_type == "event" && active == true] | order(dateISO desc) { ${EVENT_FIELDS} }`
  );
  return raw.map(toSanityEvent);
}

/** Convert a raw events-data.json entry to SanityEvent shape */
function toEventFromJson(e: Record<string, unknown>): SanityEvent {
  const images = (e.images as string[]) ?? [];
  return {
    slug:            e.slug as string,
    title:           (e.title as string) ?? '',
    vnTitle:         e.vnTitle as string | undefined,
    dateISO:         (e.dateISO as string) ?? '',
    sortDate:        (e.sortDate as string) ?? (e.dateISO as string) ?? '',
    pubDate:         (e.pubDate as string) ?? (e.dateISO as string) ?? '',
    endDateISO:      e.endDateISO as string | undefined,
    displayDate:     (e.displayDate as string) ?? '',
    category:        ((e.category as string) ?? '') === '+a.farm' ? '+a.Farm' : ((e.category as string) ?? ''),
    location:        (e.location as string) ?? '',
    description:     (e.description as string) ?? '',
    vnDescription:   e.vnDescription as string | undefined,
    images,
    thumbnail:       (e.thumbnail as string) ?? images[0] ?? '',
    videoUrl:        e.videoUrl as string | undefined,
    bandcampAlbumId: e.bandcampAlbumId as string | undefined,
    wpLink:          (e.wpLink as string) ?? '',
    isBioPage:       (e.isBioPage as boolean) ?? false,
    artists:         [],
    // events-data.json predates credits[] entirely; these render off artists[] as before.
    credits:         [],
  };
}

/** All events from events-data.json as SanityEvent-compatible objects */
export function getAllEventsFromJson(): SanityEvent[] {
  return (eventsDataRaw as Record<string, unknown>[]).map(toEventFromJson);
}

/** Single event by slug */
export async function getEventBySlug(slug: string): Promise<SanityEvent | null> {
  const raw: RawEvent | null = await buildClient.fetch(
    `*[_type == "event" && slug.current == $slug && active == true][0] { ${EVENT_FIELDS} }`,
    { slug }
  );
  return raw ? toSanityEvent(raw) : null;
}

// ─── A.Farm host profiles ─────────────────────────────────────────────────────

const AFARM_HOST_FIELDS = `
  _id,
  "slug": slug.current,
  name,
  studioName,
  neighbourhood,
  mapLat,
  mapLng,
  practiceBio,
  welcomeBio,
  collaboration,
  languages,
  availability,
  environment,
  transport,
  amenities,
  livingArrangement,
  residentRoom,
  smoking,
  smokingDetail,
  guests,
  guestsDetail,
  rules,
  practiceBioVi,
  welcomeBioVi,
  collaborationVi,
  languagesVi,
  availabilityVi,
  environmentVi,
  transportVi,
  amenitiesVi,
  livingArrangementVi,
  residentRoomVi,
  rulesVi,
  floor,
  ac,
  bathrooms,
  privateBathroom,
  kitchenAccess,
  internet,
  petsInResidence,
  laundry,
  "portrait": portrait.asset->url,
  "uploadedImageUrls": images[].asset->url,
  imageUrls,
  visibility,
  hostType,
`;

export async function getAfarmHosts() {
  return buildClient.fetch(`*[_type == "afarmHost"] | order(name asc) { ${AFARM_HOST_FIELDS} }`);
}

export async function getAfarmHostBySlug(slug: string) {
  return buildClient.fetch(
    `*[_type == "afarmHost" && slug.current == $slug][0] { ${AFARM_HOST_FIELDS} }`,
    { slug }
  );
}

/** Events that explicitly reference a given artist (by Sanity _id) */
export async function getEventsByArtistRef(artistId: string): Promise<SanityEvent[]> {
  const raw: RawEvent[] = await buildClient.fetch(
    `*[_type == "event" && active == true && !isBioPage && references($artistId)] | order(dateISO desc) { ${EVENT_FIELDS} }`,
    { artistId }
  );
  return raw.map(toSanityEvent);
}

/** Map of artist slug → sorted MoTSound edition numbers they performed at.
 *  Derived from the `artists[]` refs on `mot-sound-*` events (22 of 23 editions
 *  carry refs; #25 has none). Used to render "MoTSound #n" badges. */
export async function getMotsoundPerformerEditions(): Promise<Record<string, number[]>> {
  const raw: { slug: string; performers: (string | null)[] | null }[] = await buildClient.fetch(
    `*[_type == "event" && active == true && (category match "*sound" || title match "MoT*sound*")]{
      "slug": slug.current,
      "performers": artists[]->slug.current
    }`
  );
  const map: Record<string, Set<number>> = {};
  for (const ev of raw) {
    // edition number lives in the slug, e.g. "mot-sound-16-..." or "motsound-20"
    const m = ev.slug.match(/sound-?(\d+)/i);
    if (!m) continue;
    const edition = parseInt(m[1], 10);
    for (const p of ev.performers ?? []) {
      if (!p) continue;
      (map[p] ??= new Set()).add(edition);
    }
  }
  const out: Record<string, number[]> = {};
  for (const [slug, set] of Object.entries(map)) out[slug] = [...set].sort((a, b) => a - b);
  return out;
}

/** All event slugs — for generateStaticParams */
export async function getAllEventSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await buildClient.fetch(
    `*[_type == "event" && active == true]{ "slug": slug.current }`
  );
  return results.map(r => r.slug);
}

// ─── Press items ───────────────────────────────────────────────────────────────
// Press coverage lives in Sanity `pressItem` docs (migrated from lib/press.ts,
// task 06). Shape matches lib/press.ts's PressItem so app/press/page.tsx can use
// the static list as a build-time fallback interchangeably. Ordered newest-first
// by sortDate (undated items last, tie-broken by outlet for determinism);
// `displayDate` is the verbatim human string rendered on /press (may be null).
export type PressItem = {
  outlet: string;
  title: string;
  date: string | null;
  url: string;
  excerpt: string;
  tag: string;
};

export async function getPressItems(): Promise<PressItem[]> {
  const raw: PressItem[] = await buildClient.fetch(
    `*[_type == "pressItem" && active == true] | order(coalesce(sortDate, "0001-01-01") desc, outlet asc){
      outlet,
      title,
      "date": displayDate,
      url,
      "excerpt": coalesce(excerpt, ""),
      tag
    }`
  );
  return (raw ?? []).map(r => ({
    outlet: r.outlet ?? "",
    title: r.title ?? "",
    date: r.date ?? null,
    url: r.url ?? "",
    excerpt: r.excerpt ?? "",
    tag: r.tag ?? "",
  }));
}
