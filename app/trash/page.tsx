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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "32px" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>hours</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              Tuesday &amp; Friday<br />
              6 – 9 pm<br />
              open by appointment
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>location</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              Saigon Domaine, ground floor<br />
              1057 Binh Quoi, Ward 28<br />
              Binh Thanh, Ho Chi Minh City
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>contact</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              <a href="tel:+84904497769" style={{ color: "#444444" }}>+84 90 4497 769</a><br />
              <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#444444" }}>motplusplusplus@gmail.com</a>
            </p>
          </div>
        </div>
      </div>

      <TrashPageShell items={items} />
    </div>
  );
}
