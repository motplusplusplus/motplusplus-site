import Link from "next/link";
import { studios, hotel } from "@/lib/studios";

export default function StudiosPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      <div style={{ marginBottom: "56px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}
        >
          studios
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "520px", lineHeight: 1.7 }}>
          each studio is hosted by a working artist. residents live and work
          alongside them, making collaborative work in the city.
        </p>
      </div>

      {/* studio cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "48px",
          marginBottom: "80px",
        }}
      >
        {studios.map((studio) => (
          <div key={studio.slug}>
            {/* card image placeholder */}
            <Link href={`/afarm/studios/${studio.slug}`}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/2",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  cursor: "pointer",
                }}
              >
                <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                  {studio.artistName} — studio photo
                </p>
              </div>
            </Link>

            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "8px" }}>
              {studio.neighborhood}
              {studio.collectiveMember && (
                <span style={{ marginLeft: "12px", color: "#bbbbbb" }}>
                  mot+++ collective
                </span>
              )}
            </p>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 400,
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              <Link href={`/afarm/studios/${studio.slug}`} style={{ color: "#111111" }}>
                {studio.artistName}
              </Link>
            </h2>
            <p style={{ fontSize: "14px", color: "#666666", marginBottom: "20px", lineHeight: 1.5 }}>
              {studio.tagline}
            </p>

            <Link
              href={`/afarm/apply?studio=${studio.slug}`}
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: "#111111",
                border: "1px solid #cccccc",
                padding: "10px 20px",
                display: "inline-block",
              }}
            >
              inquire about this studio
            </Link>
          </div>
        ))}

        {/* hotel card — listed last */}
        <div key={hotel.slug}>
          <Link href="/afarm/hotel">
            <div
              style={{
                width: "100%",
                aspectRatio: "3/2",
                backgroundColor: "#f0f0f0",
                border: "1px solid #e5e5e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                Amanaki Thao Dien Hotel — photo
              </p>
            </div>
          </Link>

          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "8px" }}>
            thảo điền — hotel track
          </p>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 400,
              marginBottom: "8px",
              lineHeight: 1.2,
            }}
          >
            <Link href="/afarm/hotel" style={{ color: "#111111" }}>
              {hotel.name}
            </Link>
          </h2>
          <p style={{ fontSize: "14px", color: "#666666", marginBottom: "20px", lineHeight: 1.5 }}>
            {hotel.tagline}
          </p>

          <Link
            href="/afarm/apply?studio=amanaki"
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "#111111",
              border: "1px solid #cccccc",
              padding: "10px 20px",
              display: "inline-block",
            }}
          >
            inquire about hotel track
          </Link>
        </div>
      </div>

    </div>
  );
}
