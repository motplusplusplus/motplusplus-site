import Link from "next/link";
import { hotel } from "@/lib/studios";

const imagePlaceholders = Array.from({ length: 12 }, (_, i) => i + 1);

export default function HotelPage() {
  return (
    <>
      {/* hero image */}
      <div
        style={{
          width: "100%",
          height: "65vh",
          minHeight: "400px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          Amanaki Thao Dien Hotel — hero image
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* header */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em", marginBottom: "12px" }}>
            <Link href="/afarm/studios" style={{ color: "#999999" }}>studios</Link>
            {" / "}
            thảo điền — hotel track
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "16px",
            }}
          >
            {hotel.name}
          </h1>
          <p style={{ fontSize: "16px", color: "#666666", fontWeight: 300 }}>
            {hotel.tagline}
          </p>
        </div>

        {/* description */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "64px",
            marginBottom: "72px",
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <div>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              about the hotel
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", marginBottom: "16px" }}>
              Amanaki Thao Dien Hotel offers artists the ho chi minh city
              residency experience with full independence. suited to introverts
              or those who prefer to focus on their own practice.
            </p>
            <p style={{ fontSize: "13px", color: "#888888" }}>
              {hotel.address}
            </p>
          </div>

          <div>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              what's included
            </p>
            <div
              style={{
                width: "100%",
                height: "120px",
                backgroundColor: "#f8f8f8",
                border: "1px solid #eeeeee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                amenities — to be provided
              </p>
            </div>
          </div>
        </div>

        {/* image grid */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "72px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            the hotel
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {imagePlaceholders.map((n) => (
              <div
                key={n}
                style={{
                  width: "100%",
                  aspectRatio: n % 5 === 0 ? "1/1" : "4/3",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                  image {n}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* inquire CTA */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
          <p style={{ fontSize: "15px", marginBottom: "24px", color: "#444444", maxWidth: "480px", lineHeight: 1.7 }}>
            interested in the hotel track? get in touch and tell us about your
            practice and what you hope to make in ho chi minh city.
          </p>
          <Link
            href="/afarm/apply?studio=amanaki"
            style={{
              display: "inline-block",
              fontSize: "15px",
              fontWeight: 400,
              color: "#ffffff",
              backgroundColor: "#111111",
              padding: "14px 32px",
            }}
          >
            inquire about hotel track
          </Link>
        </div>

      </div>
    </>
  );
}
