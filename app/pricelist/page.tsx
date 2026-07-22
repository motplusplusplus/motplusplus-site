import { getPricelistItems } from '@/lib/sanity';
import { artistLabelFor, type TrashItem } from '@/lib/demoTrashItems';
import { compareNames } from '@/lib/sortName';
import PricelistShell, { type PricelistItem } from './PricelistShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricelist',
  robots: { index: false, follow: false },
};

export default async function PricelistPage() {
  const raw = await getPricelistItems();

  const items: PricelistItem[] = raw.map((r: any) => {
    const item: TrashItem = {
      _id: r._id,
      artist: r.artist,
      artists: (r.artists ?? []).filter(Boolean),
      title: r.title ?? '',
      medium: r.medium ?? '',
      year: r.year ?? 0,
      dimensions: r.dimensions ?? '',
      edition: r.edition ?? '',
      description: r.description ?? '',
      images: [...(r.directImageUrls ?? []), ...(r.legacyImageUrls ?? [])],
      sold: r.sold ?? false,
      price: r.price,
    };
    return {
      _id: item._id,
      artist: artistLabelFor(item),
      title: item.title,
      medium: item.medium,
      year: item.year,
      dimensions: item.dimensions,
      edition: item.edition,
      description: item.description,
      image: item.images[0] ?? null,
      // price is deliberately NOT serialized into the static export -- it would
      // otherwise ship in the public HTML/flight payload where anyone could read
      // it without the password. The worker (POST /api/pricelist) delivers prices
      // only after a server-side password check; PricelistShell merges them in.
    };
  });

  // getPricelistItems() already excludes priceless works at the query level
  // (TRASH_ITEM_PRICED in lib/sanity.ts) -- no separate filter needed here.
  const priced = [...items];
  priced.sort((a, b) => compareNames(a.artist, b.artist));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ maxWidth: '720px', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: 'clamp(28px, 3.5vw, 48px)',
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: '-0.02em', marginBottom: '16px',
        }}>
          +1 trash — pricelist
        </h1>
        <p style={{ fontSize: '13px', color: '#767676', letterSpacing: '0.04em' }}>
          internal — currently available works only
        </p>
      </div>

      <PricelistShell items={priced} />
    </div>
  );
}
