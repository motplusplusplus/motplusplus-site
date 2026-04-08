import studiosRaw from '../studios-data.json';
import type { Event } from './events';
import { getAfarmHosts, getAfarmHostBySlug } from './sanity';

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

export type StudioProfile = {
  studioName?:          string;
  portrait?:            string;
  walkthroughVideoUrl?: string;
  workImages?:          string[];
  practiceBio?:         string;
  welcomeBio?:          string;
  collaboration?:       string;
  languages?:           string[];
  availability?:        string;
  neighbourhood?:       string;
  environment?:         string;
  transport?:           string;
  amenities?:           string;
  livingArrangement?:   string;
  residentRoom?:        string;
  smoking?:             boolean;
  smokingDetail?:       string;
  guests?:              boolean;
  guestsDetail?:        string;
  rules?:               string;
};

export type StudioEntry = {
  slug:             string;
  name:             string;
  hostSlug:         string | null;
  address:          string;
  neighborhood:     string;
  description:      string;
  active:           boolean;
  hidden?:          boolean;
  note:             string;
  images:           string[];
  locationKeywords: string[];
  mapLat:           number | null;
  mapLng:           number | null;
  practical:        StudioPractical;
  tagline?:         string;
  collectiveMember?: boolean;
  profile?:         StudioProfile;
  profileVi?:       StudioProfile;
};

// JSON supplement: fields not stored in Sanity (hostSlug, locationKeywords)
type JsonSupplement = { hostSlug: string | null; locationKeywords: string[] };
const jsonSupplements: Record<string, JsonSupplement> = {};
for (const s of studiosRaw as Array<{ slug: string; hostSlug?: string | null; locationKeywords?: string[] }>) {
  jsonSupplements[s.slug] = {
    hostSlug: s.hostSlug ?? null,
    locationKeywords: s.locationKeywords ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanityToStudioEntry(raw: any): StudioEntry {
  const supplement = jsonSupplements[raw.slug] ?? { hostSlug: null, locationKeywords: [] };

  const hasProfile = !!(
    raw.practiceBio || raw.welcomeBio || raw.collaboration ||
    raw.languages?.length || raw.availability || raw.environment ||
    raw.transport || raw.amenities || raw.livingArrangement ||
    raw.residentRoom || raw.smoking !== undefined ||
    raw.guests !== undefined || raw.rules
  );

  const profile: StudioProfile | undefined = hasProfile ? {
    studioName:        raw.studioName,
    portrait:          raw.portrait ?? undefined,
    practiceBio:       raw.practiceBio,
    welcomeBio:        raw.welcomeBio,
    collaboration:     raw.collaboration,
    languages:         raw.languages,
    availability:      raw.availability,
    neighbourhood:     raw.neighbourhood,
    environment:       raw.environment,
    transport:         raw.transport,
    amenities:         raw.amenities,
    livingArrangement: raw.livingArrangement,
    residentRoom:      raw.residentRoom,
    smoking:           raw.smoking,
    smokingDetail:     raw.smokingDetail,
    guests:            raw.guests,
    guestsDetail:      raw.guestsDetail,
    rules:             raw.rules,
  } : undefined;

  const hasProfileVi = !!(
    raw.practiceBioVi || raw.welcomeBioVi || raw.collaborationVi ||
    raw.languagesVi?.length || raw.availabilityVi
  );

  const profileVi: StudioProfile | undefined = hasProfileVi ? {
    studioName:        raw.studioName,
    practiceBio:       raw.practiceBioVi,
    welcomeBio:        raw.welcomeBioVi,
    collaboration:     raw.collaborationVi,
    languages:         raw.languagesVi,
    availability:      raw.availabilityVi,
    neighbourhood:     raw.neighbourhood,
    environment:       raw.environmentVi,
    transport:         raw.transportVi,
    amenities:         raw.amenitiesVi,
    livingArrangement: raw.livingArrangementVi,
    residentRoom:      raw.residentRoomVi,
    smoking:           raw.smoking,
    guests:            raw.guests,
    rules:             raw.rulesVi,
  } : undefined;

  // Combine Sanity-native uploaded images + R2 URL images
  const images: string[] = [
    ...(raw.uploadedImageUrls ?? []),
    ...(raw.imageUrls ?? []),
  ];

  return {
    slug:             raw.slug,
    name:             raw.studioName || raw.name,
    hostSlug:         supplement.hostSlug,
    address:          '',
    neighborhood:     raw.neighbourhood ?? '',
    description:      '',
    active:           raw.visibility === 'visible' || raw.visibility === 'historical',
    hidden:           raw.visibility === 'hidden',
    note:             '',
    images,
    locationKeywords: supplement.locationKeywords,
    mapLat:           raw.mapLat ?? null,
    mapLng:           raw.mapLng ?? null,
    practical: {
      floor:           raw.floor ?? null,
      size:            null,
      naturalLight:    null,
      ac:              raw.ac ?? null,
      bathrooms:       raw.bathrooms ?? null,
      privateBathroom: raw.privateBathroom ?? null,
      kitchenAccess:   raw.kitchenAccess ?? null,
      internet:        raw.internet ?? null,
      petsInResidence: raw.petsInResidence ?? null,
      petsAllowed:     null,
      laundry:         raw.laundry ?? null,
    },
    profile,
    profileVi,
  };
}

export async function getAllStudios(): Promise<StudioEntry[]> {
  const raw = await getAfarmHosts();
  return (raw as any[]).map(sanityToStudioEntry);
}

export async function getStudio(slug: string): Promise<StudioEntry | undefined> {
  const raw = await getAfarmHostBySlug(slug);
  return raw ? sanityToStudioEntry(raw) : undefined;
}

export async function getStudioSlugs(): Promise<string[]> {
  const studios = await getAllStudios();
  return studios.map(s => s.slug);
}

// ─── Backward-compatible sync exports (afarm/* pages still use these) ─────────
// These read from studios-data.json directly (no Sanity fetch needed at build time
// for the afarm-internal pages).
export const allStudios: StudioEntry[] = (studiosRaw as StudioEntry[]);

export const studios = allStudios.map(s => ({
  ...s,
  artistName: s.name,
  tagline: s.tagline ?? s.neighborhood,
}));

export const hotel = {
  slug: 'amanaki',
  name: 'Amanaki Thao Dien Hotel',
  tagline: 'hotel track — independence and focus',
  address: '10 Nguyễn Đăng Giai, Thảo Điền, Thủ Đức',
};

export function getStudioEvents(studio: StudioEntry, events: Event[]): Event[] {
  const keywords = studio.locationKeywords.map(k => k.toLowerCase());
  if (keywords.length === 0) return [];
  return events.filter(evt => {
    const haystack = (evt.title + ' ' + evt.slug + ' ' + (evt.location || '')).toLowerCase();
    return keywords.some(k => haystack.includes(k));
  }).sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
