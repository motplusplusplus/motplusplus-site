import Link from "next/link";

export default function ContemporaryPage() {
  const exhibitions = [
    { title: "Once Upon a Time", artist: "Tuyp Tran", dates: "July 5 – September 7, 2024" },
    { title: "Girl in Red", artist: "", dates: "November 24, 2023 – January 28, 2024" },
    { title: "Love in the Time of Cholera Chapter 1: LOVE", artist: "group show", dates: "October 2022 – December 2022" },
    { title: "Reunification Flowers | Hoa Thống Nhất", artist: "Trần Minh Đức", dates: "2023" },
    { title: "SWAB Barcelona Art Fair 2020", artist: "", dates: "October 1–15, 2020" },
    { title: "Password 0~1", artist: "group show", dates: "June 9 – September 6, 2020" },
    { title: "Frozen Data", artist: "Lananh Le", dates: "January 11 – February 28, 2020" },
    { title: "OtherMother", artist: "Cian Duggan", dates: "October 25 – November 20, 2019" },
    { title: "Rainy Season | Mùa Mưa", artist: "Kim Duy", dates: "September 6–14, 2019" },
    { title: "MoT Doi Gai | A Beach Life", artist: "Cam Xanh", dates: "June 22 – July 5, 2019" },
    { title: "Home | Land", artist: "Lê Hiền Minh & Cam Xanh — Taiwan Annual Art Fair 2017", dates: "September 16–24, 2017" },
    { title: "Renaissance International School", artist: "Regis Golay", dates: "July 27, 2017" },
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
          +1 contemporary project — image
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
            +1 contemporary project
          </h1>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
            program
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444", maxWidth: "640px" }}>
            a fashionable space exhibiting the works of local and international artists.
          </p>
        </div>

        {/* exhibition archive */}
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "48px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
            exhibitions
          </p>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {exhibitions.map((ex, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "24px",
                  padding: "20px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <span style={{ fontSize: "15px", fontWeight: 300, color: "#111111", lineHeight: 1.4 }}>
                    {ex.title}
                  </span>
                  {ex.artist && (
                    <span style={{ fontSize: "14px", color: "#888888", marginLeft: "12px" }}>
                      {ex.artist}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999999",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {ex.dates}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
