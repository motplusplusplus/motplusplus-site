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

      {/* interactive map */}
      <MuseumMapWrapper />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ maxWidth: "720px" }}>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            ho chi minh city has no contemporary art museum. this is not a complaint so much as an observation that creates a certain kind of opening.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            +1 museum by any other name is a decentralized collection sited across the city, in private homes, businesses, studios, and public spaces. the works are real, documented, and curated. what is unconventional is where they live and what it takes to see them. each work has its own location, its own host, and its own conditions of access: some are freely visible, others require a phone call, an introduction, a time of day. the platform maps all of this and tells you what you need to know to get there.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            navigating the collection means navigating the city. someone might plan an afternoon across several works in different neighborhoods, or discover a piece while already somewhere else entirely. the map is the floor plan. the city is the building.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "32px" }}>
            works enter the collection through artists, through collectors who open their spaces, and through the a. farm residency program. the collection grows as the network does.
          </p>
          <p style={{ fontSize: "14px", color: "#888888", lineHeight: 1.8 }}>
            get in touch at{" "}
            <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#666666" }}>motplusplusplus@gmail.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
