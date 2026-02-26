const R2 = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev";

const artworks = [
  {
    src: `${R2}/motplus/museum/afarm-museum-2017.png`,
    title: "+1 museum by any other name | A. Farm",
    artist: "MoT+++",
    date: "2017",
    location: "A. Farm",
  },
  {
    src: `${R2}/motplus/museum/cian-duggan-entrances.jpg`,
    title: "entrances",
    artist: "Cian Duggan",
    date: "2018",
    location: "ho chi minh city",
  },
  {
    src: `${R2}/motplus/museum/dao-tung-it-seems-to-be.jpg`,
    title: "it seems to be",
    artist: "Đào Tùng",
    date: "2018",
    location: "ho chi minh city",
  },
  {
    src: `${R2}/motplus/museum/tran-minh-duc-flowers.jpg`,
    title: "flowers",
    artist: "Trần Minh Đức",
    date: "2019",
    location: "ho chi minh city",
  },
];

export default function MuseumPage() {
  return (
    <>
      {/* page title */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 32px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em",
        }}>
          +1 museum by any other name
        </h1>
      </div>

      {/* interactive map placeholder */}
      <div style={{
        width: "100%", height: "60vh", minHeight: "400px",
        backgroundColor: "#f0f0f0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "12px",
        borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5",
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#cccccc" strokeWidth="1.5">
          <circle cx="16" cy="14" r="5" />
          <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" />
        </svg>
        <p style={{ fontSize: "12px", color: "#aaaaaa", letterSpacing: "0.08em" }}>
          interactive map — phase 2
        </p>
        <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.04em" }}>
          works placed across ho chi minh city
        </p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

        {/* description */}
        <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
            MoT+++ operates no single building. instead it places artworks within the city itself — in private homes, businesses, studios, and public spaces — treating the urban fabric of ho chi minh city as its architecture.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
            the collection is real, documented, and curated. the city is the museum building. the map is the floor plan.
          </p>
        </div>

        {/* collection */}
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            the collection
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "32px",
          }}>
            {artworks.map((w) => (
              <div key={w.src}>
                <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f5f5f5", marginBottom: "12px" }}>
                  <img src={w.src} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <p style={{ fontSize: "13px", fontWeight: 400, color: "#111111", marginBottom: "4px" }}>{w.title}</p>
                <p style={{ fontSize: "12px", color: "#888888" }}>{w.artist} — {w.location}</p>
                <p style={{ fontSize: "11px", color: "#bbbbbb", marginTop: "2px" }}>{w.date}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
