import { getTrashItems } from '@/lib/sanity';
import TrashPageShell from './TrashPageShell';
import type { TrashItem } from '@/lib/demoTrashItems';

export default async function TrashPage() {
  const raw = await getTrashItems();

  const items: TrashItem[] = raw.map((r: any) => ({
    _id: r._id,
    artist: r.artist,
    title: r.title ?? '',
    medium: r.medium ?? '',
    year: r.year ?? 0,
    dimensions: r.dimensions ?? '',
    edition: r.edition ?? '',
    description: r.description ?? '',
    images: [...(r.uploadedImageUrls ?? []), ...(r.legacyImageUrls ?? [])],
    museumLocationId: r.museumLocationId,
    neighbourhood: r.neighbourhood,
    sold: r.sold ?? false,
    price: r.price,
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
