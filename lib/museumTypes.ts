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
  isPast?: boolean;     // true for past site-specific installations (still shown in the collection, filtered by current/past)
  _demo?: boolean;
  trashItemId?: string; // first active +1 trash item referencing this location, if the work is also available for acquisition
};

/** Placeholder shape for a future per-visitor visit state (logging visits,
 *  rewards, etc. -- none of it built yet). Location components accept an
 *  optional `visit` prop of this type so wiring real visit data in later is
 *  additive, not a rewrite. */
export type LocationVisit = {
  visited?: boolean;
  visitedAt?: string;
};
