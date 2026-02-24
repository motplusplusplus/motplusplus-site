const imagePlaceholders = Array.from({ length: 10 }, (_, i) => i + 1);

export default function MuseumPage() {
  return (
    <>
      {/* page title */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "48px 24px 32px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          +1 museum by any other name
        </h1>
      </div>

      {/* interactive map placeholder */}
      <div
        style={{
          width: "100%",
          height: "60vh",
          minHeight: "400px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          borderTop: "1px solid #e5e5e5",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke="#cccccc"
          strokeWidth="1.5"
        >
          <circle cx="16" cy="14" r="5" />
          <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" />
        </svg>
        <p
          style={{
            fontSize: "12px",
            color: "#aaaaaa",
            letterSpacing: "0.08em",
          }}
        >
          interactive map — phase 2
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "#cccccc",
            letterSpacing: "0.04em",
          }}
        >
          works placed across ho chi minh city
        </p>
      </div>

      {/* collection image grid */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "#999999",
            letterSpacing: "0.08em",
            marginBottom: "32px",
          }}
        >
          the collection
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {imagePlaceholders.map((n) => (
            <div key={n}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#cccccc",
                    letterSpacing: "0.06em",
                  }}
                >
                  image {n}
                </p>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#111111",
                  marginBottom: "4px",
                }}
              >
                work title
              </p>
              <p style={{ fontSize: "12px", color: "#888888" }}>
                artist name — location
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
