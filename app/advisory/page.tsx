import type { Metadata } from "next";
import Link from "next/link";
import { CONTACTS } from "@/lib/contacts";
import { ogImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "+1 art advisory | art collection advisory, ho chi minh city",
  description:
    "+1 art advisory helps private collectors and foundations build, manage, and grow collections rooted in contemporary practice from vietnam and southeast asia.",
  openGraph: {
    title: "+1 art advisory | art collection advisory, ho chi minh city",
    description:
      "+1 art advisory helps private collectors and foundations build, manage, and grow collections rooted in contemporary practice from vietnam and southeast asia.",
    url: "https://motplusplusplus.com/advisory",
    images: [ogImage(undefined, "MoT+++")],
  },
  twitter: {
    card: "summary_large_image",
    title: "+1 art advisory | art collection advisory, ho chi minh city",
    description:
      "+1 art advisory helps private collectors and foundations build, manage, and grow collections rooted in contemporary practice from vietnam and southeast asia.",
    images: [ogImage(undefined, "MoT+++").url],
  },
  alternates: { canonical: "https://motplusplusplus.com/advisory" },
};

export default function AdvisoryPage() {
  return (
    <>
      {/* hero */}
      <div
        style={{
          width: "100%",
          height: "50vh",
          minHeight: "320px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <p style={{ fontSize: "12px", color: "#767676", letterSpacing: "0.08em" }}>
          +1 art advisory — image
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

        {/* heading */}
        <div style={{ maxWidth: "800px", marginBottom: "80px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "32px",
            }}
          >
            +1 art advisory
          </h1>
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "20px" }}>
            program
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", marginBottom: "20px", maxWidth: "640px" }}>
            advisory for building and managing art collections.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", maxWidth: "640px" }}>
            MoT+++ works with private collectors and foundations to develop, manage, and grow art collections rooted in
            contemporary practice from Vietnam and the broader Southeast Asian region.
          </p>
        </div>

        {/* clients */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "80px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "40px" }}>
            clients
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "32px",
            }}
          >
            {[
              {
                name: "Post Vidai",
                img: "https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/advisory/post-vidai.jpg",
              },
              {
                name: "The Nguyen Art Foundation",
                img: "https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/advisory/nguyen-art-foundation.jpg",
              },
            ].map((c) => (
              <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    overflow: "hidden",
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  <img
                    src={c.img}
                    alt={c.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 300, color: "#444444" }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* contact */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "24px" }}>
            inquiries
          </p>
          <a
            href={`mailto:${CONTACTS.general}?subject=art advisory inquiry`}
            style={{
              display: "inline-block",
              fontSize: "14px",
              color: "#111111",
              borderBottom: "1px solid #111111",
              paddingBottom: "2px",
            }}
          >
            {CONTACTS.general}
          </a>
        </div>

      </div>
    </>
  );
}
