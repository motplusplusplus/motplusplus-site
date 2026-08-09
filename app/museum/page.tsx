import { preconnect } from 'react-dom';
import MuseumMapWrapper from '@/components/MuseumMapWrapper';
import Collapsible from '@/components/Collapsible';
import Link from "next/link";
import type { Metadata } from "next";
import { ogImage } from "@/lib/og";
import { CONTACTS } from "@/lib/contacts";

export const metadata: Metadata = {
  title: "+1 museum by any other name | contemporary art museum, ho chi minh city",
  description:
    "The only contemporary art museum in Ho Chi Minh City without walls. MoT+++ places artworks across Saigon — in private homes, businesses, and studios — treating the city itself as its architecture. The collection is real, documented, and curated.",
  keywords: [
    "art museum ho chi minh city",
    "contemporary art museum saigon",
    "art museum vietnam",
    "contemporary art hcmc",
    "saigon art museum",
    "MoT+++",
    "+1 museum",
    "contemporary art space vietnam",
  ],
  openGraph: {
    title: "+1 museum by any other name | contemporary art museum, ho chi minh city",
    description: "The only contemporary art museum in Ho Chi Minh City without walls. Artworks placed across Saigon in private homes, businesses, and studios.",
    url: "https://motplusplusplus.com/museum",
    images: [ogImage(undefined, "MoT+++")],
  },
  twitter: {
    card: "summary_large_image",
    title: "+1 museum by any other name | contemporary art museum, ho chi minh city",
    description: "The only contemporary art museum in Ho Chi Minh City without walls. Artworks placed across Saigon in private homes, businesses, and studios.",
    images: [ogImage(undefined, "MoT+++").url],
  },
  alternates: { canonical: "https://motplusplusplus.com/museum" },
};

const bodyStyle = { fontSize: '15px', lineHeight: 1.85, color: '#444444', marginBottom: '16px' } as const;
const sectionLabelStyle = { fontSize: '11px', color: '#767676', letterSpacing: '0.1em', marginBottom: '16px' } as const;

export default function MuseumPage() {
  // Mapbox GL fetches its style/sprite/glyphs/tiles from api.mapbox.com and reports
  // telemetry to events.mapbox.com — warm both connections ahead of the map's JS load.
  preconnect("https://api.mapbox.com", { crossOrigin: "anonymous" });
  preconnect("https://events.mapbox.com", { crossOrigin: "anonymous" });

  return (
    <>
      {/* page title */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 32px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em",
          marginBottom: "16px",
        }}>
          +1 museum by any other name
        </h1>
        <p style={{ fontSize: "13px", color: "#767676", letterSpacing: "0.06em", lineHeight: 1.8 }}>
          mot | mót | hoard
        </p>
        <p style={{ fontSize: "14px", color: "#767676", marginTop: "8px" }}>
          hosting one work, in one place anywhere in the world
        </p>
      </div>

      {/* interactive map + the collection (client, loads after this HTML paints) */}
      <MuseumMapWrapper />

      {/* concept + manifesto — server-rendered so the page's substance is in the
          first HTML paint (and visible to search engines), independent of the
          ~1.7MB map chunk that used to carry all of this */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: '720px' }}>

          <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 36px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '32px' }}>
            +1 museum by any other name
          </h2>
          <p style={{ ...bodyStyle, marginBottom: '20px' }}>
            +1 museum by any other name is a decentralized collection sited across the city, in private homes, businesses, studios, and public spaces. the works are real, documented, and curated. what is unconventional is where they live and what it takes to see them. each work has its own location, its own host, and its own conditions of access: some are freely visible, others require a phone call, an introduction, a time of day. the platform maps all of this and tells you what you need to know to get there.
          </p>
          <p style={{ ...bodyStyle, marginBottom: '20px' }}>
            navigating the collection means navigating the world. someone might plan an afternoon across several works in different neighborhoods, or discover a piece while already somewhere else entirely. the map is the floor plan. the city is the building.
          </p>
          <p style={{ ...bodyStyle, marginBottom: '48px' }}>
            works enter the collection through artists, through collectors who open their spaces, and through the a.Farm residency program. the collection grows as the network does.
          </p>

          {/* manifesto */}
          <div id="manifesto" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '48px', scrollMarginTop: '80px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 400, letterSpacing: '0.04em', color: '#111111', margin: '0 0 12px' }}>
              a manifesto for virgin lands
            </h3>
            <Collapsible label="read the manifesto" openLabel="close the manifesto">
              <p style={bodyStyle}>
                ho chi minh city has no contemporary art museum.
              </p>
              <p style={bodyStyle}>
                this is not a failure. it is not a missing building. it is not a gap on a cultural map waiting to be filled by a foreign foundation or a state-approved monument.
              </p>
              <p style={bodyStyle}>
                it is virgin land.
              </p>
              <p style={bodyStyle}>
                untouched by the monumental classical model. unburdened by legacy. uncaptured by the corruption of power, the domination of ownership, the agenda of any flag or party.
                what grows here will not be a copy of the white cube. it will be something else entirely.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                +1 museum by any other name is that something.
              </p>

              <p style={sectionLabelStyle}>i. the museum without walls</p>
              <p style={bodyStyle}>
                there is no building. instead, +1 is a decentralized collection sited across the city: in private homes, businesses, studios, and public spaces. the works are real. they are documented. they are curated. what is unconventional is where they live and what it takes to see them.
              </p>
              <p style={bodyStyle}>
                each work has its own location, its own host, its own conditions of access. some are freely visible. others require a phone call, an introduction, a time of day. one piece can only be seen at dawn. another only during rain.
              </p>
              <p style={bodyStyle}>
                navigating the collection means navigating the world. someone plans an afternoon across five works in three neighborhoods. someone else discovers a piece while already somewhere else entirely. the map is the floor plan. the city is the building.
              </p>
              <p style={bodyStyle}>
                there is no central lobby, no admissions desk, no gift shop, no board of directors to be captured by developers. +1 cannot be closed. it cannot be captured. it has no single point of control.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                works enter the collection through artists, through collectors who open their spaces, and through the a.Farm residency program. the collection grows as the network does.
              </p>

              <p style={sectionLabelStyle}>ii. the unheld exhibition</p>
              <p style={bodyStyle}>
                +1 also makes room for the unheld exhibition: art that appears where attention lands. a drawing on a steamed window. a melody hummed into a busy market and never repeated. a sentence scratched into wet cement and gone by morning. these are not works in the institutional sense. they have no permanent form. they arise, they meet a witness, they dissolve.
              </p>
              <p style={bodyStyle}>
                art as event, not object. as gift, not commodity. as breath, not property.
              </p>
              <p style={bodyStyle}>
                no one can sell the result. if a political party claims it, it becomes propaganda. if a corporation buys the residue, it becomes a product. if an artist insists on credit or control, the work collapses into ego. art survives only in the absence of domination.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                you cannot build this concept. building implies control. the only way to give rise to art itself is to stop trying to give rise to it. to make, to vanish, to let the making stand alone.
                +1 holds space for that vanishing.
              </p>

              <p style={sectionLabelStyle}>iii. the virgin lands</p>
              <p style={bodyStyle}>
                there are cities across the world with no contemporary art museum. ho chi minh city. phnom penh. yangon. dhaka. addis ababa. karachi. lagos. they are already cultural producers, just without the monumental container.
              </p>
              <p style={bodyStyle}>
                each is virgin land. each can invent its own logic from the ground up, with one shared principle: innovation over monument.
              </p>
              <p style={bodyStyle}>
                monument: permanent, heavy, expensive, exclusive, static.<br />
                innovation: temporary, light, low-cost, porous, adaptive.
              </p>
              <p style={bodyStyle}>
                +1 expands through a simple protocol. survey the territory first: map what already exists, artist-run spaces, cafe galleries, studio open days, street interventions. the map is the gift back to the city. then introduce the lightest possible structure, not a building, not a foundation, but a protocol: any space can host art for any duration, any person can be a host, no permanent accession, no ownership. connect virgin lands to each other.
              </p>
              <p style={bodyStyle}>
                a residency sends an artist from ho chi minh city to lagos, not to a studio but to live in someone&apos;s home and leave a work in a local market. a traveling library of manifestos: each city writes its own, passes it on.
              </p>
              <p style={bodyStyle}>
                the museum exists as a time-based event, present for three months in any fixed form, then gone. then reappearing somewhere else. no permanent address. you have to follow it.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                every six months, one question: do we still need to exist? if yes, it reinvents. if no, it dissolves. no legacy. no endowment. no ego.
              </p>

              <p style={sectionLabelStyle}>iv. why start here. why start now.</p>
              <p style={bodyStyle}>
                ho chi minh city has no contemporary art museum. that absence is not a problem to solve. it is a platform to build from.
              </p>
              <p style={bodyStyle}>
                the monumental classical concept is exhausted. it produces debt, exclusion, spectacle, and corruption. the virgin lands can leapfrog it entirely, just as mobile phones leapfrogged landlines.
              </p>
              <p style={bodyStyle}>
                you do not need a building to have a museum. you do not need a collection to have art. you do not need permission to show a work.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                one host, one work, one visitor at a time. then another. then another.<br />
                the map grows. the city becomes the building. the world becomes the collection.<br />
                no walls. no owners. no domination. only art, rising where it is needed most.
              </p>

              <p style={sectionLabelStyle}>v. the name</p>
              <p style={bodyStyle}>
                +1 museum by any other name.
              </p>
              <p style={bodyStyle}>
                the &ldquo;+1&rdquo; is an invitation. you are always the next guest, the next host, the next work. the museum grows by one every time someone participates.
              </p>
              <p style={bodyStyle}>
                &ldquo;by any other name&rdquo; means it refuses to be a brand. call it what you want. it has no trademark, no logo, no director to interview.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '40px' }}>
                it is simply what happens when people in a city without a contemporary art museum decide to show art outside the monument.
              </p>
              <p style={{ ...bodyStyle, marginBottom: '32px' }}>
                you are already part of it. no application. no fee. no permission.
              </p>

              <p style={{ fontSize: '14px', color: '#767676', lineHeight: 1.8 }}>
                get in touch at{' '}
                <a href={`mailto:${CONTACTS.museum}`} style={{ color: '#666666', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{CONTACTS.museum}</a>.
              </p>
            </Collapsible>
          </div>

        </div>
      </div>

      {/* hosting CTA */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 24px 96px", borderTop: "1px solid #e5e5e5" }}>
        <p style={{ fontSize: "15px", color: "#444444", maxWidth: "480px", lineHeight: 1.7, marginBottom: "24px" }}>
          interested in hosting a work in your space, anywhere in the world.
        </p>
        <Link
          href="/museum/inquire"
          style={{
            display: "inline-block",
            fontSize: "15px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "14px 32px",
            textDecoration: "none",
          }}
        >
          inquire about hosting
        </Link>
      </div>
    </>
  );
}
