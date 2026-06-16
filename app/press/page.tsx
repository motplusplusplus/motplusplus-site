const pressItems = [
  {
    outlet: "Tatler Asia",
    title: "5 independent artist communities in Saigon you shouldn't miss",
    date: "June 16, 2025",
    url: "https://tatlerasia.com/lifestyle/arts/independent-artist-communities-in-saigon",
    excerpt: "MoT+++ and A.Farm have played a decisive role in advancing Vietnam's contemporary art movement, with projects that tend to be bold in approach and deeply engaged with contemporary social themes.",
    tag: "mot+++",
  },
  {
    outlet: "Goethe-Institut Vietnam",
    title: "Residency — A. Farm Goethe 2025",
    date: "2025",
    url: "https://www.goethe.de/ins/vn/en/kul/rep/far.html",
    excerpt: "The Goethe-Institut Ho Chi Minh City serves as a funding and managing partner for A. Farm's seventh season, supporting artistic exchange and residencies for Vietnamese and international artists.",
    tag: "a.Farm",
  },
  {
    outlet: "Hyperallergic",
    title: "Dinh Q. Lê, Who Tended the Wounds of Post-War Vietnam, Dies at 56",
    date: "April 8, 2024",
    url: "https://hyperallergic.com/dinh-q-le-who-tended-the-wounds-of-post-war-vietnam-dies-at-56/",
    excerpt: "Dinh Q. Lê — co-founder of A. Farm alongside Cam Xanh of MoT+++ — curated a 2018 solo show at MoT+++ artists' space, organized with Sàn Art.",
    tag: "mot+++",
  },
  {
    outlet: "Vietcetera",
    title: "Three Art Shows To See In Vietnam Right Now",
    date: "May 2023",
    url: "https://vietcetera.com/en/three-art-shows-to-see-in-vietnam-right-now",
    excerpt: "MoT+++ is described as 'one of the most exciting art collectives in Vietnam,' featuring a diverse group exhibition at Centec Tower with collective members Cam Xanh, Cian Duggan, and Wu Chi-Tsung.",
    tag: "mot+++",
  },
  {
    outlet: "Vietcetera",
    title: "MoT+++: A New Destination For Art Lovers",
    date: "January 18, 2023",
    url: "https://vietcetera.com/en/mot-a-new-destination-for-art-lovers",
    excerpt: "Founded in 2015, MoT+++ operates as an independent artist-run space - creating a tight-knit community where artistic experiences have been created, and many intriguing dialogues have been formed.",
    tag: "mot+++",
  },
  {
    outlet: "LUXUO.VN",
    title: "Trò chuyện Art Republik: Quỳnh Nguyễn – Nhà sáng lập the Nguyen Art Foundation",
    date: "May 24, 2021",
    url: "https://luxuo.vn/culture/tro-chuyen-art-republik-quynh-nguyen-nha-sang-lap-the-nguyen-art-foundation.html",
    excerpt: "An interview with Quynh Nguyen on how MoT+++ and Sàn Art bring the A. Farm international residency to international forums — building a democratic forum for art unprecedented among Vietnamese art institutions.",
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
    outlet: "Vietcetera",
    title: "Start Them Young: Nguyen Art Foundation On Nurturing The Next Generation Of Artists And Collectors",
    date: "September 28, 2020",
    url: "https://vietcetera.com/en/start-them-young-nguyen-art-foundation-on-nurturing-the-next-generation-of-artists-and-collectors",
    excerpt: "The Nguyen Art Foundation on its partnership with MoT+++ and Sàn Art in initiating A. Farm — an art residency that brought IB Arts students to meet artists and observe their creative processes.",
    tag: "a.Farm",
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
    outlet: "Art & Market",
    title: "Conversation with Quynh Nguyen",
    date: "February 17, 2020",
    url: "https://www.artandmarket.net/conversation/2020/02/17/conversation-with-quynh-nguyen",
    excerpt: "A. Farm is an international art residency conceived by Thanh Tran Ha of MoT+++ and Dinh Q. Lê of Sàn Art, with the full support of the Nguyen Art Foundation — offered out of a former perfume factory in Ho Chi Minh City.",
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
    outlet: "Vietcetera",
    title: "Cultural Trends In Vietnam 2019: Seven Experts Share Their Opinions",
    date: "2019",
    url: "https://vietcetera.vn/en/cultural-trends-in-vietnam-2019-seven-experts-share-their-opinions",
    excerpt: "Nguyen Art Foundation, Sàn Art, and MoT+++ jointly launched the A. Farm arts and residency space.",
    tag: "a.Farm",
  },
  {
    outlet: "Vietcetera",
    title: "Vietnamese Conceptual Art: Four Young Artists To Watch",
    date: "September 2018",
    url: "https://vietcetera.com/en/vietnamese-conceptual-art-four-young-artists-to-watch",
    excerpt: "The Vietnamese conceptual art scene in Ho Chi Minh City is gaining traction — MoT+++ underwent a major rebranding in 2017 and co-founded A. Farm, a new international art residency, in 2018.",
    tag: "mot+++",
  },
  {
    outlet: "ArtAsiaPacific",
    title: "Hạt | Tim",
    date: "June 14, 2016",
    url: "https://www.artasiapacific.com/shows/h-t-tim/",
    excerpt: "Review of a two-woman show by Lê Hiền Minh and Cam Xanh at Dia Projects, Ho Chi Minh City — the artist-run space that became MoT+++. Cam Xanh's installation recasts Christ and Mary Magdalene as equals, critiquing the burden of guilt placed on women by religious patriarchy.",
    tag: "mot+++",
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
            <div className="press-row-inner">
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
