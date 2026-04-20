import Link from "next/link";

const R2 = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/contemporary";

const exhibitions = [
  {
    title: "SHOW|off",
    artist: "Cam Xanh & Andrew Newell Walther",
    dates: "January 22, 2026",
    img: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/events/show-off-cam-xanh-andrew-newell-walther/show-off-01.jpg",
    slug: "show-off-cam-xanh-andrew-newell-walther",
  },
  {
    title: "Once Upon a Time",
    artist: "Tuyp Tran",
    dates: "July 5 – September 7, 2024",
    img: `${R2}/tuyp-tran-once-upon-a-time.jpg`,
    slug: "once-upon-a-time-by-tuyp-tran",
  },
  {
    title: "Girl in Red",
    artist: "",
    dates: "November 24, 2023 – January 28, 2024",
    img: `${R2}/girl-in-red.jpg`,
    slug: "girl-in-red",
  },
  {
    title: "Love in the Time of Cholera Chapter 1: LOVE",
    artist: "group show",
    dates: "October – December 2022",
    img: `${R2}/love-in-time-of-cholera.jpg`,
    slug: "contemporary-project-1",
  },
  {
    title: "Reunification Flowers | Hoa Thống Nhất",
    artist: "Trần Minh Đức",
    dates: "2023",
    img: `${R2}/reunification-flowers.png`,
    slug: "reunification-flowers",
  },
  {
    title: "SWAB Barcelona Art Fair 2020",
    artist: "",
    dates: "October 1–15, 2020",
    img: `${R2}/swab-barcelona-2020.jpg`,
    slug: null,
  },
  {
    title: "Password 0~1",
    artist: "group show",
    dates: "June 9 – September 6, 2020",
    img: `${R2}/password-01.png`,
    slug: "password-0-1",
  },
  {
    title: "Frozen Data",
    artist: "Lan Anh Lê (1993–2020)",
    dates: "January 11 – February 28, 2020",
    img: `${R2}/frozen-data-lananh-le.jpg`,
    slug: "frozen-data-lananh-le",
  },
  {
    title: "OtherMother",
    artist: "Cian Duggan",
    dates: "October 25 – November 20, 2019",
    img: `${R2}/othermother-cian-duggan.jpg`,
    slug: "othermother-cian-duggan",
  },
  {
    title: "Rainy Season | Mùa Mưa",
    artist: "Kim Duy",
    dates: "September 6–14, 2019",
    img: `${R2}/rainy-season-kim-duy.jpg`,
    slug: "rainy-season-mua-mua-kim-duy",
  },
  {
    title: "MoT Doi Gai | A Beach Life",
    artist: "Cam Xanh",
    dates: "June 22 – July 5, 2019",
    img: `${R2}/mot-doi-gai-cam-xanh.jpeg`,
    slug: "mot-doi-gai-a-beach-life-cam-xanh",
  },
  {
    title: "Home | Land",
    artist: "Lê Hiền Minh & Cam Xanh",
    dates: "Taiwan Annual Art Fair, September 16–24, 2017",
    img: `${R2}/home-land-taiwan-2017.jpg`,
    slug: "home-land-by-le-hien-minh-and-cam-xanh",
  },
  {
    title: "Renaissance International School",
    artist: "Regis Golay",
    dates: "July 27, 2017",
    img: `${R2}/regis-golay-renaissance.jpg`,
    slug: "renaissance-international-school-now-features-work-by-regis-g",
  },
];

export default function ContemporaryPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "72px 24px" }}>

      {/* heading */}
      <div style={{ maxWidth: "800px", marginBottom: "64px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "32px",
          }}
        >
          +1 contemporary project
        </h1>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
          program
        </p>
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", maxWidth: "640px" }}>
          a fashionable space exhibiting the works of local and international artists.
        </p>
      </div>

      {/* exhibition grid */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "28px 24px",
          }}
        >
          {exhibitions.map((ex, i) => {
            const inner = (
              <>
                <div className="evt-card-img" style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0" }}>
                  <img src={ex.img} alt={ex.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 400, color: "#111111", marginBottom: "4px", lineHeight: 1.4 }}>
                    {ex.title}
                  </p>
                  {ex.artist && (
                    <p style={{ fontSize: "13px", color: ex.slug === "frozen-data-lananh-le" ? "#888888" : "#666666", marginBottom: "4px" }}>
                      {ex.artist}
                    </p>
                  )}
                  <p style={{ fontSize: "12px", color: "#999999" }}>{ex.dates}</p>
                </div>
              </>
            );
            return ex.slug ? (
              <Link key={i} href={`/events/${ex.slug}`} className="evt-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {inner}
              </Link>
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
