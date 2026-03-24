import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: true, // cached reads — fast for public map data
});

export async function getTrashItems() {
  return sanityClient.fetch(`
    *[_type == "trashItem" && active == true && (count(images) > 0 || count(legacyImageUrls) > 0) && (!defined(consignmentEnd) || consignmentEnd >= string::split(now(), "T")[0])] | order(sortOrder asc, artist asc) {
      _id,
      artist,
      "artistSlug": artistRef->slug.current,
      title,
      medium,
      year,
      dimensions,
      edition,
      description,
      "uploadedImageUrls": images[].asset->url,
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
  bio,
  vnBio,
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
`;

// Shape returned by Sanity before JS transformation
type RawEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  endDateISO?: string; displayDate: string; category: string;
  location: string; description: string; vnDescription?: string;
  uploadedImageUrls: string[] | null; legacyImageUrls: string[];
  videoUrl?: string; bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
};

// Shape compatible with lib/events.ts Event type
export type SanityEvent = {
  slug: string; title: string; vnTitle?: string; dateISO: string;
  sortDate: string; pubDate: string; endDateISO?: string; displayDate: string;
  category: string; location: string; description: string; vnDescription?: string;
  images: string[]; thumbnail: string; videoUrl?: string;
  bandcampAlbumId?: string; wpLink: string; isBioPage: boolean;
};

function toSanityEvent(e: RawEvent): SanityEvent {
  const uploaded = e.uploadedImageUrls ?? [];
  const legacy   = e.legacyImageUrls ?? [];
  const images   = [...uploaded, ...legacy];
  return {
    slug:           e.slug,
    title:          e.title,
    vnTitle:        e.vnTitle,
    dateISO:        e.dateISO,
    sortDate:       e.dateISO,
    pubDate:        e.dateISO,
    endDateISO:     e.endDateISO,
    displayDate:    e.displayDate,
    category:       e.category,
    location:       e.location,
    description:    e.description,
    vnDescription:  e.vnDescription,
    images,
    thumbnail:      images[0] ?? '',
    videoUrl:       e.videoUrl,
    bandcampAlbumId: e.bandcampAlbumId,
    wpLink:         e.wpLink,
    isBioPage:      e.isBioPage,
  };
}

/** All active events from Sanity, in newest-first order, as Event-compatible objects */
export async function getAllEvents(): Promise<SanityEvent[]> {
  const raw: RawEvent[] = await sanityClient.fetch(
    `*[_type == "event" && active == true] | order(dateISO desc) { ${EVENT_FIELDS} }`
  );
  return raw.map(toSanityEvent);
}

/** Single event by slug */
export async function getEventBySlug(slug: string): Promise<SanityEvent | null> {
  const raw: RawEvent | null = await sanityClient.fetch(
    `*[_type == "event" && slug.current == $slug && active == true][0] { ${EVENT_FIELDS} }`,
    { slug }
  );
  return raw ? toSanityEvent(raw) : null;
}

/** All event slugs — for generateStaticParams */
export async function getAllEventSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await sanityClient.fetch(
    `*[_type == "event" && active == true]{ "slug": slug.current }`
  );
  return results.map(r => r.slug);
}
