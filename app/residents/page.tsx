import Link from "next/link";
import { getAllEvents } from "@/lib/sanity";
import { BIO_SLUGS } from "@/lib/events";

type ResidentEntry = { slug: string; title: string; sortDate: string };

// Performance Plus 2019 cohort — integrated as text entries
const perfPlus2019Artists: { name: string; slug?: string }[] = [
  { name: "Xxavier Edward Carter" },
  { name: "Do Nguyen Lap-Xuan" },
  { name: "Samira Jamouchi" },
  { name: "Aliansyah Caniago" },
  { name: "Dang Thuy Anh" },
  { name: "Flinh" },
  { name: "Masayuki Miyaji" },
  { name: "Shayekh Mohammed Arif" },
  { name: "Zach Sch" },
  { name: "Ayumi Adachi" },
  { name: "Sikarnt Skoolisariyaporn" },
  { name: "Chu Hao Pei", slug: "chu-hao-pei" },
];

export default async function ResidentsPage() {
  const allEvents = await getAllEvents();
  const afarmBios = allEvents.filter(e => BIO_SLUGS.has(e.slug) || e.isBioPage);

  const byYear: Record<string, ResidentEntry[]> = {};
  for (const e of afarmBios) {
    const yr = (e.sortDate || e.dateISO || '').slice(0, 4);
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(e);
  }
  const years = Object.keys(byYear).filter(Boolean).sort((a, b) => Number(b) - Number(a));

  const totalResidents = afarmBios.length + perfPlus2019Artists.length;

  const nameStyle = {
    fontSize: "14px",
    fontWeight: 300,
    color: "#111111",
    lineHeight: 1.5,
    textDecoration: "none",
  } as const;

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

      {/* residents by year */}
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
                    href={`/artists/${e.slug}`}
                    style={{
                      ...nameStyle,
                      color: e.slug === "lan-anh-le" ? "#666666" : "#111111",
                      fontStyle: e.slug === "lan-anh-le" ? "italic" : "normal",
                    }}
                  >
                    <span style={{ display: "block" }}>{e.title}</span>
                    {e.slug === "lan-anh-le" && (
                      <span style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#aaaaaa",
                        marginTop: "2px",
                        fontStyle: "normal",
                      }}>
                        1993–2020
                      </span>
                    )}
                  </Link>
                ))}
            </div>

            {/* Performance Plus sub-section — shown in 2019 bucket */}
            {yr === "2019" && (
              <div style={{ marginTop: "32px" }}>
                <p style={{
                  fontSize: "10px", color: "#cccccc",
                  letterSpacing: "0.06em", marginBottom: "16px",
                }}>
                  performance plus
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "10px 32px",
                }}>
                  {perfPlus2019Artists.map(({ name, slug }) =>
                    slug ? (
                      <Link key={name} href={`/artists/${slug}`} style={nameStyle}>
                        {name}
                      </Link>
                    ) : (
                      <span key={name} style={{ ...nameStyle, cursor: "default" }}>
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
