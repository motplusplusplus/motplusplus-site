import Link from "next/link";

export default function PerformancePage() {
  const events = [
    // Performance Plus 2019
    { title: "Big Day of Performances #5", date: "December 21, 2019" },
    { title: "Little Night of Performances", date: "December 19, 2019" },
    { title: "Big Day of Performances #4 @ a.farm", date: "December 14, 2019" },
    { title: "Cam Xanh — ChaoArt|ArtChao", date: "December 10, 2019" },
    { title: "Big Day of Performances #3", date: "December 7, 2019" },
    { title: "Tanya Amador — Documenting Performance Art (Presentation & Round Table)", date: "December 3, 2019" },
    { title: "Big Day of Performances #2", date: "December 1, 2019" },
    { title: "Tuan Mami & Cam Xanh — Artist Presentations", date: "November 29, 2019" },
    { title: "Poetry Plus", date: "November 28, 2019" },
    { title: "Big Day of Performances #1", date: "November 24, 2019" },
    // 2020
    { title: "Dusk Dance for Saigon River — Emmanuelle Huynh", date: "February 25, 2020" },
    { title: "Poetry Plus | Frozen Data", date: "February 22, 2020" },
    // Ongoing
    { title: "Cam Xanh — Run Run Run (ongoing collaborative performance)", date: "April 26, 2019 – present" },
    { title: "Artist Talk | Collaborative Performance — Singapore", date: "January 25, 2019" },
  ];

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
          +1 performance — image
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
            +1 performance
          </h1>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            program
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", maxWidth: "640px" }}>
            encouraging artists to investigate less traditional working methods through live performance,
            collaborative practice, and experimentation with form.
          </p>
        </div>

        {/* archive */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
            archive
          </p>

          {/* Performance Plus 2019 header */}
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            performance plus 2019 — november 18 – december 22, 2019
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            {events.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "24px",
                  padding: "16px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <span style={{ fontSize: "15px", fontWeight: 300, color: "#111111", lineHeight: 1.4 }}>
                  {e.title}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999999",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {e.date}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
