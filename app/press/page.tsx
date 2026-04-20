const pressItems = [
  {
    outlet: "Vietcetera",
    title: "MoT+++: A New Destination For Art Lovers",
    date: "January 18, 2023",
    url: "https://vietcetera.com/en/mot-a-new-destination-for-art-lovers",
    excerpt: "Founded in 2015, MoT+++ operates as an independent artist-run space - creating a tight-knit community where artistic experiences have been created, and many intriguing dialogues have been formed.",
    tag: "mot+++",
  },
  {
    outlet: "Vietcetera",
    title: "Cultural Trends In Vietnam 2019: Seven Experts Share Their Opinions",
    date: "2019",
    url: "https://vietcetera.vn/en/cultural-trends-in-vietnam-2019-seven-experts-share-their-opinions",
    excerpt: "Nguyen Art Foundation, Sàn Art, and MoT+++ jointly launched the A. Farm arts and residency space.",
    tag: "a.Farm",
  },
  {
    outlet: "TQPR",
    title: "Unlearning by 7 Vietnamese Artists Curated by David Willis",
    date: "October 2020",
    url: "https://tqpr.com/unlearning-by-7-vietnamese-artists-curated-by-david-willis/",
    excerpt: "Cam Xanh founded independent art space MoT+++ in 2015 in Ho Chi Minh City, which she continues to collaboratively run. In 2018 she co-founded A. Farm, an international art residency.",
    tag: "mot+++",
  },
  {
    outlet: "Art & Market",
    title: "My Own Words: The Future of International Art Residencies",
    date: "May 28, 2020",
    url: "https://www.artandmarket.net/my-own-words/2020/5/28/the-future-of-international-art-residencies",
    excerpt: "In February 2020, A. Farm received the news that its international art residency in Ho Chi Minh City would need to vacate its current premises - a reflection on the fragility and resilience of artist-run spaces.",
    tag: "a.Farm",
  },
  {
    outlet: "Mineral House Media",
    title: "Interview with Nghia Dang, A. Farm Artist Resident",
    date: "April 2020",
    url: "https://www.mineralhousemedia.com/media/2020/4/6/nghia-dang-interview",
    excerpt: "In conversation with Nghia Dang about his practice and research during his residency at A. Farm.",
    tag: "a.Farm",
  },
  {
    outlet: "Weston Teruya",
    title: "Artist-in-Residence (Jun–Aug): A. Farm, Ho Chi Minh City",
    date: "June 2, 2019",
    url: "https://westonteruya.com/2019/06/02/artist-in-residence-jun-aug-a-farm-ho-chi-minh-city/",
    excerpt: "Artist Weston Teruya on his residency at A. Farm in Ho Chi Minh City.",
    tag: "a.Farm",
  },
  {
    outlet: "Artsy",
    title: "MoT+++ - Gallery Profile",
    date: null,
    url: "https://www.artsy.net/partner/mot-plus-plus-plus",
    excerpt: "An independent, artist-run space in Ho Chi Minh City, Vietnam, collaborating with artists to create an experimental environment that encourages them to push the boundaries of their practice.",
    tag: "mot+++",
  },
  {
    outlet: "Trans Artists",
    title: "MoT+++ - Residency Profile",
    date: null,
    url: "https://www.transartists.org/en/air/mot",
    excerpt: "Listing and full description of the A. Farm international art residency programme.",
    tag: "a.Farm",
  },
  {
    outlet: "Nguyen Art Foundation",
    title: "A. Farm Residency",
    date: null,
    url: "https://nguyenartfoundation.com/community-building/a-farm-residency/",
    excerpt: "A. Farm - an international art residency conceived by artists Cam Xanh and Dinh Q. Lê, with the support of the Nguyen Art Foundation.",
    tag: "a.Farm",
  },
];

export default function PressPage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* header */}
      <div style={{ maxWidth: "720px", marginBottom: "72px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "20px",
        }}>
          press
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", lineHeight: 1.8 }}>
          coverage of MoT+++ and the a.Farm international art residency.
        </p>
        <p style={{ fontSize: "13px", color: "#aaaaaa", marginTop: "12px" }}>
          for media inquiries:{" "}
          <a href="mailto:motplusplusplus@gmail.com" style={{ color: "#888888" }}>
            motplusplusplus@gmail.com
          </a>
        </p>
      </div>

      {/* press list */}
      <div style={{ borderTop: "1px solid #e5e5e5" }}>
        {pressItems.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "32px 0",
              borderBottom: "1px solid #f2f2f2",
              textDecoration: "none",
              color: "inherit",
            }}
            className="press-row"
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "0 32px",
              alignItems: "start",
            }}>
              <div>
                <p style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  {item.outlet}
                </p>
                {item.date && (
                  <p style={{ fontSize: "11px", color: "#cccccc" }}>{item.date}</p>
                )}
                <span style={{
                  display: "inline-block",
                  marginTop: "8px",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "#bbbbbb",
                  border: "1px solid #e5e5e5",
                  padding: "2px 8px",
                }}>
                  {item.tag}
                </span>
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 300, color: "#111111", marginBottom: "10px", lineHeight: 1.35 }}>
                  {item.title} ↗
                </p>
                <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.7, maxWidth: "640px" }}>
                  {item.excerpt}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
