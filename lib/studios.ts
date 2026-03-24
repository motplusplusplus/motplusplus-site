import studiosRaw from '../studios-data.json';
import type { Event } from './events';

export type StudioPractical = {
  floor:            string | null;
  size:             number | null;
  naturalLight:     boolean | null;
  ac:               boolean | null;
  bathrooms:        number | null;
  privateBathroom:  boolean | null;
  kitchenAccess:    boolean | null;
  internet:         boolean | null;
  petsInResidence:  boolean | null;
  petsAllowed:      boolean | null;
  laundry:          boolean | null;
};

export type StudioEntry = {
  slug:             string;
  name:             string;
  hostSlug:         string | null;
  address:          string;
  neighborhood:     string;
  description:      string;
  active:           boolean;
  note:             string;
  images:           string[];
  locationKeywords: string[];
  mapLat:           number | null;
  mapLng:           number | null;
  practical:        StudioPractical;
  tagline?:         string;
  collectiveMember?: boolean;
};

export const allStudios: StudioEntry[] = studiosRaw as StudioEntry[];

/** Alias for backward compat — adds artistName and tagline aliases */
export const studios = allStudios.map(s => ({
  ...s,
  artistName: s.name,
  tagline: s.tagline ?? s.neighborhood,
}));

/** Hotel entry sourced inline (no longer in studios-data.json) */
export const hotel = {
  slug: 'amanaki',
  name: 'Amanaki Thao Dien Hotel',
  tagline: 'hotel track — independence and focus',
  address: '10 Nguyễn Đăng Giai, Thảo Điền, Thủ Đức',
};

export function getStudio(slug: string): StudioEntry | undefined {
  return allStudios.find(s => s.slug === slug);
}

export function getStudioSlugs(): string[] {
  return allStudios.map(s => s.slug);
}

export function getStudioEvents(studio: StudioEntry, events: Event[]): Event[] {
  const keywords = studio.locationKeywords.map(k => k.toLowerCase());
  if (keywords.length === 0) return [];
  return events.filter(evt => {
    const haystack = (evt.title + ' ' + evt.slug + ' ' + (evt.location || '')).toLowerCase();
    return keywords.some(k => haystack.includes(k));
  }).sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
