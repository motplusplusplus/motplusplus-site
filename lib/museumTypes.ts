export type AccessType = 'open' | 'appointment' | 'phone' | 'introduction' | 'hours' | 'other';

export type MuseumLocation = {
  _id: string;
  title: string;
  vnTitle?: string;
  artist: string;
  artistSlug?: string;
  medium?: string;
  year?: number;
  dateAdded?: string;   // demo data only — the real Sanity schema has no such field
  createdAt?: string;   // Sanity _createdAt (ISO); absent on demo entries
  featured?: boolean;   // editor-curated "featured works" rail (optional schema field)
  description?: string;
  vnDescription?: string;
  accessType: AccessType;
  accessDetails?: string;
  hours?: string;
  contactMethod?: string;
  hostName?: string;
  neighbourhood?: string;
  coordinates: { lat: number; lng: number };
  mainImage?: string;
  images?: string[];
  isPast?: boolean;     // true for past site-specific installations (still shown in view all, filtered by current/past)
  _demo?: boolean;
  trashItemId?: string; // links to a +1 trash item, if this work is also available for acquisition
};
