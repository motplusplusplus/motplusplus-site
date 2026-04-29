import { MetadataRoute } from 'next';
import { getAllEvents } from '@/lib/sanity';
import { BIO_SLUGS, HIDDEN_SLUGS } from '@/lib/events';
import { allArtists } from '@/lib/artists';
import { getAllStudios } from '@/lib/studios';

export const dynamic = 'force-static';

const BASE = 'https://motplusplusplus.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allEvents, allStudios] = await Promise.all([getAllEvents(), getAllStudios()]);

  const staticPages = [
    { url: `${BASE}/museum`,          priority: 1.0 },
    { url: `${BASE}/afarm`,           priority: 1.0 },
    { url: `${BASE}/afarm/studios`,   priority: 0.9 },
    { url: `${BASE}/afarm/hotel`,     priority: 0.8 },
    { url: `${BASE}/directexperience`, priority: 0.8 },
    { url: `${BASE}/events`,          priority: 0.9 },
    { url: `${BASE}/artists`,         priority: 0.8 },
    { url: `${BASE}/contemporary`,    priority: 0.7 },
    { url: `${BASE}/performance`,     priority: 0.7 },
    { url: `${BASE}/sound`,           priority: 0.7 },
    { url: `${BASE}/collective`,      priority: 0.7 },
    { url: `${BASE}/press`,           priority: 0.6 },
    { url: `${BASE}/about`,           priority: 0.6 },
    { url: `${BASE}/contact`,         priority: 0.5 },
  ].map(p => ({ ...p, changeFrequency: 'monthly' as const, lastModified: new Date() }));

  const afarmStudioPages = allStudios.filter(s => !s.hidden).map(s => ({
    url: `${BASE}/afarm/studios/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const eventPages = allEvents
    .filter(e => !HIDDEN_SLUGS.has(e.slug) && !e.slug.endsWith('-vn') && !BIO_SLUGS.has(e.slug) && !e.isBioPage)
    .map(e => ({
      url: `${BASE}/events/${e.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    }));

  const artistPages = allArtists.map(a => ({
    url: `${BASE}/artists/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...afarmStudioPages, ...eventPages, ...artistPages];
}
