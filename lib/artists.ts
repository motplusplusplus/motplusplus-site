import artistsRaw from '../artists-data.json';
import { BIO_SLUGS, matchParts, stripDiacritics, getListingEvents, type Event } from './events';

export type Artist = {
  slug:           string;
  name:           string;
  collective:     boolean;
  resident:       boolean;
  studioHost:     boolean;
  curator?:       boolean;
  performancePlus?: boolean;
  origin:         string;
  website:        string;
  bio:            string;
  photo:          string;
  workImages:     string[];
};

export const artistsFromData: Artist[] = artistsRaw as Artist[];

// Build stub entries for residents not in artists-data.json so their pages are generated.
// Name and bio are fetched from Sanity at page render time.
const residentArtists: Artist[] = Array.from(BIO_SLUGS)
  .filter(slug => !artistsFromData.find(a => a.slug === slug))
  .map(slug => ({
    slug,
    name:       slug.replace(/-/g, ' '),
    collective: false,
    resident:   true,
    studioHost: false,
    origin:     '',
    website:    '',
    bio:        '',
    photo:      '',
    workImages: [],
  }));

export const allArtists: Artist[] = [...artistsFromData, ...residentArtists]
  .sort((a, b) => a.name.localeCompare(b.name));

export function getArtist(slug: string): Artist | undefined {
  return allArtists.find(a => a.slug === slug);
}

export function getArtistSlugs(): string[] {
  return allArtists.map(a => a.slug);
}

/** For a given artist, find listing events that mention them by name.
 *  Uses the same matchParts/blocklist logic as getRelatedEvents — requires ALL
 *  significant name parts to match, and blocks common Vietnamese name fragments. */
export function getArtistEvents(artist: Artist, events: Event[]): Event[] {
  const nameParts = matchParts(artist.name);
  if (nameParts.length === 0) return [];
  const safeToCheckDesc = nameParts.some(w => w.length >= 6);
  return getListingEvents(events)
    .filter(event => {
      if (event.slug === artist.slug) return false; // skip the artist's own bio entry
      const titleSlug = stripDiacritics(event.title + ' ' + event.slug).toLowerCase();
      if (nameParts.every(w => titleSlug.includes(w))) return true;
      if (!safeToCheckDesc) return false;
      const desc = stripDiacritics(event.description || '').toLowerCase();
      return nameParts.every(w => desc.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
