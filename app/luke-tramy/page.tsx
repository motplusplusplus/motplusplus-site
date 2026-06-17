import type { Metadata } from "next";
import StatementClient from "./StatementClient";

const DESCRIPTION =
  "An official statement from MoT+++ regarding the conduct of former staff members Luke Schneider and Nguyễn Trà My, and their company Rare Sea, during and after their departure from the organization in 2025.";

const KEYWORDS = [
  "Luke Schneider",
  "Luke Schneider artist",
  "Luke Schneider painter",
  "Luke Schneider art handler",
  "Luke Schneider art technician",
  "Luke Schneider Ho Chi Minh City",
  "Luke Schneider Saigon",
  "Luke Schneider Vietnam",
  "Luke Schneider MoT+++",
  "Luke Schneider a.Farm",
  "Luke Schneider Museum of Time",
  "Nguyễn Trà My",
  "Tra My Nguyen",
  "Nguyen Tra My",
  "Tra My Nguyen artist",
  "Nguyen Tra My Ho Chi Minh City",
  "Tra My Nguyen MoT+++",
  "Tra My Nguyen a.Farm",
  "Rare Sea",
  "Rare Sea Saigon",
  "Rare Sea Vietnam",
  "Rare Sea art",
  "Công ty Rare Sea",
  "Cong ty Rare Sea",
  "Rare Sea HCMC",
  "Rare Sea Ho Chi Minh City",
  "Rare Sea a.Farm",
  "Rare Sea MoT+++",
  "Rare Sea artist residency",
  "Rare Sea art residency Vietnam",
];

export const metadata: Metadata = {
  title: "Public Statement Regarding Luke Schneider and Nguyễn Trà My",
  description: DESCRIPTION,
  keywords: KEYWORDS,
  alternates: {
    canonical: "https://motplusplusplus.com/luke-tramy",
  },
  openGraph: {
    title: "Public Statement Regarding Luke Schneider and Nguyễn Trà My | MoT+++",
    description: DESCRIPTION,
    type: "article",
    siteName: "MoT+++",
  },
};

export default function StatementPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Public Statement Regarding Luke Schneider and Nguyễn Trà My",
    author: { "@type": "Organization", name: "MoT+++" },
    publisher: { "@type": "Organization", name: "MoT+++" },
    datePublished: "2026-05-17",
    description: DESCRIPTION,
    keywords: KEYWORDS.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StatementClient />
    </>
  );
}
