export default function ContactPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

      <h1
        style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: "72px",
        }}
      >
        contact
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "64px",
        }}
      >

        {/* general */}
        <div>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            general
          </p>
          <a
            href="mailto:motplusplusplus@gmail.com"
            style={{ fontSize: "16px", fontWeight: 300, color: "#111111", display: "block", marginBottom: "8px" }}
          >
            motplusplusplus@gmail.com
          </a>
          <p style={{ fontSize: "13px", color: "#aaaaaa", lineHeight: 1.7 }}>
            MoT+++, la astoria tower 2<br />
            383 nguyễn duy trinh<br />
            hồ chí minh city
          </p>
        </div>

        {/* +a.farm */}
        <div>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            +a.farm residency
          </p>
          <a
            href="mailto:a.farm.saigon@gmail.com"
            style={{ fontSize: "16px", fontWeight: 300, color: "#111111", display: "block", marginBottom: "16px" }}
          >
            a.farm.saigon@gmail.com
          </a>
          <a
            href="/afarm/apply"
            style={{
              fontSize: "13px",
              color: "#111111",
              border: "1px solid #cccccc",
              padding: "10px 20px",
              display: "inline-block",
            }}
          >
            inquire about residency
          </a>
        </div>

        {/* social */}
        <div>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            social
          </p>
          <a
            href="https://instagram.com/motplusplusplus"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "16px", fontWeight: 300, color: "#111111", display: "block", marginBottom: "8px" }}
          >
            instagram
          </a>
          <p style={{ fontSize: "13px", color: "#aaaaaa" }}>@motplusplusplus</p>
        </div>

      </div>

    </div>
  );
}
