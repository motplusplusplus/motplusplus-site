import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
});

const OG_IMAGE = "https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/general/homepage-programs.jpg";

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
    images: [{ url: OG_IMAGE, width: 1200, height: 800, alt: "MoT+++" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoT+++ | Contemporary Art & Artist Residency — Ho Chi Minh City",
    description:
      "Independent contemporary art and international artist residency in Ho Chi Minh City, Vietnam.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: "https://motplusplusplus.com",
  },
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
        contactPoint: { "@type": "ContactPoint", email: "motplusplusplus@gmail.com", contactType: "general" },
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
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${inter.variable}`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
