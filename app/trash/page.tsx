export default function TrashPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* heading */}
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          +1 trash ♻
        </h1>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
          program
        </p>
        <p style={{ fontSize: "15px", color: "#444444", lineHeight: 1.8, marginBottom: "20px" }}>
          MoT+++'s former office space converted into an art warehouse where local and
          international artists drop off their favourite works with the hope of reaching
          out to collectors. artworks selected and consigned by artists are on view
          casually, in real life and virtually, for the indefinite future.
        </p>
        <p style={{ fontSize: "15px", color: "#444444", lineHeight: 1.8, marginBottom: "20px" }}>
          twice a week MoT+++ becomes a small salon — an exercise in both the recycling
          of artworks and ideas, and rediscovering forgotten beauty.
        </p>
        <p style={{ fontSize: "14px", color: "#888888", fontStyle: "italic", lineHeight: 1.8, marginBottom: "32px" }}>
          &ldquo;collecting trash is always an act to make the world a better place
          &nbsp;—&nbsp; thu gom rác luôn là một hành vi làm đẹp cho đời&rdquo;
          <br />
          <span style={{ fontSize: "12px", fontStyle: "normal", color: "#aaaaaa" }}>— Cam Xanh</span>
        </p>
      </div>

      {/* visit info */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "64px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
          visit
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "32px" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>hours</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              Tuesday & Friday<br />
              6 – 9 pm<br />
              open by appointment
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>location</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              Saigon Domaine, ground floor<br />
              1057 Binh Quoi, Ward 28<br />
              Binh Thanh, Ho Chi Minh City
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "8px" }}>contact</p>
            <p style={{ fontSize: "14px", color: "#444444", lineHeight: 1.7 }}>
              <a href="tel:+84904497769" style={{ color: "#444444" }}>+84 90 4497 769</a> (Tra My)<br />
              <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#444444" }}>motplusplusplus@gmail.com</a>
            </p>
          </div>
        </div>
      </div>

      {/* inventory note */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
          inventory
        </p>
        <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.8, maxWidth: "560px", marginBottom: "28px" }}>
          works available for acquisition — artworks from exhibitions past, consigned
          directly by artists. to inquire about what is currently available, get in touch.
        </p>
        <a
          href="mailto:motplusplusplus@gmail.com?subject=+1%20trash%20%E2%99%BB%20%E2%80%94%20inquiry"
          style={{
            display: "inline-block",
            fontSize: "13px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "12px 28px",
            textDecoration: "none",
          }}
        >
          inquire about available works
        </a>
      </div>

    </div>
  );
}
