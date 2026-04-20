import MuseumMapWrapper from '@/components/MuseumMapWrapper';
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "+1 museum by any other name | contemporary art museum, ho chi minh city",
  description:
    "The only contemporary art museum in Ho Chi Minh City without walls. MoT+++ places artworks across Saigon — in private homes, businesses, and studios — treating the city itself as its architecture. The collection is real, documented, and curated.",
  keywords: [
    "art museum ho chi minh city",
    "contemporary art museum saigon",
    "art museum vietnam",
    "contemporary art hcmc",
    "saigon art museum",
    "MoT+++",
    "+1 museum",
    "contemporary art space vietnam",
  ],
  openGraph: {
    title: "+1 museum by any other name | contemporary art museum, ho chi minh city",
    description: "The only contemporary art museum in Ho Chi Minh City without walls. Artworks placed across Saigon in private homes, businesses, and studios.",
    url: "https://motplusplusplus.com/museum",
  },
  alternates: { canonical: "https://motplusplusplus.com/museum" },
};

export default function MuseumPage() {
  return (
    <>
      {/* page title */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 32px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em",
          marginBottom: "16px",
        }}>
          +1 museum by any other name
        </h1>
        <p style={{ fontSize: "13px", color: "#999999", letterSpacing: "0.06em", lineHeight: 1.8 }}>
          mot | mót | hoard
        </p>
        <p style={{ fontSize: "14px", color: "#888888", marginTop: "8px" }}>
          hosting one work, in one place anywhere in the world
        </p>
      </div>

      {/* interactive map + description (rendered inside MuseumMap component) */}
      <MuseumMapWrapper />

      {/* hosting CTA */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 96px", borderTop: "1px solid #e5e5e5" }}>
        <p style={{ fontSize: "15px", color: "#444444", maxWidth: "480px", lineHeight: 1.7, marginBottom: "24px" }}>
          interested in hosting a work in your space — anywhere in the world.
        </p>
        <Link
          href="/museum/inquire"
          style={{
            display: "inline-block",
            fontSize: "15px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "14px 32px",
            textDecoration: "none",
          }}
        >
          inquire about hosting
        </Link>
      </div>
    </>
  );
}
