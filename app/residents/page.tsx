import Link from "next/link";
import eventsRaw from "../../events-data.json";

const R2 = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/residency";

// Slugs that are resident bio pages (not event announcements)
const BIO_SLUGS = new Set([
  "noah-spivak","juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le",
  "coco","lai-minh-ngoc","linh-le","le-d-chung","ania-reynolds","anh-tran",
  "linh-vh-nguyen","shiro-masuyama","thom-nguyen","ian-strange",
  "exxonnubile-julia-weiner","x-o-veron-xio","aylin-derya-stahl",
  "virginie-tan","baby-reni","irene-ha","duy-nguyen","nguyen-hoa",
  "vicente-arrese","alex-williams","lau-wang-tat","narelle-zhao",
  "annabelle-yep","linh-san","damon-duc-pham","mascha-serga","blake-palmer",
  "david-willis","laura-philips","anh-vo","chau-kim-sanh","bert-ackley",
  "espen-iden","kayla-kurin","claire-bloomfield","yeonjeong","saverio-tonoli",
  "ly-trang","chu-hao-pei","nghia-dang","lan-anh-le","matteo-biella",
  "tina-thu","kanich-khajohnsri","levi-masuli","eden-barrena","rachel-tonthat",
  "nguyen-le-phuong-linh","roberto-sifuentes","aram-han-sifuentes",
  "natalia-ludmila","z1-studio","constance-meffre","mariana-tubio-blasio",
  "matthew-brannon","scott-anderson","cora-von-zezschwitz-tilman-hoepfl",
  "scott-farrand","latthapon-korkiatarkul","luca-lum","nguyen-duc-phuong",
  "cian-duggan","john-edmond-smyth","kim-duy","tram-luong",
  "tricia-nguyen-thanh-trang","bagus-mazasupa-anwarridwan","maung-day",
  "ben-valentine","tuyen-nguyen","alisa-chunchue","karen-thao-nguyen-la",
  "lem-trag","michael-atavar",
]);

type ResidentEntry = { slug: string; title: string; sortDate: string };

// Pull resident bio events from the full event list
const afarmBios = (eventsRaw as ResidentEntry[]).filter(
  (e: any) => BIO_SLUGS.has(e.slug) && e.category === "+a.farm"
);

// Group by year
const byYear: Record<string, ResidentEntry[]> = {};
for (const e of afarmBios) {
  const yr = e.sortDate.slice(0, 4);
  if (!byYear[yr]) byYear[yr] = [];
  byYear[yr].push(e);
}
const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

// Performance Plus 2019 cohort (separate program — portraits on R2)
const perfPlus2019 = [
  { name: "Xxavier Edward Carter", img: `${R2}/xxavier-edward-carter.jpg` },
  { name: "Do Nguyen Lap-Xuan",    img: `${R2}/do-nguyen-lap-xuan.jpg` },
  { name: "Samira Jamouchi",       img: `${R2}/samira-jamouchi.jpg` },
  { name: "Aliansyah Caniago",     img: `${R2}/aliansyah-caniago.jpg` },
  { name: "Dang Thuy Anh",        img: `${R2}/dang-thuy-anh.jpg` },
  { name: "Flinh",                 img: `${R2}/flinh.jpg` },
  { name: "Masayuki Miyaji",       img: `${R2}/masayuki-miyaji.jpg` },
  { name: "Shayekh Mohammed Arif", img: `${R2}/shayekh-mohammed-arif.jpg` },
  { name: "Zach Sch",              img: `${R2}/zach-sch.jpg` },
  { name: "Ayumi Adachi",          img: `${R2}/ayumi-adachi.jpg` },
  { name: "Sikarnt Skoolisariyaporn", img: `${R2}/sikarnt-skoolisariyaporn.jpg` },
  { name: "Chu Hao Pei",           img: `${R2}/chu-has-pei.jpg` },
];

export default function ResidentsPage() {
  const totalResidents = afarmBios.length + perfPlus2019.length;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* header */}
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          previous residents
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8, marginBottom: "12px" }}>
          artists who have passed through the +a.farm program at MoT+++.
        </p>
        <p style={{ fontSize: "12px", color: "#aaaaaa" }}>
          {totalResidents}+ artists — 2018 to present
        </p>
      </div>

      {/* A.Farm residents by year */}
      <div style={{ borderTop: "1px solid #e5e5e5" }}>
        {years.map((yr) => (
          <div key={yr} style={{ borderBottom: "1px solid #f0f0f0", padding: "40px 0" }}>
            <p style={{
              fontSize: "11px", color: "#999999",
              letterSpacing: "0.08em", marginBottom: "24px",
            }}>
              {yr}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "10px 32px",
            }}>
              {byYear[yr]
                .sort((a, b) => b.sortDate.localeCompare(a.sortDate))
                .map((e) => (
                  <Link
                    key={e.slug}
                    href={`/events/${e.slug}`}
                    style={{
                      fontSize: "14px",
                      fontWeight: 300,
                      color: e.slug === "lan-anh-le" ? "#666666" : "#111111",
                      lineHeight: 1.5,
                      textDecoration: "none",
                      fontStyle: e.slug === "lan-anh-le" ? "italic" : "normal",
                    }}
                  >
                    {e.title}
                    {e.slug === "lan-anh-le" && (
                      <span style={{ fontSize: "11px", color: "#aaaaaa", marginLeft: "6px" }}>
                        1993–2020
                      </span>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Plus 2019 — portrait grid */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "56px", marginTop: "16px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "8px" }}>
          performance plus 2019
        </p>
        <p style={{ fontSize: "13px", color: "#bbbbbb", marginBottom: "40px" }}>
          a. farm — artist-in-residence program
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "24px 20px",
        }}>
          {perfPlus2019.map((r) => (
            <div key={r.name}>
              <div style={{
                width: "100%", aspectRatio: "1/1",
                overflow: "hidden", backgroundColor: "#f0f0f0",
                marginBottom: "10px",
              }}>
                <img
                  src={r.img} alt={r.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 300, color: "#111111", lineHeight: 1.3 }}>
                {r.name}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
