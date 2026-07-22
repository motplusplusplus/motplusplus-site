import { getTrashItems } from '@/lib/sanity';
import TrashPageShell from './TrashPageShell';
import type { TrashItem } from '@/lib/demoTrashItems';

export default async function TrashPage() {
  const raw = await getTrashItems();

  const items: TrashItem[] = raw.map((r: any) => ({
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
    // price is deliberately NOT serialized into the static export -- it would
    // otherwise ship in the public HTML/flight payload where anyone could read
    // it regardless of the seven-click password. The worker (POST /api/pricelist)
    // delivers prices only after a server-side check; TrashPageShell merges them
    // in on unlock.
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
