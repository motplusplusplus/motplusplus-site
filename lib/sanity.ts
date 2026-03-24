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
    *[_type == "museumLocation" && active == true] {
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
  "museumItems": *[_type == "museumLocation" && references(^._id) && active == true] {
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

export async function getEvents() {
  return sanityClient.fetch(`
    *[_type == "event" && active == true] | order(dateISO desc) {
      _id,
      "slug": slug.current,
      title,
      vnTitle,
      dateISO,
      endDateISO,
      displayDate,
      category,
      location,
      description,
      vnDescription,
      "uploadedImageUrls": uploadedImages[].asset->url,
      legacyImageUrls,
      videoUrl,
      bandcampAlbumId,
      wpLink,
      isBioPage,
    }
  `);
}
