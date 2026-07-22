import type { Metadata } from "next";
import MuseumPage, { metadata as museumMetadata } from "@/app/museum/page";

// The homepage is an intentional mirror of /museum (no separate content to maintain).
// Canonical points at /museum, not at root, so search engines treat /museum as the
// authoritative URL for this content instead of indexing two copies.
export const metadata: Metadata = {
  ...museumMetadata,
  alternates: { canonical: "https://motplusplusplus.com/museum" },
};

export default function Home() {
  return <MuseumPage />;
}
