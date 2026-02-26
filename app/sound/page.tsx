const editions = [
  { number: 25, title: "MoTsound #25 — Nikola H. Mounoud & Writher",           slug: "mot-sound-25-with-nikola-h-mounoud-and-writher",                        image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/25-poster.jpg" },
  { number: 24, title: "MoTsound #24 — Out of Landscape / Future Basketball",  slug: "mot-sound-24-out-of-landscape-into-mindscape-future-basketball",         image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/24-poster.jpg" },
  { number: 23, title: "MoTsound #23",                                          slug: "motsound-23",                                                             image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/23-poster.jpg" },
  { number: 22, title: "MoTsound #22",                                          slug: "mot-sound-22",                                                            image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/22-poster.png" },
  { number: 21, title: "MoTsound #21 — Dispari",                               slug: "mot-sound-21-dispari",                                                    image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/21-poster.png" },
  { number: 20, title: "MoTsound #20",                                          slug: "motsound-20",                                                             image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/20-poster.png" },
  { number: 16, title: "MoTsound #16 — Poetry Plus vol.3",                     slug: "mot-sound-16-poetry-plus-vol-3",                                          image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/16-poster.jpg" },
  { number: 15, title: "MoTsound #15 — aReNaissance",                          slug: "mot-sound-15-arenaissance",                                               image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/15-poster.jpg" },
  { number: 14, title: "MoTsound #14 — aSchismism",                            slug: "mot-sound-14-aschismism",                                                 image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/14-poster.png" },
  { number: 13, title: "MoTsound #13 — aMoment",                               slug: "mot-sound-13-amoment",                                                    image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/13-poster.png" },
  { number: 12, title: "MoTsound #12 — Performance Plus 2019",                 slug: "mot-sound-12-performance-plus-2019",                                      image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/12-poster.jpg" },
  { number: 11, title: "MoTsound #11 — aDom",                                  slug: "mot-sound-11-adom",                                                       image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/11-poster.jpg" },
  { number: 10, title: "MoTsound #10 — aNoise",                                slug: "mot-sound-10-anoise",                                                     image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/10-poster.jpg" },
  { number:  9, title: "MoTsound #9 — aConvergence",                           slug: "mot-sound-9-aconvergence",                                                image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/09-poster.jpg" },
  { number:  8, title: "MoTsound #8 — Amoeba",                                 slug: "mot-sound-8-amoeba",                                                      image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/08-poster.jpg" },
  { number:  7, title: "MoTsound #7",                                           slug: "mot-sound-7",                                                             image: null },
  { number:  6, title: "MoTsound #6",                                           slug: "mot-sound-6",                                                             image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/06-poster.png" },
  { number:  5, title: "MoTsound #5",                                           slug: "mot-sound-5",                                                             image: null },
  { number:  4, title: "MoTsound #4",                                           slug: "mot-sound-4",                                                             image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/04-poster.jpg" },
  { number:  3, title: "MoTsound #3",                                           slug: "mot-sound-3",                                                             image: null },
  { number:  2, title: "MoTsound #2",                                           slug: "mot-sound-2",                                                             image: null },
  { number:  1, title: "MoTsound #1",                                           slug: "mot-sound-1",                                                             image: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/motsound/01-poster.jpg" },
];

export default function MoTsoundPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* intro */}
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          MoTsound
        </h1>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
          mot | mọt | termite
        </p>
        <p style={{ fontSize: "14px", color: "#666666", lineHeight: 1.8, marginBottom: "20px", fontStyle: "italic" }}>
          &ldquo;when termites are threatened or disturbed, they communicate by banging their heads against the
          walls of their tunnels. this creates a dry rattling that human ears can hear. termites, however,
          cannot hear audible noise, they react to the vibration they feel..&rdquo;
        </p>
        <p style={{ fontSize: "15px", color: "#444444", lineHeight: 1.8, marginBottom: "20px" }}>
          MoTsound is an experimental sound project delivering artists and audiences from their daily
          auditory experiences. each session features a series of performances from local and international
          sound artists. pieces vary greatly, but together they hope to offer and encourage conceptual
          sonic expression unfettered by genre-based preconditions.
        </p>
        <p style={{ fontSize: "13px", color: "#aaaaaa" }}>
          if you are an artist that would like to be involved, message{" "}
          <a href="mailto:info@motplus.xyz" style={{ color: "#888888" }}>info@motplus.xyz</a>
        </p>
      </div>

      {/* poster grid */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "40px" }}>
          archive — {editions.length} editions, 2017—present
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "24px 20px",
        }}>
          {editions.map((ed) => (
            <a
              key={ed.number}
              href={`/events/${ed.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="snd-card"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {/* poster */}
              <div className="snd-card-img" style={{
                width: "100%", aspectRatio: "1/1",
                overflow: "hidden",
                backgroundColor: "#1a1a1a",
                marginBottom: "12px",
              }}>
                {ed.image ? (
                  <img
                    src={ed.image}
                    alt={ed.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "11px", color: "#555555", letterSpacing: "0.08em" }}>
                      #{ed.number}
                    </span>
                  </div>
                )}
              </div>

              {/* label */}
              <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "4px" }}>
                #{ed.number}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 300, color: "#111111", lineHeight: 1.3 }}>
                {ed.title.replace(/^MoTsound #\d+ — /, "").replace(/^MoTsound #\d+$/, "—")}
              </p>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
