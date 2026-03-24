import { MetadataRoute } from 'next';
import { allEvents, BIO_SLUGS, HIDDEN_SLUGS } from '@/lib/events';
import { allArtists } from '@/lib/artists';
import { allStudios } from '@/lib/studios';

export const dynamic = 'force-static';

const BASE = 'https://motplusplus.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE, priority: 1.0 },
    { url: `${BASE}/events`, priority: 0.9 },
    { url: `${BASE}/residents`, priority: 0.9 },
    { url: `${BASE}/artists`, priority: 0.8 },
    { url: `${BASE}/afarm`, priority: 0.8 },
    { url: `${BASE}/studios`, priority: 0.7 },
    { url: `${BASE}/contemporary`, priority: 0.7 },
    { url: `${BASE}/performance`, priority: 0.7 },
    { url: `${BASE}/sound`, priority: 0.7 },
    { url: `${BASE}/museum`, priority: 0.7 },
    { url: `${BASE}/about`, priority: 0.6 },
    { url: `${BASE}/press`, priority: 0.6 },
    { url: `${BASE}/contact`, priority: 0.5 },
  ].map(p => ({ ...p, changeFrequency: 'monthly' as const, lastModified: new Date() }));

  const eventPages = allEvents
    .filter(e => !HIDDEN_SLUGS.has(e.slug) && !e.slug.endsWith('-vn'))
    .map(e => ({
      url: BIO_SLUGS.has(e.slug)
        ? `${BASE}/residents/${e.slug}`
        : `${BASE}/events/${e.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: BIO_SLUGS.has(e.slug) ? 0.7 : 0.6,
    }));

  const artistPages = allArtists
    .filter(a => !BIO_SLUGS.has(a.slug))
    .map(a => ({
      url: `${BASE}/artists/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    }));

  const studioPages = allStudios.map(s => ({
    url: `${BASE}/studios/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...artistPages, ...studioPages];
}
