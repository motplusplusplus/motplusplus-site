import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Collapsible from "@/components/Collapsible";

const R2 = "https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/retreat";
const APPLY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd6NHVpUFh7YOPGhACxrJtQgrfsrD1_daf4F__OvK0ZJP85wg/viewform?usp=sharing&ouid=113890478710303560056";

const IMAGES = {
  hero: `${R2}/retreat-1.jpg`,
  davidWillis: `${R2}/retreat-2.jpg`,
  davidWillis2: `https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/artists/david-willis/portrait.jpg`,
  afarm: `${R2}/retreat-3.jpg`,
  hotel: `${R2}/retreat-4.jpg`,
  coreProgram: `${R2}/retreat-5.jpg`,
};

export const metadata: Metadata = {
  title: "a.Farm Saigon Artist Intensive Retreat",
  description:
    "A one-week critical intensive for contemporary artists in Ho Chi Minh City. Aug. 22–28, 2026 — individual consultations, group critiques, and exchange with the mot+++ and a.farm communities. USD 3,000 per artist.",
  openGraph: {
    title: "a.Farm Saigon Artist Intensive Retreat — MoT+++",
    description:
      "A one-week critical intensive for contemporary artists in Ho Chi Minh City. Aug. 22–28, 2026.",
    url: "https://motplusplusplus.com/afarm/retreat",
    images: [{ url: IMAGES.hero, width: 1600, height: 900 }],
  },
  alternates: { canonical: "https://motplusplusplus.com/afarm/retreat" },
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  color: "#999999",
  letterSpacing: "0.08em",
  marginBottom: "20px",
};

const body: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.85,
  color: "#444444",
  marginBottom: "20px",
};

function ApplyButton({ label = "apply now", style }: { label?: string; style?: React.CSSProperties }) {
  return (
    <a
      href={APPLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        fontSize: "15px",
        fontWeight: 400,
        color: "#ffffff",
        backgroundColor: "#111111",
        padding: "14px 32px",
        ...style,
      }}
    >
      {label}
    </a>
  );
}

function SectionBanner({
  src,
  alt,
  eyebrow: bannerEyebrow,
  title,
  subtitle,
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  objectPosition?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "50vh",
        minHeight: "320px",
        overflow: "hidden",
        backgroundColor: "#111111",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition, display: "block", opacity: 0.72 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.78) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "14px",
            display: "block",
          }}
        >
          {bannerEyebrow}
        </span>
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            maxWidth: "900px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "10px", fontWeight: 300 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function ContentBlock({ children, maxWidth = "680px" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "56px 24px 80px" }}>
      <div style={{ maxWidth }}>{children}</div>
    </div>
  );
}

export default function RetreatPage() {
  return (
    <>
      {/* hero */}
      <Reveal>
        <SectionBanner
        src={IMAGES.hero}
        alt="presentation at the a.farm + mot+++ artist retreat"
        eyebrow="a.farm × mot+++"
        title="a.farm saigon artist intensive retreat"
        subtitle="aug. 22–28, 2026"
      />
      </Reveal>
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="720px">
        <p style={body}>
          a one-week critical intensive for contemporary artists seeking rigorous feedback,
          deeper critical engagement, and clearer positioning within the contemporary art
          field. designed for artists at various stages of their careers, combining
          intensive one-on-one meetings, group critiques, and informal discussions with
          artists, curators, and cultural practitioners from the mot+++ and a.farm
          communities.
        </p>
        <p style={body}>
          the program will take place on august 22 through 28. the deadline for
          application is july 30.
        </p>
        <p style={{ ...body, marginBottom: "32px" }}>
          total cost: usd 3,000 per artist. includes seven nights accommodation, daily
          breakfasts and dinners, and all program activities.
        </p>
        <ApplyButton />
      </ContentBlock>
      </Reveal>

      {/* organized by — david willis */}
      <Reveal>
        <SectionBanner
        src={IMAGES.davidWillis}
        alt="a.farm + mot+++ artist retreat"
        objectPosition="center 38%"
        eyebrow="organized by"
        title="david willis"
        subtitle="curator, critic & art advisor"
      />
      </Reveal>
      <Reveal delay={0.12}>
        <ContentBlock>
        <p style={body}>
          <Link href="/profiles/david-willis/" style={{ color: "#111111" }}>
            david willis
          </Link>{" "}
          is a writer, curator, and art advisor who splits his time between new york,
          lisbon, and ho chi minh city. he holds an mfa in art criticism and writing from
          the school of visual arts and a ba in cultural anthropology from columbia
          university. after launching his career at galleries such as gagosian and pace in
          new york city, he spent a decade in vietnam and thailand, developing a
          specialization in southeast asian contemporary art. his writing has been
          published by numerous respected outlets including the brooklyn rail, art asia
          pacific, art &amp; market, art basel stories, and umbigo magazine. david served
          as the original curator of a.farm when it was founded in 2018, and later
          returned as a curator resident in 2024 with the sponsorship of the aura art
          foundation. he continues to collaborate with mot+++ &amp; a.farm as a curator on
          various projects and initiatives.
        </p>
        <Link
          href="/profiles/david-willis/"
          style={{
            display: "inline-block",
            fontSize: "13px",
            color: "#999999",
            letterSpacing: "0.04em",
            marginBottom: "32px",
          }}
        >
          view david&apos;s full profile →
        </Link>
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "28px", display: "flex", flexWrap: "wrap", gap: "12px 32px" }}>
          <a
            href="https://www.instagram.com/willisartadvisory/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "13px", color: "#888888" }}
          >
            instagram — @willisartadvisory
          </a>
          <a
            href="https://www.linkedin.com/in/david-alexander-willis-74146866/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "13px", color: "#888888" }}
          >
            cv / linkedin
          </a>
          <a
            href="mailto:dave.a.willis@gmail.com"
            style={{ fontSize: "13px", color: "#888888" }}
          >
            dave.a.willis@gmail.com
          </a>
        </div>
      </ContentBlock>
      </Reveal>

      {/* institutional host — a.farm */}
      <Reveal>
        <SectionBanner
        src={IMAGES.afarm}
        alt="a.farm exhibition space"
        eyebrow="institutional host"
        title="a.farm international art residency"
      />
      </Reveal>
      <Reveal delay={0.12}>
        <ContentBlock>
        <p style={body}>
          <Link href="/afarm/" style={{ color: "#111111" }}>a.farm</Link> was founded in
          2018 as a collaboration between sàn art, mot+++, and the nguyễn art foundation.
          it is now administered exclusively by mot+++, one of the top
          avant-garde art organizations in saigon (ho chi minh city) over the past decade.
          working with a.farm provides participants exclusive access to many of saigon&apos;s
          leading artists, collectors, and art professionals.
        </p>
      </ContentBlock>
      </Reveal>

      {/* accommodation — amanaki thao dien hotel */}
      <Reveal>
        <SectionBanner
        src={IMAGES.hotel}
        alt="amanaki thao dien hotel"
        eyebrow="accommodation"
        title="amanaki thao dien hotel"
      />
      </Reveal>
      <Reveal delay={0.12}>
        <ContentBlock>
        <p style={body}>
          participants will stay at{" "}
          <Link href="/afarm/hotel/" style={{ color: "#111111" }}>amanaki thao dien hotel</Link>,
          a contemporary boutique hotel located in thao dien, one of ho chi minh city&apos;s
          most vibrant and internationally connected neighborhoods. the hotel offers
          luxurious accommodation with a swimming pool, fitness facilities, wellness
          amenities, and easy access to cafés, restaurants, galleries, and cultural
          spaces. located approximately twenty minutes from central ho chi minh city,
          thao dien has become home to a mixed community of expats and wealthy
          vietnamese professionals — a calm residential atmosphere with close proximity
          to the city&apos;s leading contemporary art spaces. seven nights accommodation,
          daily breakfast, and daily dinner are included in the program fee.
        </p>
        <p style={{ marginTop: "4px" }}>
          <Link
            href="/afarm/hotel/"
            style={{ fontSize: "14px", color: "#111111", borderBottom: "1px solid #cccccc", paddingBottom: "2px", textDecoration: "none" }}
          >
            more about amanaki thao dien hotel →
          </Link>
        </p>
      </ContentBlock>
      </Reveal>

      {/* core program — critical intensive */}
      <Reveal>
        <SectionBanner
        src={IMAGES.coreProgram}
        alt="a.farm + mot+++ community dinner"
        eyebrow="core program"
        title="critical intensive"
      />
      </Reveal>
      <Reveal delay={0.12}>
        <ContentBlock>
        <p style={body}>
          the core of the program takes place over four intensive working days. each
          morning, two participants receive individual one-hour consultations with david
          willis, covering current work, portfolio development, artist statements,
          exhibition strategies, and long-term professional goals. each afternoon, two
          artists participate in extended group critiques (~90 minutes each), involving
          all participants, invited artists, and guest contributors. by the end of day 5,
          all eight participants will have received both an individual consultation and a
          dedicated group critique. each evening concludes with a communal dinner shared
          with members of the mot+++ and a.farm artist community.
        </p>
        <ApplyButton />
      </ContentBlock>
      </Reveal>

      {/* day-by-day program */}
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="720px">
        <p style={eyebrow}>day-by-day program</p>

        <Collapsible label="show full schedule" openLabel="hide full schedule">

        <p style={{ ...body, fontWeight: 400, color: "#222222", marginBottom: "8px" }}>
          day 1 — arrival &amp; introductions
        </p>
        <p style={body}>
          participants arrive in ho chi minh city and settle into their accommodation.
          the evening begins with a welcome dinner and introductions, providing an
          opportunity to meet fellow participants, discuss expectations for the week
          ahead, and become acquainted with the a.farm and mot+++ communities.
        </p>

        <p style={{ ...body, fontWeight: 400, color: "#222222", marginBottom: "8px" }}>
          days 2–5 — individual consultations &amp; group critiques
        </p>
        <p style={body}>
          the core of the program takes place over four intensive working days.
        </p>

        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "10px" }}>
          morning sessions
        </p>
        <p style={body}>
          each morning, two participants will receive individual one-hour consultations
          with david willis. across the four days, every artist will receive a dedicated
          one-on-one session focused on their practice, current body of work, future
          directions, portfolio development, artist statements, exhibition strategies,
          and long-term professional goals. these conversations will address both
          professional development and the work itself, examining its strengths,
          limitations, recurring concerns, conceptual foundations, and potential avenues
          for future growth.
        </p>

        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "10px" }}>
          afternoon critiques
        </p>
        <p style={body}>
          each afternoon, two artists will participate in extended group critiques
          lasting approximately ninety minutes each. these sessions will involve all
          participants, invited artists, and guest contributors where available.
          discussions will focus on close analysis of the work, encouraging rigorous
          feedback, multiple perspectives, and constructive dialogue about artistic
          development and future possibilities. by the end of day 5, all eight
          participants will have received both an individual consultation and a
          dedicated group critique.
        </p>

        <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.06em", marginBottom: "10px" }}>
          evening community dinners
        </p>
        <p style={body}>
          each evening concludes with a communal dinner shared with members of the
          mot+++ and a.farm artist community. these informal gatherings provide
          opportunities for conversation, exchange, networking, and continued reflection
          outside the critique setting.
        </p>

        <p style={{ ...body, fontWeight: 400, color: "#222222", marginBottom: "8px" }}>
          day 6 — contemporary art ecosystems
        </p>
        <p style={body}>
          the morning will be left open for participants to explore or relax as they see
          fit. in the afternoon, participants will visit a selection of contemporary art
          spaces, galleries, project spaces, collections, and/or artists&apos; studios in ho
          chi minh city, offering insight into the local cultural ecosystem and
          opportunities to continue conversations beyond the seminar format. community
          dinner in the evening.
        </p>

        <p style={{ ...body, fontWeight: 400, color: "#222222", marginBottom: "8px" }}>
          day 7 — further art excursions
        </p>
        <p style={body}>
          the final morning will also be left open for participants to spend freely. in
          the afternoon, participants will visit artist studios or exhibitions, depending
          on what is on display. the program concludes with a final dinner before
          departures.
        </p>
        <p style={body}>
          participants leave with a clearer understanding of their practice, a stronger
          sense of direction, and ongoing connections with fellow artists and the wider
          a.farm and mot+++ community.
        </p>

        </Collapsible>
      </ContentBlock>
      </Reveal>

      {/* topics */}
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="720px">
        <p style={eyebrow}>topics may include:</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {[
            "critical discussion of current work",
            "portfolio design optimisation",
            "artist statements and text editing",
            "identifying strengths, weaknesses, and recurring concerns within a practice",
            "pricing artworks and building a sustainable studio practice",
            "strategies for working with galleries and curators",
            "exhibition installation & framing strategies, both literal and figurative",
            "advice regarding residencies and international opportunities",
            "future directions, professional positioning and career development",
            "prevalent trends and issues within contemporary art discourse",
          ].map((item) => (
            <li key={item} style={{ fontSize: "14px", lineHeight: 1.7, color: "#444444", marginBottom: "8px" }}>
              — {item}
            </li>
          ))}
        </ul>
      </ContentBlock>
      </Reveal>

      {/* what's included / not included */}
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="900px">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "48px",
          }}
        >
          <div>
            <p style={eyebrow}>included</p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {[
                "seven nights accommodation at amanaki thao dien hotel",
                "daily breakfast",
                "daily dinner",
                "individual consultations with david willis",
                "group critiques and discussions",
                "studio visits, gallery visits, and cultural excursions",
                "community dinners and events",
                "all program activities",
              ].map((item) => (
                <li key={item} style={{ fontSize: "14px", lineHeight: 1.7, color: "#444444", marginBottom: "8px" }}>
                  — {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p style={eyebrow}>not included</p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {[
                "international or domestic flights",
                "visa fees",
                "travel insurance",
                "lunches",
                "personal expenses",
              ].map((item) => (
                <li key={item} style={{ fontSize: "14px", lineHeight: 1.7, color: "#444444", marginBottom: "8px" }}>
                  — {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ContentBlock>
      </Reveal>

      {/* apply */}
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="720px">
        <p style={eyebrow}>apply</p>
        <p style={{ ...body, fontSize: "17px", color: "#222222" }}>
          applications are now open. maximum 8 artists. program fee: usd 3,000.
        </p>
        <p style={{ ...body, fontSize: "17px", color: "#222222" }}>
          the deadline for application is july 30.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
          <ApplyButton />
          <Link href="/profiles/david-willis/" aria-label="david willis — motcyclopedia profile">
            <img
              src={IMAGES.davidWillis2}
              alt="david willis"
              style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "50%", display: "block" }}
            />
          </Link>
        </div>
        <p style={{ fontSize: "13px", color: "#888888" }}>
          for questions, contact david willis directly —{" "}
          <a href="mailto:dave.a.willis@gmail.com" style={{ color: "#888888" }}>
            dave.a.willis@gmail.com
          </a>{" "}
          or{" "}
          <a href="mailto:a.farm.saigon@gmail.com" style={{ color: "#888888" }}>
            a.farm.saigon@gmail.com
          </a>
        </p>
      </ContentBlock>
      </Reveal>

      {/* annual program note */}
      <Reveal delay={0.12}>
        <ContentBlock maxWidth="640px">
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "32px" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.8, color: "#999999" }}>
            the a.farm saigon artist intensive is envisioned as an annual program. future
            editions may take different forms, involve different guest contributors, or
            focus on particular themes. each edition will remain committed to serious
            critical dialogue, professional development, and meaningful exchange between
            artists.
          </p>
        </div>
      </ContentBlock>
      </Reveal>
    </>
  );
}
