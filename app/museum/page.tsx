import MuseumMapWrapper from '@/components/MuseumMapWrapper';

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
    </>
  );
}
