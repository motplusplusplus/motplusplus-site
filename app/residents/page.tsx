export default function ResidentsPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ marginBottom: "56px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
          }}
        >
          previous residents
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "520px", lineHeight: 1.7 }}>
          artists who have passed through the +a. farm program.
        </p>
      </div>

      {/* content coming */}
      <div
        style={{
          borderTop: "1px solid #e5e5e5",
          paddingTop: "48px",
        }}
      >
        <p style={{ fontSize: "13px", color: "#aaaaaa", letterSpacing: "0.06em" }}>
          content coming soon
        </p>
      </div>
    </div>
  );
}
