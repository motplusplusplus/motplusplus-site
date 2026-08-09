'use client';

import type { MuseumLocation, LocationVisit } from '@/lib/museumTypes';

type Props = {
  location: MuseumLocation;
  /** Future visit state (see LocationVisit in lib/museumTypes) -- accepted now
   *  so later visit features slot in without reshaping any caller. Unused
   *  fields render nothing today. */
  visit?: LocationVisit;
  /** compact = side panel / lightbox scale, large = expanded full-screen entry */
  size?: 'compact' | 'large';
};

/** The labeled how-to-visit field list (neighborhood, host, hours, access,
 *  contact) shared by the map side panel, the collection lightbox, and the
 *  expanded entry view. One source so the three surfaces can never drift. */
export default function LocationDetails({ location, visit, size = 'compact' }: Props) {
  const valueSize = size === 'large' ? '14px' : '13px';
  const gap = size === 'large' ? '18px' : '12px';
  const rows: { label: string; value: string }[] = [];

  if (location.neighbourhood) rows.push({ label: 'neighbourhood', value: location.neighbourhood });
  if (location.hostName) rows.push({ label: 'hosted by', value: location.hostName });
  if (location.hours) rows.push({ label: 'hours', value: location.hours });
  if (location.accessDetails) rows.push({ label: 'how to visit', value: location.accessDetails });
  if (location.contactMethod) rows.push({ label: 'contact', value: location.contactMethod });
  if (visit?.visited) rows.push({ label: 'your visit', value: visit.visitedAt ?? 'visited' });

  if (rows.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid #eeeeee', paddingTop: size === 'large' ? '24px' : '16px', display: 'flex', flexDirection: 'column', gap }}>
      {rows.map(row => (
        <div key={row.label}>
          <p style={{ fontSize: '10px', color: '#999999', letterSpacing: '0.08em', marginBottom: '3px' }}>
            {row.label}
          </p>
          <p style={{ fontSize: valueSize, color: '#444444', fontWeight: 300, lineHeight: 1.65 }}>
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
