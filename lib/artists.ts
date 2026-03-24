import artistsRaw from '../artists-data.json';
import { BIO_SLUGS, type Event } from './events';

export type Artist = {
  slug:        string;
  name:        string;
  collective:  boolean;
  resident:    boolean;
  studioHost:  boolean;
  origin:      string;
  website:     string;
  bio:         string;
  photo:       string;
  workImages:  string[];
};

const artistsFromData: Artist[] = artistsRaw as Artist[];

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

/** For a given artist, find listing events that mention them by name */
export function getArtistEvents(artist: Artist, events: Event[]): Event[] {
  const nameParts = artist.name.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
  if (nameParts.length === 0) return [];
  return events
    .filter(event => {
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
