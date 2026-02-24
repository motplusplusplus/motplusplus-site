export default function AboutPage() {
  return (
    <>
      {/* hero */}
      <div
        style={{
          width: "100%",
          height: "50vh",
          minHeight: "320px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          MoT+++ — image
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

        {/* heading */}
        <div style={{ maxWidth: "800px", marginBottom: "80px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "32px",
            }}
          >
            about MoT+++
          </h1>
          <div
            style={{
              width: "100%",
              height: "160px",
              backgroundColor: "#f8f8f8",
              border: "1px solid #eeeeee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
              organization description — to be provided
            </p>
          </div>
        </div>

        {/* programs */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "80px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            programs
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "32px",
            }}
          >
            {[
              { name: "+1 museum by any other name", href: "/museum" },
              { name: "+a.farm", href: "/afarm" },
              { name: "+1 trash", href: "/trash" },
              { name: "+1 contemporary project", href: "/contemporary" },
              { name: "+1 nice place for experimentation", href: "/afarm" },
              { name: "+1 art advisory", href: "/advisory" },
              { name: "+1 residency", href: "/afarm" },
              { name: "mot+sound", href: "/sound" },
              { name: "mot+ performance", href: "/performance" },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                style={{
                  display: "block",
                  padding: "24px",
                  border: "1px solid #e5e5e5",
                  fontSize: "15px",
                  fontWeight: 300,
                  color: "#111111",
                  lineHeight: 1.4,
                }}
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>

        {/* people */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
            marginBottom: "80px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            people
          </p>
          <div
            style={{
              width: "100%",
              height: "120px",
              backgroundColor: "#f8f8f8",
              border: "1px solid #eeeeee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
              team / contributors — to be provided
            </p>
          </div>
        </div>

        {/* press */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            press
          </p>
          <div
            style={{
              width: "100%",
              height: "120px",
              backgroundColor: "#f8f8f8",
              border: "1px solid #eeeeee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>
              press links — to be provided
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
