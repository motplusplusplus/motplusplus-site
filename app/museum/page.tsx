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

      {/* interactive map placeholder */}
      <div style={{
        width: "100%", height: "60vh", minHeight: "400px",
        backgroundColor: "#f0f0f0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "12px",
        borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5",
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#cccccc" strokeWidth="1.5">
          <circle cx="16" cy="14" r="5" />
          <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" />
        </svg>
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          interactive map — phase 2
        </p>
        <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.04em" }}>
          works placed across ho chi minh city
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* description */}
        <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
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
            +1 museum by any other name is coming. in the meantime, get in touch at{" "}
            <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#666666" }}>motplusplusplus@gmail.com</a>.
          </p>
        </div>

      </div>
    </>
  );
}
