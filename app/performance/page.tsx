const R2 = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/performance";

const photos = [
  { src: `${R2}/performance-plus-2019.png`, alt: "Performance Plus 2019" },
  { src: `${R2}/bdp5.jpeg`, alt: "Big Day of Performances #5" },
  { src: `${R2}/maria-sowter-little-night.jpeg`, alt: "Maria Sowter — Little Night of Performances" },
  { src: `${R2}/xxavier-edward-carter-bdp4.jpg`, alt: "Xxavier Edward Carter — Big Day of Performances #4" },
  { src: `${R2}/cam-xanh-chaoart.jpg`, alt: "Cam Xanh — ChaoArt|ArtChao" },
  { src: `${R2}/tanya-amador-round-table.jpeg`, alt: "Tanya Amador — Round Table" },
  { src: `${R2}/shayekh-bdp3.jpg`, alt: "Shayekh Mohammed Arif — Big Day of Performances #3" },
  { src: `${R2}/bdp2-tanya-amador.jpg`, alt: "Big Day of Performances #2" },
  { src: `${R2}/mi-mimi-poetry-plus.jpg`, alt: "Mi Mimi — Poetry Plus" },
  { src: `${R2}/bdp1-opening.jpg`, alt: "Big Day of Performances #1" },
  { src: `${R2}/ayumi-adachi-bdp1.jpg`, alt: "Ayumi Adachi — Big Day of Performances #1" },
  { src: `${R2}/dusk-dance-emmanuelle-huynh.jpeg`, alt: "Dusk Dance for Saigon River — Emmanuelle Huynh" },
  { src: `${R2}/dusk-dance-01.jpg`, alt: "Dusk Dance for Saigon River" },
  { src: `${R2}/cam-xanh-run-run-run.jpg`, alt: "Cam Xanh — Run Run Run" },
  { src: `${R2}/artist-talk-singapore-2019.jpg`, alt: "Artist Talk — Singapore 2019" },
];

const events = [
  { title: "Dusk Dance for Saigon River — Emmanuelle Huynh", date: "February 25, 2020" },
  { title: "Poetry Plus | Frozen Data", date: "February 22, 2020" },
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
  { title: "Cam Xanh — Run Run Run (ongoing collaborative performance)", date: "April 26, 2019 – present" },
  { title: "Artist Talk | Collaborative Performance — Singapore", date: "January 25, 2019" },
];

export default function PerformancePage() {
  return (
    <>
      {/* hero */}
      <div
        style={{
          width: "100%",
          height: "60vh",
          minHeight: "360px",
          overflow: "hidden",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <img
          src={photos[0].src}
          alt={photos[0].alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
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

        {/* photo grid */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
            performance plus 2019 — november 18 – december 22, 2019
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {photos.slice(1).map((p, i) => (
              <div
                key={i}
                style={{
                  width: "100%",
                  aspectRatio: "3/2",
                  overflow: "hidden",
                  backgroundColor: "#f0f0f0",
                }}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* event list */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
            archive
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
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
                <span style={{ fontSize: "12px", color: "#999999", whiteSpace: "nowrap", flexShrink: 0 }}>
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
