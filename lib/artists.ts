import artistsRaw from '../artists-data.json';
import { BIO_SLUGS, getEvent, listingEvents, type Event } from './events';

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

// Augment with resident bios not already in artistsFromData
// (residents that are also collective members are already in artistsFromData with resident: true)
const residentArtists: Artist[] = Array.from(BIO_SLUGS)
  .filter(slug => !artistsFromData.find(a => a.slug === slug))
  .reduce<Artist[]>((acc, slug) => {
    const evt = getEvent(slug);
    if (!evt) return acc;
    acc.push({
      slug:       evt.slug,
      name:       evt.title,
      collective: false,
      resident:   true,
      studioHost: false,
      origin:     '',
      website:    '',
      bio:        '',   // pulled from events-data.json in profile page via getEvent()
      photo:      '',
      workImages: [],
    });
    return acc;
  }, []);

export const allArtists: Artist[] = [...artistsFromData, ...residentArtists]
  .sort((a, b) => a.name.localeCompare(b.name));

export function getArtist(slug: string): Artist | undefined {
  return allArtists.find(a => a.slug === slug);
}

export function getArtistSlugs(): string[] {
  return allArtists.map(a => a.slug);
}

/** For a given artist, find listing events that mention them by name */
export function getArtistEvents(artist: Artist): Event[] {
  const nameParts = artist.name.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
  if (nameParts.length === 0) return [];
  return listingEvents
    .filter(event => {
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
