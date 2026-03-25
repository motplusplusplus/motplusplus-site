import Link from "next/link";

const members = [
  {
    slug: "aliansyah-caniago",
    name: "Aliansyah Caniago",
    origin: "Indonesia, b. 1987",
    website: "aliansyahcaniago.yolasite.com",
    bio: "an interdisciplinary artist whose work critically examines the intersections of power, social injustice, and environmental crises. he completed a Master of Arts in Art and Ecology from Goldsmiths, University of London. his practice engages with the idea of central (metropole) and periphery (satellite) and works with communities affected by industrialisation in Java and Sumatera, through studio-based practices, site-specific installations, and durational performances exploring land-use conflict, migration, urbanisation, waste, and contested spaces. he investigates Barus, a North Sumatran port town connected to his family history and the extinction of the Camphor Tree. co-founder of Unground Collective (London), Gerilya Artist Collective (Bandung), and MoT+++ (Ho Chi Minh). exhibitions include Tainan Art Museum (2024), MuseumQuartier (2024), MUMA-Monash University Museum of Art (2018), Jakarta Biennale (2017), 14th Lyon Biennale (2017), Documenta 15 (2022).",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-02.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/aliansyah-caniago/work-07.jpg",
    ],
  },
  {
    slug: "cam-xanh",
    name: "Cam Xanh",
    origin: "Vietnam, b. 1977",
    website: "camxanh.net",
    bio: "Cam Xanh (real name: Tran Thanh Ha, b.1977) is a conceptual artist from Vietnam based in Saigon (Ho Chi Minh City). she co-founded the Post Vidai Collection — the first collection dedicated to contemporary Vietnamese art — in 2004 and has acted as its Director / Curator since then. in 2014 she co-founded the Dia Projects which morphed into MoT+++. she co-founded the MoT collective, a.Farm, and the Nguyen Art Foundation. she began making art in 2012 under the pseudonym Cam Xanh and has exhibited in Vietnam and internationally. her artist name Cam Xanh, which translates as Green Orange, exemplifies the minimalist and playful nature of her works.",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-02.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cam-xanh/work-07.jpg",
    ],
  },
  {
    slug: "cian-duggan",
    name: "Cian Duggan",
    origin: "Ireland",
    website: "cian-duggan.com",
    bio: "explores relationships between human and non-human elements, temporal and eternal concepts. his work questions presence, absence, and temporal structures while examining connections between natural and supernatural forces. his ongoing series Mediums (2020—ongoing) features a recurring \"universal form\" that transcends specific time periods and spatial boundaries. works are UV printed onto plexiglass that shifts appearance based on light, space, and the presence of people and animals. the practice views time, environment, the living, and the non-living as all in a constant state of flux.",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-02.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/cian-duggan/work-07.jpg",
    ],
  },
  {
    slug: "kim-duy",
    name: "Kim Duy",
    origin: "Vietnam, b. 1987",
    website: "nguyenkdnguyenkd.wixsite.com/website-15",
    bio: "Kim Duy was born in Hanoi, Vietnam in 1987. Duy's artistic practice experimented with a variety of objects and materials such as printers, ballpoint pens, markers, etc. to more traditional materials such as pencil and paper. his work explores themes of time, space, history, and the performative nature of still images through a multidisciplinary practice. he works with modest materials like paper and uses text as an allegory for how information is transformed through individual subjectivity. the work avoids direct political commentary and instead examines what art can accomplish in society through a focus on art-making processes.",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-02.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/kim-duy/work-07.jpg",
    ],
  },
  {
    slug: "le-phi-long",
    name: "Le Phi Long",
    origin: "Vietnam, b. 1988",
    website: "philongart-studio.blogspot.com",
    bio: "Le Phi Long, born in 1988, is a visual artist based in Ho Chi Minh City, Vietnam. he graduated in interior design from Hue Fine Art University in 2012. Long's art encompasses paintings, site-specific installations, and conceptual works, deeply rooted in historical and geographical insights. he examines survival, cultural transformation, and their impact on society, particularly his generation, exploring global and local narratives through geography, history, and religion. his Dong Duong Lang Du project (since 2016) examines French Indochina's history regarding identity and migration. co-founded eNAME Art Center in Hanoi (2012) and Lamvien art center in Dalat (2017). residencies include Sàn Art Vietnam (2013), Bamboo Curtain Studio Taiwan (2015), Asian Highway Project Korea (2018), Cité Internationale des Arts Paris (2020). MoT collective member since 2020.",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-02.png",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-07.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-08.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-09.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/le-phi-long/work-10.png",
    ],
  },
  {
    slug: "matthew-brannon",
    name: "Matthew Brannon",
    origin: "USA, b. 1971",
    website: "matthewbrannon.com",
    bio: "Matthew Brannon (b. 1971, St. Maries, Idaho) is recognized for letterpress and screen prints combining images and text. his work employs traditional silkscreen techniques and hand-painting, presenting a stripped-down aesthetic evoking mass production and marketing design. his artistic practice extends across painting, sculpture, video, and installation. since 2015 he has developed an ongoing research project titled Concerning Vietnam exploring the Vietnam/American War. works appear in the Hammer Museum (Los Angeles), Whitney Museum of American Art (New York), and Museum of Modern Art (New York). exhibitions internationally across Belgium, Canada, Germany, Italy, Japan, Mexico, Norway, Spain, Switzerland, UK, and USA. B.A. from University of California Los Angeles; M.F.A. from Columbia University New York. joined MoT+++ collective in 2020. based in New York.",
    portrait: null,
    images: [],
  },
  {
    slug: "wu-chi-tsung",
    name: "Wu Chi-Tsung",
    origin: "Taiwan, b. 1981",
    website: "wuchitsung.com",
    bio: "Wu Chi-Tsung was born in 1981 in Taipei. Wu received his Bachelor of Fine Arts from the Taipei National University of the Arts in 2004. he currently lives and works in Taipei, Taiwan and Berlin, Germany. his practice spans photography, video, installation, painting, and set design, blending Eastern and Western artistic traditions. daily objects serve as inspiration, transformed into poetic imagery. awards include Taipei Arts Award (2003), shortlisted for Artes Mundi (2006), WRO Media Art Biannual Award of Critics and Editors (2013), shortlisted for Prudential Eye Awards (2015), Liu Kuo Sung Ink Art Award (2019).",
    portrait: "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/portrait.jpg",
    images: [
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-01.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-02.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-03.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-04.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-05.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-06.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-07.png",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-08.jpg",
      "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/collective/wu-chi-tsung/work-09.jpg",
    ],
  },
];

export default function CollectivePage() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px" }}>

      {/* heading */}
      <div style={{ marginBottom: "56px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "20px",
          }}
        >
          mot+++ collective
        </h1>
        <p style={{ fontSize: "15px", color: "#666666", maxWidth: "520px", lineHeight: 1.7 }}>
          comprised of artists that share an affinity with MoT+++&rsquo;s philosophy.
        </p>
      </div>

      {/* member index */}
      <div
        style={{
          borderTop: "1px solid #e5e5e5",
          paddingTop: "32px",
          marginBottom: "72px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 32px",
        }}
      >
        {members.map((m) => (
          <a
            key={m.name}
            href={`#${m.name.toLowerCase().replace(/\s+/g, "-")}`}
            style={{ fontSize: "15px", color: "#888888", fontWeight: 300 }}
          >
            {m.name}
          </a>
        ))}
      </div>

      {/* member profiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {members.map((member, mi) => (
          <div
            key={member.name}
            id={member.name.toLowerCase().replace(/\s+/g, "-")}
            style={{
              borderTop: "1px solid #e5e5e5",
              paddingTop: "64px",
              paddingBottom: "64px",
            }}
          >
            {/* name + origin */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "48px",
                marginBottom: "48px",
                alignItems: "start",
              }}
            >
              {/* portrait */}
              <div>
                {member.portrait ? (
                  <img
                    src={member.portrait}
                    alt={member.name}
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      display: "block",
                      marginBottom: "16px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <p style={{ fontSize: "11px", color: "#cccccc", letterSpacing: "0.06em" }}>portrait</p>
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#aaaaaa", marginBottom: "4px" }}>{member.origin}</p>
                <a
                  href={`https://${member.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "12px", color: "#aaaaaa" }}
                >
                  {member.website}
                </a>
              </div>

              {/* bio */}
              <div>
                <div style={{ marginBottom: "20px", display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 300,
                      lineHeight: 1.2,
                      color: "#111111",
                    }}
                  >
                    {member.name}
                  </h2>
                  <Link
                    href={`/artists/${member.slug}`}
                    style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
                  >
                    artist profile ↗
                  </Link>
                </div>
                <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#444444" }}>
                  {member.bio}
                </p>
              </div>
            </div>

            {/* work images */}
            {member.images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "12px",
                }}
              >
                {member.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${member.name} — work ${i + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
