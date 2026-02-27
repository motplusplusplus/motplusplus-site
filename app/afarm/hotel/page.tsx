import Link from "next/link";
import { hotel } from "@/lib/studios";

export default function HotelPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* header */}
      <div style={{ marginBottom: "64px" }}>
        <p style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em", marginBottom: "12px" }}>
          <Link href="/afarm/studios" style={{ color: "#999999" }}>studios</Link>
          {" / "}thảo điền — hotel track
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "16px",
        }}>
          {hotel.name}
        </h1>
        <p style={{ fontSize: "16px", color: "#666666", fontWeight: 300 }}>
          {hotel.tagline}
        </p>
      </div>

      {/* description */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "64px",
        marginBottom: "72px",
        borderTop: "1px solid #e5e5e5",
        paddingTop: "48px",
      }}>
        <div>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            about the hotel
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", marginBottom: "16px" }}>
            Amanaki Thao Dien Hotel offers artists the ho chi minh city residency
            experience with full independence. suited to introverts or those who prefer
            to focus on their own practice.
          </p>
          <p style={{ fontSize: "13px", color: "#888888", marginBottom: "12px" }}>
            {hotel.address}
          </p>
          <a
            href="https://www.amanaki.vn"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "#aaaaaa" }}
          >
            amanaki.vn ↗
          </a>
        </div>

        <div>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            location
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", marginBottom: "16px" }}>
            Floor 6 of the Amanaki Thao Dien Hotel is the primary site for A. Farm
            exhibitions, open studios, and events. residents in the hotel track have
            direct access to the program space and Thao Dien neighbourhood.
          </p>
          <p style={{ fontSize: "13px", color: "#888888" }}>
            Thảo Điền, Thủ Đức, Ho Chi Minh City
          </p>
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
  );
}
