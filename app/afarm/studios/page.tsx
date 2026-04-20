import Link from "next/link";
import { getAllStudios, hotel } from "@/lib/studios";

export default async function StudiosPage() {
  const allStudios = await getAllStudios();
  const studios = allStudios.filter(s => !s.hidden && s.active);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      <div style={{ marginBottom: "56px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "16px",
        }}>
          studios
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "520px", lineHeight: 1.7 }}>
          each studio is hosted by a working artist. residents live and work
          alongside them, making work in the city.
        </p>
      </div>

      {/* studio list */}
      <div style={{ borderTop: "1px solid #e5e5e5" }}>
        {studios.map((studio) => (
          <div key={studio.slug} style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: "24px",
            borderBottom: "1px solid #e5e5e5",
            padding: "28px 0",
          }}>
            <div>
              <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "6px" }}>
                {studio.neighborhood}
                {studio.collectiveMember && (
                  <span style={{ marginLeft: "12px", color: "#bbbbbb" }}>mot+++ collective</span>
                )}
              </p>
              <h2 style={{ fontSize: "20px", fontWeight: 300, marginBottom: studio.artistName !== studio.name ? "2px" : "4px", lineHeight: 1.2 }}>
                <Link href={`/afarm/studios/${studio.slug}`} style={{ color: "#111111" }}>
                  {studio.name}
                </Link>
              </h2>
              {studio.artistName !== studio.name && (
                <p style={{ fontSize: "13px", color: "#888888", marginBottom: "0px" }}>{studio.artistName}</p>
              )}
            </div>

            <Link
              href={`/afarm/apply?studio=${studio.slug}`}
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "#111111",
                border: "1px solid #cccccc",
                padding: "10px 20px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              inquire
            </Link>
          </div>
        ))}

        {/* hotel row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "24px",
          borderBottom: "1px solid #e5e5e5",
          padding: "28px 0",
        }}>
          <div>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "6px" }}>
              thảo điền — hotel track
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: 300, marginBottom: "4px", lineHeight: 1.2 }}>
              <Link href="/afarm/hotel" style={{ color: "#111111" }}>
                {hotel.name}
              </Link>
            </h2>
            <p style={{ fontSize: "13px", color: "#888888" }}>{hotel.tagline}</p>
          </div>

          <Link
            href="/afarm/apply?studio=amanaki"
            style={{
              fontSize: "12px",
              fontWeight: 400,
              color: "#111111",
              border: "1px solid #cccccc",
              padding: "10px 20px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            inquire
          </Link>
        </div>
      </div>

    </div>
  );
}
