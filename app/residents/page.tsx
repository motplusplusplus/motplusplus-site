const R2 = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/residency";

const residents = [
  { name: "Xxavier Edward Carter", img: `${R2}/xxavier-edward-carter.jpg`, year: "2019" },
  { name: "Do Nguyen Lap-Xuan", img: `${R2}/do-nguyen-lap-xuan.jpg`, year: "2019" },
  { name: "Samira Jamouchi", img: `${R2}/samira-jamouchi.jpg`, year: "2019" },
  { name: "Aliansyah Caniago", img: `${R2}/aliansyah-caniago.jpg`, year: "2019" },
  { name: "Dang Thuy Anh", img: `${R2}/dang-thuy-anh.jpg`, year: "2019" },
  { name: "Flinh", img: `${R2}/flinh.jpg`, year: "2019" },
  { name: "Masayuki Miyaji", img: `${R2}/masayuki-miyaji.jpg`, year: "2019" },
  { name: "Shayekh Mohammed Arif", img: `${R2}/shayekh-mohammed-arif.jpg`, year: "2019" },
  { name: "Zach Sch", img: `${R2}/zach-sch.jpg`, year: "2019" },
  { name: "Ayumi Adachi", img: `${R2}/ayumi-adachi.jpg`, year: "2019" },
  { name: "Sikarnt Skoolisariyaporn", img: `${R2}/sikarnt-skoolisariyaporn.jpg`, year: "2019" },
  { name: "Chu Hao Pei", img: `${R2}/chu-has-pei.jpg`, year: "2019" },
];

export default function ResidentsPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          previous residents
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8 }}>
          artists who have passed through the +a.farm program at MoT+++.
        </p>
      </div>

      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
          performance plus 2019
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "24px 20px",
        }}>
          {residents.map((r) => (
            <div key={r.name}>
              <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", backgroundColor: "#f0f0f0", marginBottom: "12px" }}>
                <img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.3, marginBottom: "2px" }}>
                {r.name}
              </p>
              <p style={{ fontSize: "11px", color: "#bbbbbb", letterSpacing: "0.04em" }}>
                {r.year}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
