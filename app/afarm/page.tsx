import Link from "next/link";
import { studios, hotel } from "@/lib/studios";
import StudioCarousel from "@/components/StudioCarousel";

const carouselItems = [
  ...studios.map((s) => ({
    slug: s.slug,
    name: s.artistName,
    tagline: s.tagline,
    neighborhood: s.neighborhood,
    href: `/afarm/studios/${s.slug}`,
  })),
  {
    slug: hotel.slug,
    name: hotel.name,
    tagline: hotel.tagline,
    neighborhood: "thảo điền — hotel track",
    href: "/afarm/hotel",
  },
];

export default function AFarmPage() {
  return (
    <>
      {/* hero image placeholder */}
      <div
        style={{
          width: "100%",
          height: "55vh",
          minHeight: "360px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          +a. farm — hero image
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

        {/* heading */}
        <h1
          style={{
            fontSize: "clamp(36px, 4vw, 56px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "24px",
          }}
        >
          +a. farm
        </h1>
        <p
          style={{
            fontSize: "18px",
            fontWeight: 300,
            color: "#555555",
            marginBottom: "72px",
            maxWidth: "640px",
          }}
        >
          a new model for the artist residency — ho chi minh city
        </p>

        {/* studio carousel */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "16px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            studios &amp; accommodation
          </p>
          <div style={{ maxWidth: "560px" }}>
            <StudioCarousel items={carouselItems} />
          </div>
        </div>

        {/* view studios link */}
        <div style={{ marginBottom: "80px" }}>
          <Link
            href="/afarm/studios"
            style={{
              fontSize: "13px",
              color: "#888888",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "2px",
            }}
          >
            view all studios →
          </Link>
        </div>

        {/* two tracks */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "64px",
            marginBottom: "80px",
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          {/* studio track */}
          <div>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              studio track
            </p>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 300,
                marginBottom: "20px",
                lineHeight: 1.2,
              }}
            >
              live and work with an artist
            </h2>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#444444",
                marginBottom: "16px",
              }}
            >
              the resident lives and works directly alongside a hosting artist in
              their studio, making collaborative work together. collaborative
              output may enter the plus one museum collection.
            </p>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#444444",
              }}
            >
              you are paying to work <em>with</em> artists — not simply to be
              near them. this is a program for artists who want genuine
              exchange.
            </p>
          </div>

          {/* hotel track */}
          <div>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              hotel track
            </p>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 300,
                marginBottom: "20px",
                lineHeight: 1.2,
              }}
            >
              independence in the city
            </h2>

            {/* hotel image placeholder */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                backgroundColor: "#f5f5f5",
                border: "1px solid #e5e5e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
                Amanaki Thao Dien Hotel
              </p>
            </div>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#444444",
                marginBottom: "16px",
              }}
            >
              Amanaki Thao Dien Hotel, for artists who want the ho chi minh
              city residency experience with independence. suited to
              introverts or those who prefer to focus on their own practice.
            </p>
            <p style={{ fontSize: "13px", color: "#888888" }}>
              10 Nguyễn Đăng Giai, Thảo Điền, Thủ Đức
            </p>
          </div>
        </div>

        {/* heartalk */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "80px",
            maxWidth: "720px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            heARTalk
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444" }}>
            a weekly gathering of all current +a. farm residents and affiliates —
            an open discussion period to explore what resources the community can
            bring to support artistic endeavors. in-person, based in ho chi minh
            city.
          </p>
        </div>

        {/* fees */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "80px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            fees
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 300,
              marginBottom: "16px",
              letterSpacing: "-0.01em",
            }}
          >
            USD $3,000 / month
          </p>
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.8, maxWidth: "480px" }}>
            one month minimum. extensions available at the same rate.
            no refunds. inquiries are welcome — commitments are firm.
          </p>
        </div>

        {/* cta */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
          <Link
            href="/afarm/studios"
            style={{
              display: "inline-block",
              fontSize: "15px",
              fontWeight: 400,
              color: "#111111",
              border: "1px solid #111111",
              padding: "14px 32px",
              marginRight: "24px",
              marginBottom: "16px",
            }}
          >
            view studios
          </Link>
          <Link
            href="/afarm/apply"
            style={{
              display: "inline-block",
              fontSize: "15px",
              fontWeight: 400,
              color: "#ffffff",
              backgroundColor: "#111111",
              padding: "14px 32px",
              marginBottom: "16px",
            }}
          >
            inquire
          </Link>
        </div>

      </div>
    </>
  );
}
