export default function Home() {
  return (
    <>
      {/* hero placeholder */}
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
        <p
          style={{
            fontSize: "12px",
            color: "#aaaaaa",
            letterSpacing: "0.08em",
          }}
        >
          interactive map — phase 2
        </p>
      </div>

      {/* content below hero */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: "640px" }}>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "40px",
            }}
          >
            +1 museum by any other name
          </h1>

          <p
            style={{
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: 1.7,
              color: "#444444",
              marginBottom: "24px",
            }}
          >
            MoT+++ operates no single building. instead it places artworks
            within the city itself — in private homes, businesses, studios, and
            public spaces — treating the urban fabric of ho chi minh city as its
            architecture.
          </p>

          <p
            style={{
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: 1.7,
              color: "#444444",
              marginBottom: "64px",
            }}
          >
            the collection is real, documented, and curated. the city is the
            museum building. the map is the floor plan.
          </p>

          <p
            style={{
              fontSize: "13px",
              color: "#999999",
              letterSpacing: "0.04em",
            }}
          >
            platform coming soon — register interest at{" "}
            <a
              href="mailto:motplusplusplus@gmail.com"
              style={{ color: "#111111" }}
            >
              motplusplusplus@gmail.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
