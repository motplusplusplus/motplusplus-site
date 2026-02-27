import Link from "next/link";
import { studios } from "@/lib/studios";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return studios.map((s) => ({ slug: s.slug }));
}

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = studios.find((s) => s.slug === slug);
  if (!studio) notFound();

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* breadcrumb + header */}
      <div style={{ marginBottom: "64px" }}>
        <p style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em", marginBottom: "16px" }}>
          <Link href="/afarm/studios" style={{ color: "#999999" }}>studios</Link>
          {" / "}
          {studio.neighborhood}
          {studio.collectiveMember && (
            <span style={{ marginLeft: "12px" }}>
              ·{" "}
              <Link href="/collective" style={{ color: "#999999" }}>
                mot+++ collective member
              </Link>
            </span>
          )}
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "12px",
        }}>
          {studio.artistName}
        </h1>
        <p style={{ fontSize: "16px", color: "#666666", fontWeight: 300 }}>
          {studio.tagline}
        </p>
      </div>

      {/* inquire CTA */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{
          fontSize: "15px", marginBottom: "24px",
          color: "#444444", maxWidth: "480px", lineHeight: 1.7,
        }}>
          interested in this studio? get in touch and tell us about your
          practice and what you hope to make in ho chi minh city.
        </p>
        <Link
          href={`/afarm/apply?studio=${studio.slug}`}
          style={{
            display: "inline-block",
            fontSize: "15px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "14px 32px",
          }}
        >
          inquire about this studio
        </Link>
      </div>

    </div>
  );
}
