import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ogImage } from "@/lib/og";
import MailtoContactForm from "@/components/MailtoContactForm";
import { CONTACTS } from "@/lib/contacts";

export const metadata: Metadata = {
  title: "links",
  description: "MoT+++ links — +a.Farm, +1 trash, events, +1 museum by any other name, MoTcyclopedia, MoTsound, and contact.",
  openGraph: {
    title: "links | MoT+++",
    description: "MoT+++ links — +a.Farm, +1 trash, events, +1 museum by any other name, MoTcyclopedia, MoTsound, and contact.",
    url: "https://motplusplusplus.com/links",
    images: [ogImage(undefined, "MoT+++")],
  },
  twitter: {
    card: "summary_large_image",
    title: "links | MoT+++",
    description: "MoT+++ links — +a.Farm, +1 trash, events, +1 museum by any other name, MoTcyclopedia, MoTsound, and contact.",
    images: [ogImage(undefined, "MoT+++").url],
  },
  alternates: { canonical: "https://motplusplusplus.com/links" },
};

const programLinks = [
  { label: "+a.Farm", href: "/afarm" },
  { label: "+1 trash", href: "/trash" },
  { label: "events", href: "/events" },
  { label: "+1 museum by any other name", href: "/museum" },
  { label: "MoTcyclopedia", href: "/profiles" },
  { label: "MoTsound", href: "/sound" },
  { label: "instagram @motplusplusplus", href: "https://www.instagram.com/motplusplusplus", external: true },
  { label: "instagram @a.farm.saigon", href: "https://www.instagram.com/a.farm.saigon", external: true },
];

export default function LinksPage() {
  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "56px 24px 96px" }}>

      {/* logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "48px" }}>
        <Image
          src="/motpluspluspluslogo.jpg"
          alt="MoT+++"
          width={112}
          height={112}
          style={{ objectFit: "contain" }}
          unoptimized
        />
        <h1 style={{ fontSize: "13px", fontWeight: 400, color: "#767676", letterSpacing: "0.06em", marginTop: "16px", textAlign: "center" }}>
          contemporary art &amp; artist residency, ho chi minh city
        </h1>
      </div>

      {/* program links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "64px" }}>
        {programLinks.map((item) => {
          const linkStyle = {
            display: "block",
            textAlign: "center" as const,
            fontSize: "18px",
            fontWeight: 300,
            color: "#111111",
            border: "1px solid #cccccc",
            borderRadius: "4px",
            padding: "20px 16px",
          };
          return item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} style={linkStyle}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* contact forms */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", display: "flex", flexDirection: "column", gap: "64px" }}>
        <MailtoContactForm heading="contact mot+++" recipient={CONTACTS.general} messagePlaceholder="enter your message" />
        <MailtoContactForm heading="contact a.farm" recipient={CONTACTS.residency} messagePlaceholder="i'd like more info on your residency" />
      </div>

    </div>
  );
}
