import artistsRaw from '../artists-data.json';
import { BIO_SLUGS, type Event } from './events';

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

// Bio-event slugs that are NOT their own profile — consolidated into a canonical
// artist profile (redirected by worker.js). Kept in BIO_SLUGS so they stay
// excluded from /events, but no standalone /profiles page is generated for them.
export const CONSOLIDATED_BIO_SLUGS = new Set<string>([
  'pug-alex-williams', // → alex-williams ("Alex Williams (Pug)")
  'baby-reni',         // → irene-ha ("Baby Reni (Irene Ha)")
]);

// Build stub entries for residents not in artists-data.json so their pages are generated.
// Name and bio are fetched from Sanity at page render time.
const residentArtists: Artist[] = Array.from(BIO_SLUGS)
  .filter(slug => !artistsFromData.find(a => a.slug === slug) && !CONSOLIDATED_BIO_SLUGS.has(slug))
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

