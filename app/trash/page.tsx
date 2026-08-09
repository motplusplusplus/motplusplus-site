import type { Metadata } from 'next';
import { getTrashItems } from '@/lib/sanity';
import TrashPageShell from './TrashPageShell';
import type { TrashItem } from '@/lib/demoTrashItems';
import { shuffleArray } from '@/lib/shuffle';
import { ogImage } from '@/lib/og';

export const metadata: Metadata = {
  title: '+1 trash ♻ | artworks for acquisition, ho chi minh city',
  description:
    'works consigned directly by artists through +1 trash, the acquisition program of MoT+++ in ho chi minh city. browse available and sold works, inquire by email.',
  openGraph: {
    title: '+1 trash ♻ | artworks for acquisition, ho chi minh city',
    description:
      'works consigned directly by artists through +1 trash, the acquisition program of MoT+++ in ho chi minh city.',
    url: 'https://motplusplusplus.com/trash',
    images: [ogImage(undefined, 'MoT+++')],
  },
  twitter: {
    card: 'summary_large_image',
    title: '+1 trash ♻ | artworks for acquisition, ho chi minh city',
    description:
      'works consigned directly by artists through +1 trash, the acquisition program of MoT+++ in ho chi minh city.',
    images: [ogImage(undefined, 'MoT+++').url],
  },
  alternates: { canonical: 'https://motplusplusplus.com/trash' },
};

export default async function TrashPage() {
  const raw = await getTrashItems();

  const canonical: TrashItem[] = raw.map((r: any, i: number) => ({
    _id: r._id,
    artist: r.artist,
    artistSlug: r.artistSlug ?? null,
    artists: (r.artists ?? []).filter(Boolean),
    slug: r.slug,
    title: r.title ?? '',
    medium: r.medium ?? '',
    year: r.year ?? 0,
    dimensions: r.dimensions ?? '',
    edition: r.edition ?? '',
    description: r.description ?? '',
    images: [...(r.directImageUrls ?? []), ...(r.legacyImageUrls ?? [])],
    museumLocationId: r.museumLocationId,
    neighbourhood: r.neighbourhood,
    sold: r.sold ?? false,
    // "date added" sort key: index in the canonical Sanity order
    // (sortOrder asc, artist asc), preserved across the shuffle below.
    orderIndex: i,
    // price is deliberately NOT serialized into the static export -- it would
    // otherwise ship in the public HTML/flight payload where anyone could read
    // it regardless of the seven-click password. The worker (POST /api/pricelist)
    // delivers prices only after a server-side check; TrashPageShell merges them
    // in on unlock.
  }));

  // Shuffle and pick each card's image at build time, not after hydration:
  // the static HTML then paints the full grid immediately (no empty first
  // paint, no post-hydration scramble). The order changes with every deploy,
  // which content publishes trigger every few minutes anyway. Randomness in a
  // server component is impure by the lint rule's standard, but this page is
  // statically exported exactly once per build, and the rolled values ship in
  // the flight payload, so server HTML and hydration always agree.
  // eslint-disable-next-line react-hooks/purity
  const items = shuffleArray(canonical).map(item => ({
    ...item,
    cardImageIndex:
      // eslint-disable-next-line react-hooks/purity
      item.images.length > 1 ? Math.floor(Math.random() * item.images.length) : 0,
  }));

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ maxWidth: "720px", marginBottom: "48px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "32px",
        }}>
          +1 trash ♻
        </h1>

      </div>

      <TrashPageShell items={items} />
    </div>
  );
}
