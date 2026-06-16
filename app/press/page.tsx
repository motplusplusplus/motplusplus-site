import { pressItems } from "@/lib/press";

export default function PressPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* header */}
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          press
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8 }}>
          coverage of MoT+++ and the a.Farm international art residency.
        </p>
        <p style={{ fontSize: "13px", color: "#aaaaaa", marginTop: "12px" }}>
          for media inquiries:{" "}
          <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#888888" }}>
            motplusplusplus@gmail.com
          </a>
        </p>
      </div>

      {/* press list */}
      <div style={{ borderTop: "1px solid #e5e5e5" }}>
        {pressItems.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "32px 0",
              borderBottom: "1px solid #f2f2f2",
              textDecoration: "none",
              color: "inherit",
            }}
            className="press-row"
          >
            <div className="press-row-inner">
              <div>
                <p style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  {item.outlet}
                </p>
                {item.date && (
                  <p style={{ fontSize: "11px", color: "#cccccc" }}>{item.date}</p>
                )}
                <span style={{
                  display: "inline-block",
                  marginTop: "8px",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "#bbbbbb",
                  border: "1px solid #e5e5e5",
                  padding: "2px 8px",
                }}>
                  {item.tag}
                </span>
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 300, color: "#111111", marginBottom: "10px", lineHeight: 1.35 }}>
                  {item.title} ↗
                </p>
                <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.7, maxWidth: "640px" }}>
                  {item.excerpt}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
