export default function Home() {
  return (
    <>
      {/* heading above map */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "48px 24px 40px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 3.2vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          +1 museum by any other name
        </h1>
      </div>

      {/* hero map placeholder */}
      <div
        style={{
          width: "100%",
          height: "60vh",
          minHeight: "380px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid #e5e5e5",
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

      {/* content below map */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: "860px" }}>
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
