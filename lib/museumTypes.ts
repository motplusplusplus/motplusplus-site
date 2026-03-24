export type AccessType = 'open' | 'appointment' | 'phone' | 'introduction' | 'hours' | 'other';

export type MuseumLocation = {
  _id: string;
  title: string;
  artist: string;
  medium?: string;
  year?: number;
  dateAdded?: string;
  description?: string;
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
