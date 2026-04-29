import { createClient } from '@sanity/client';
import eventsDataRaw from '../events-data.json';

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

export async function getTrashItems() {
  return buildClient.fetch(`
    *[_type == "trashItem" && active == true && (count(images) > 0 || count(uploadedImages) > 0 || count(legacyImageUrls) > 0) && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] | order(sortOrder asc, artist asc) {
      _id,
      artist,
      "artistSlug": artistRef->slug.current,
      title,
      medium,
      year,
      dimensions,
      edition,
      description,
      "uploadedImageUrls": uploadedImages[].asset->url,
      "directImageUrls": images[].asset->url,
      legacyImageUrls,
      "museumLocationId": museumLocationRef->._id,
      "neighbourhood": museumLocationRef->neighbourhood,
      sold,
      price,
      workLocation,
      accessContact,
      accessNotes,
    }
  `);
}

export async function getMuseumLocations() {
  return sanityClient.fetch(`
    *[_type == "museumLocation" && active == true && (!defined(locationEnd) || locationEnd >= string::split(now(), "T")[0])] {
      _id,
      title,
      artist,
      "artistSlug": artistRef->slug.current,
      medium,
      year,
      description,
      accessType,
      accessDetails,
      hours,
      contactMethod,
      hostName,
      "coordinates": location,
      "mainImage": mainImage.asset->url,
      "images": images[].asset->url,
      isPast,
    }
  `);
}

const ARTIST_FIELDS = `
  _id,
  "slug": slug.current,
  name,
  pronouns,
  birthYear,
  nationality,
  originCity,
  currentCity,
  isAfarmResident,
  season,
  period,
  "bio": pt::text(bio),
  "vnBio": pt::text(vnBio),
  instagram,
  links,
  "portrait": portrait.asset->url,
  "images": uploadedImages[].asset->url,
  legacyImageUrls,
  "trashItems": *[_type == "trashItem" && references(^._id) && active == true && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] {
    _id,
    title,
    medium,
    year,
    sold,
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
  return sanityClient.fetch(`*[_type == "artist" && active == true] | order(name asc) { ${ARTIST_FIELDS} }`);
}

export async function getArtistBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "artist" && slug.current == $slug][0] { ${ARTIST_FIELDS} }`,
    { slug }
  );
}

export async function getAllSanityArtistSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await sanityClient.fetch(
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
  "uploadedImageUrls": uploadedImages[].asset->url,
  "legacyImageUrls": coalesce(legacyImageUrls, []),
  videoUrl,
  bandcampAlbumId,
  "wpLink": coalesce(wpLink, ""),
  "isBioPage": coalesce(isBioPage, false),
  "artists": artists[]->{_id, name, "slug": slug.current},
`;

export type LinkedArtist = { _id: string; name: string; slug: string };

// Shape returned by Sanity before JS transformation
type RawEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  endDateISO?: string; displayDate: string; category: string;
  location: string; description: string; vnDescription?: string;
  uploadedImageUrls: string[] | null; legacyImageUrls: string[];
  videoUrl?: string; bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
  artists?: LinkedArtist[] | null;
};

// Shape compatible with lib/events.ts Event type
export type SanityEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  sortDate: string; pubDate: string; endDateISO?: string; displayDate: string;
  category: string; location: string; description: string; vnDescription?: string;
  images: string[]; thumbnail: string; videoUrl?: string;
  bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
  artists: LinkedArtist[];
};

// Filenames that are logos/brand assets — never valid event images
const JUNK_STEMS = [
  'a.farmlogo', 'logomot', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik',
  'codesurfing', 'formapubli', 'kirti', 'marg1n', 'matca', 'nbs',
  'rr-1', 'vanguard', 'wdg',
];
function isJunk(url: string): boolean {
  const filename = url.split('/').pop()?.toLowerCase() ?? '';
  return JUNK_STEMS.some(s => filename.includes(s));
}

// Slug → ALL images from events-data.json (R2 CDN URLs), junk filtered
const legacyImages: Record<string, string[]> = {};
for (const e of eventsDataRaw as Array<{ slug: string; images?: string[] }>) {
  if (e.slug && e.images?.length) {
    legacyImages[e.slug] = e.images.filter(u => !isJunk(u));
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
  const uploaded = e.uploadedImageUrls ?? [];
  // Filter junk from Sanity legacyImageUrls (logos, brand assets mixed in during migration)
  const legacy   = (e.legacyImageUrls ?? []).filter(u => !isJunk(u));
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

/** All event slugs — for generateStaticParams */
export async function getAllEventSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await buildClient.fetch(
    `*[_type == "event" && active == true]{ "slug": slug.current }`
  );
  return results.map(r => r.slug);
}
