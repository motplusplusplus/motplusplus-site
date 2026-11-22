import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "photoswipe/style.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { CONTACTS } from "@/lib/contacts";

const OG_IMAGE = DEFAULT_OG_IMAGE;

// Captions, counts, chips and controls (2026-11-22). Self-hosted (no Google
// Fonts at build time): IBM Plex Mono Regular, subset to latin + Vietnamese,
// 22 KB. Licence: app/fonts/IBMPlexMono-LICENSE.txt (SIL OFL 1.1).
const mono = localFont({
  src: "./fonts/IBMPlexMono-Regular-subset.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-mono",
  // Not preloaded: captions are tiny and swap in; on a phone the first
  // work image should get that bandwidth (largest paint) instead.
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// viewport-fit=cover so env(safe-area-inset-*) reports the iPhone home
// indicator / notch; body pads left/right for landscape (globals.css), and
// fixed bottom UI (filter sheet, viewer caption) pads its bottom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Marks every <img> as it loads (capture phase, so it also sees loads that
// finish before React hydrates). Images fade in on data-l (globals.css).
const IMG_FADE_SCRIPT =
  "document.documentElement.classList.add('mot-fade');" +
  // Also a backstop for wrong stored sizes: if a loaded work image's real
  // shape differs from its box (.mot-img aspect-ratio), the box takes the
  // real shape, so an image is never cropped or left in a mis-shaped frame.
  "(function(){function m(e){var t=e.target;if(!t||t.tagName!=='IMG')return;t.setAttribute('data-l','');" +
  "var p=t.parentNode,w=t.naturalWidth,h=t.naturalHeight;" +
  "if(e.type==='load'&&w&&h&&p&&p.classList&&p.classList.contains('mot-img')&&!t.classList.contains('mot-img-ph')){" +
  "var a=t.getAttribute('width')/t.getAttribute('height');if(a&&Math.abs(a-w/h)/(w/h)>0.02){p.style.aspectRatio=w+' / '+h;p.setAttribute('data-fixed','')}}}" +
  "document.addEventListener('load',m,true);document.addEventListener('error',m,true)})();";

export const metadata: Metadata = {
  metadataBase: new URL("https://motplusplusplus.com"),
  title: {
    default: "MoT+++ | Contemporary Art & Artist Residency — Ho Chi Minh City",
    template: "%s | MoT+++",
  },
  description:
    "MoT+++ is an independent contemporary art organization and international artist residency in Ho Chi Minh City, Vietnam. +a.Farm pairs international residents with local artists across studios in Saigon.",
  keywords: [
    "artist residency vietnam",
    "artist residency ho chi minh city",
    "art residency saigon",
    "artist residency southeast asia",
    "contemporary art residency asia",
    "international artist residency",
    "art residency hcmc",
    "artist residency program vietnam",
    "MoT+++",
    "a.Farm residency",
    "contemporary art vietnam",
    "independent art space saigon",
  ],
  authors: [{ name: "MoT+++" }],
  creator: "MoT+++",
  publisher: "MoT+++",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://motplusplusplus.com",
    siteName: "MoT+++",
    title: "MoT+++ | Contemporary Art & Artist Residency — Ho Chi Minh City",
    description:
      "Independent contemporary art organization and international artist residency in Ho Chi Minh City, Vietnam. +a.Farm pairs international residents with local artists in Saigon studios.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "MoT+++" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoT+++ | Contemporary Art & Artist Residency — Ho Chi Minh City",
    description:
      "Independent contemporary art and international artist residency in Ho Chi Minh City, Vietnam.",
    images: [OG_IMAGE],
  },
  // NOTE: no `alternates.canonical` here on purpose. Next.js metadata is inherited
  // by every page that doesn't override `alternates`, so a root canonical in the
  // layout made /about, /events, /press, etc. all declare the homepage as their
  // canonical URL — telling search engines to deindex them. Per-page canonicals
  // belong on the pages themselves (the homepage sets its own in app/page.tsx).
  icons: { icon: "/favicon.svg" },
  verification: { google: "LcOHihQFLptj88QR3d-_1zxxu5GyCbmC-t3TtOFyfKE" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://motplusplusplus.com/#organization",
        name: "MoT+++",
        url: "https://motplusplusplus.com",
        logo: "https://motplusplusplus.com/motpluspluspluslogo.jpg",
        sameAs: ["https://www.instagram.com/motplusplusplus"],
        contactPoint: { "@type": "ContactPoint", email: CONTACTS.general, contactType: "general" },
        address: {
          "@type": "PostalAddress",
          streetAddress: "383 Nguyễn Duy Trinh, La Astoria Tower 2",
          addressLocality: "Ho Chi Minh City",
          addressCountry: "VN",
        },
      },
      {
        "@type": ["ArtGallery", "Museum"],
        "@id": "https://motplusplusplus.com/museum#museum",
        name: "+1 museum by any other name",
        alternateName: "MoT+++ Museum",
        description: "The only contemporary art museum in Ho Chi Minh City without walls. Artworks are placed across Saigon in private homes, businesses, and studios — treating the city itself as its architecture.",
        url: "https://motplusplusplus.com/museum",
        address: { "@type": "PostalAddress", addressLocality: "Ho Chi Minh City", addressCountry: "VN" },
        parentOrganization: { "@id": "https://motplusplusplus.com/#organization" },
        keywords: "contemporary art museum ho chi minh city, art museum saigon, art museum vietnam, contemporary art hcmc",
      },
      {
        "@type": "EducationalOccupationalProgram",
        "@id": "https://motplusplusplus.com/afarm#residency",
        name: "+a.Farm Artist Residency",
        description: "International artist residency in Ho Chi Minh City, Vietnam. Residents live and work alongside local hosting artists across studios in Saigon. From $3,000/month.",
        url: "https://motplusplusplus.com/afarm",
        provider: { "@id": "https://motplusplusplus.com/#organization" },
        offers: {
          "@type": "Offer",
          price: "3000",
          priceCurrency: "USD",
          priceSpecification: { "@type": "UnitPriceSpecification", price: "3000", priceCurrency: "USD", unitText: "month" },
        },
        locationCreated: { "@type": "Place", name: "Ho Chi Minh City", address: { "@type": "PostalAddress", addressLocality: "Ho Chi Minh City", addressCountry: "VN" } },
        keywords: "artist residency, vietnam, saigon, ho chi minh city, southeast asia, contemporary art",
      },
    ],
  };

  return (
    <html lang="en" className={mono.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: IMG_FADE_SCRIPT }} />
        {/* Self-hosted Inter (see app/globals.css). Preload the latin subset, as next/font did. */}
        <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
