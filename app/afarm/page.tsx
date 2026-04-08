import Link from "next/link";
import { studios, hotel } from "@/lib/studios";
import StudioCarousel from "@/components/StudioCarousel";

// Specific card images (overrides s.images[0] where needed)
const CARD_IMAGE_OVERRIDES: Record<string, string> = {
  "hoang-nam-viet-studio": "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/studios/hoang-nam-viet/ass05452.jpg",
};

const carouselItems = [
  ...studios.filter(s => !s.hidden).map((s) => ({
    slug: s.slug,
    name: s.artistName,
    tagline: s.tagline,
    neighborhood: s.neighborhood,
    href: `/afarm/studios/${s.slug}`,
    image: CARD_IMAGE_OVERRIDES[s.slug] ?? s.images[0] ?? undefined,
    // MoT+++ studio (karlie-ho) is pinned to bottom of shuffle
    pinned: s.slug === "karlie-ho",
  })),
  {
    slug: hotel.slug,
    name: hotel.name,
    tagline: hotel.tagline,
    neighborhood: "thảo điền — hotel track",
    href: "/afarm/hotel",
    pinned: true, // always last
  },
];

export default function AFarmPage() {
  return (
    <>
      {/* hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          minHeight: "360px",
          overflow: "hidden",
          backgroundColor: "#111111",
        }}
      >
        <img
          src="https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/studios/hoang-nam-viet/ass05503.jpg"
          alt="+a.Farm"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block", opacity: 0.72 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.82) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "clamp(24px, 4vw, 56px)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: "12px",
            }}
          >
            +a.Farm
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>
            a new model for the artist residency — vietnam
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

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

        {/* pairing notice */}
        <p
          style={{
            fontSize: "13px",
            color: "#999999",
            lineHeight: 1.7,
            maxWidth: "480px",
            marginTop: "32px",
            marginBottom: "20px",
          }}
        >
          pairings of resident with hosting artist are ultimately determined by
          a.Farm — we consider practice, timing, and fit carefully before
          confirming any placement.
        </p>

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
              output may enter the +1 museum by any other name collection.
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

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "#444444",
                marginBottom: "20px",
              }}
            >
              for artists who want the ho chi minh city residency experience
              with independence. suited to introverts or those who prefer to
              focus on their own practice.
            </p>

            <p style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.08em", marginBottom: "12px" }}>
              options
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 400, color: "#333333", marginBottom: "2px" }}>
                  Amanaki Thao Dien Hotel
                </p>
                <p style={{ fontSize: "13px", color: "#888888" }}>10 Nguyễn Đăng Giai, Thảo Điền, Thủ Đức</p>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 400, color: "#333333", marginBottom: "2px" }}>
                  Saigon Domaine
                </p>
                <p style={{ fontSize: "13px", color: "#888888" }}>Ho Chi Minh City</p>
              </div>
            </div>
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
            a weekly gathering of all current +a.Farm residents and affiliates —
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
